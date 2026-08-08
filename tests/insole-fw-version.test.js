'use strict';

// getFirmwareVersion() / lastStatus（advertisement保持）の単体テスト。
// 実行: node tests/insole-fw-version.test.js

const assert = require('node:assert/strict');
const { OrpheInsole } = require('../src/ORPHE-INSOLE.js');

function fakeInsole(overrides = {}) {
  return {
    lastStatus: null,
    firmware_version: null,
    gotStatus: null,
    bluetoothDevice: null,
    _log() { },
    getFirmwareVersion: OrpheInsole.prototype.getFirmwareVersion,
    _readFirmwareRevisionString: OrpheInsole.prototype._readFirmwareRevisionString,
    ...overrides,
  };
}

function disDevice(characteristics, { connected = true, serviceError = null } = {}) {
  const calls = { getPrimaryService: 0, reads: [] };
  const device = {
    gatt: {
      connected,
      async getPrimaryService(name) {
        calls.getPrimaryService += 1;
        assert.equal(name, 'device_information');
        if (serviceError) throw serviceError;
        return {
          async getCharacteristic(characteristicName) {
            if (!(characteristicName in characteristics)) {
              throw new Error(`NotFoundError: ${characteristicName}`);
            }
            return {
              async readValue() {
                calls.reads.push(characteristicName);
                return new TextEncoder().encode(characteristics[characteristicName]);
              },
            };
          },
        };
      },
    },
  };
  return { device, calls };
}

function advertisementEvent(bytes, overrides = {}) {
  const dv = new DataView(Uint8Array.from(bytes).buffer);
  return {
    device: { name: 'INS0', id: 'device-id-1' },
    rssi: -55,
    txPower: 0,
    manufacturerData: new Map([[0x0000, dv]]),
    ...overrides,
  };
}

function versionBytes(major, minor, patch) {
  const bytes = new Array(18).fill(0);
  bytes[5] = 1;   // model_type
  bytes[6] = 1;   // mounting_position
  bytes[7] = 0;   // har
  bytes[14] = 2;  // battery
  bytes[15] = major;
  bytes[16] = minor;
  bytes[17] = patch;
  return bytes;
}

async function main() {
  // --- DIS(0x180A) から firmware_revision_string を読める ---
  {
    const { device, calls } = disDevice({ firmware_revision_string: '1.2.3\0' });
    const insole = fakeInsole({ bluetoothDevice: device });
    assert.equal(await insole.getFirmwareVersion(), '1.2.3');
    assert.equal(insole.firmware_version, '1.2.3', 'キャッシュされること');
    assert.deepEqual(calls.reads, ['firmware_revision_string']);

    // 2回目はキャッシュから返り、GATTに触れない
    insole.bluetoothDevice = null;
    assert.equal(await insole.getFirmwareVersion(), '1.2.3');
  }

  // --- firmware_revision_string が無ければ software_revision_string にフォールバック ---
  {
    const { device, calls } = disDevice({ software_revision_string: '2.0.0' });
    const insole = fakeInsole({ bluetoothDevice: device });
    assert.equal(await insole.getFirmwareVersion(), '2.0.0');
    assert.deepEqual(calls.reads, ['software_revision_string']);
  }

  // --- DIS が無い（SecurityError等）→ lastStatus.version にフォールバック ---
  {
    const { device } = disDevice({}, { serviceError: new Error('SecurityError: not allowed') });
    const insole = fakeInsole({
      bluetoothDevice: device,
      lastStatus: { version: '1.0.1' },
    });
    assert.equal(await insole.getFirmwareVersion(), '1.0.1');
  }

  // --- 未接続なら DIS をスキップして lastStatus を使う ---
  {
    const { device, calls } = disDevice({ firmware_revision_string: '9.9.9' }, { connected: false });
    const insole = fakeInsole({
      bluetoothDevice: device,
      lastStatus: { version: '1.0.1' },
    });
    assert.equal(await insole.getFirmwareVersion(), '1.0.1');
    assert.equal(calls.getPrimaryService, 0, '未接続時はGATTに触れないこと');
  }

  // --- どちらも無ければ null（例外を投げない） ---
  {
    const insole = fakeInsole();
    assert.equal(await insole.getFirmwareVersion(), null);
    assert.equal(insole.firmware_version, null, 'nullはキャッシュしないこと');
  }

  // --- onAdvertisementReceived: gotStatus 未設定でも lastStatus が更新される ---
  {
    const insole = fakeInsole();
    OrpheInsole.prototype.onAdvertisementReceived.call(insole, advertisementEvent(versionBytes(1, 0, 1)));
    assert.ok(insole.lastStatus, 'lastStatus が保持されること');
    assert.equal(insole.lastStatus.version, '1.0.1');
    assert.equal(insole.lastStatus.battery, 2);
    assert.equal(insole.lastStatus.mounting_position, 1);
    assert.equal(insole.lastStatus.name, 'INS0');
  }

  // --- onAdvertisementReceived: gotStatus 設定時は両方更新される ---
  {
    let received = null;
    const insole = fakeInsole({ gotStatus: (status) => { received = status; } });
    OrpheInsole.prototype.onAdvertisementReceived.call(insole, advertisementEvent(versionBytes(2, 1, 0)));
    assert.equal(received.version, '2.1.0');
    assert.equal(insole.lastStatus.version, '2.1.0');
  }

  // --- version まで含まない短い manufacturer data は無視する ---
  {
    const insole = fakeInsole({ lastStatus: { version: '1.0.1' } });
    OrpheInsole.prototype.onAdvertisementReceived.call(insole, advertisementEvent(new Array(15).fill(0)));
    assert.equal(insole.lastStatus.version, '1.0.1', '短いpacketで上書きされないこと');

    OrpheInsole.prototype.onAdvertisementReceived.call(insole, advertisementEvent([], { manufacturerData: new Map() }));
    assert.equal(insole.lastStatus.version, '1.0.1', 'manufacturerData 無しでも落ちないこと');
  }

  console.log('insole-fw-version.test.js passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
