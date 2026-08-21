// CoreCompanionToolkit.js の単体テスト。
// 実機・ブラウザなしで、CORE スタブ + 疑似DOM を使って以下を検証する:
//   1. ORPHE-CORE.js 未読み込み時（Orphe === OrpheInsole）はエラーで案内する
//   2. CORE 読み込み時は orpheCore を生成し、トグルONで begin() が
//      設定どおりの notification / range / forceDeviceSelection で呼ばれる
//   3. トグルOFFで reset() が呼ばれる
//   4. begin() が settle しない場合（CORE SDK の既知の問題）でも
//      connectTimeoutMs でトグルが戻る
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const INSOLE_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'ORPHE-INSOLE.js'), 'utf8');
const TOOLKIT_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'CoreCompanionToolkit.js'), 'utf8');

// ORPHE-CORE.js がトップレベルで宣言する識別子のスタブ。
// begin/reset 等の呼び出しを記録し、テストから検証できるようにする。
const CORE_STUB = `
var orphe_js_version_date = 'core-stub';
function loadScript(src) {}
class FixedSizeArray { constructor(size) { this.size = size; } }
class OrpheTimestamp { }
class Orphe {
  constructor(id = 0) {
    this.id = id;
    this.isCore = true;
    this.calls = [];
    this.beginBehavior = 'resolve'; // 'resolve' | 'never'
  }
  setup() { this.calls.push(['setup']); }
  begin(type, options) {
    this.calls.push(['begin', type, options]);
    if (this.beginBehavior === 'never') return new Promise(() => { });
    return Promise.resolve('done begin(); (stub)');
  }
  reset() { this.calls.push(['reset']); }
  stop() { this.calls.push(['stop']); }
  setLED(on_off, pattern) { this.calls.push(['setLED', on_off, pattern]); }
  resetMotionSensorAttitude() { this.calls.push(['resetMotionSensorAttitude']); }
  resetAnalysisLogs() { this.calls.push(['resetAnalysisLogs']); }
  getDeviceInformation() {
    this.calls.push(['getDeviceInformation']);
    return Promise.resolve({ battery: 2, range: { acc: 3, gyro: 3 } });
  }
  gotBLEFrequency(freq) { }
  onDisconnect() { }
  onScan(name) { this.calls.push(['onScan', name]); }
  onRead(data, uuid) {
    this.calls.push(['onRead', uuid, data.byteLength, data.getUint8(0)]);
  }
  _isBluetoothDeviceDisallowed(device, options) { return false; }
}
Orphe.prototype.ORPHE_INFORMATION = '01a9d6b5-ff6e-444a-b266-0be75e85c064';
Orphe.prototype.ORPHE_OTHER_SERVICE = 'db1b7aca-cda5-4453-a49b-33a53d3f0833';
`;

// ── 疑似DOM ─────────────────────────────────────────────────────
function createFakeDom() {
  const registry = [];
  function makeElement(tag) {
    const el = {
      tagName: tag,
      innerHTML: '',
      classList: '',
      style: {},
      children: [],
      listeners: {},
      attributes: {},
      checked: false,
      get id() { return this.attributes.id ?? this._id; },
      set id(v) { this._id = v; },
      setAttribute(name, value) { this.attributes[name] = value; },
      getAttribute(name) { return this.attributes[name]; },
      appendChild(child) { this.children.push(child); },
      addEventListener(type, fn) {
        (this.listeners[type] = this.listeners[type] || []).push(fn);
      },
      // classList.add 互換（battery 表示用）。classList は文字列代入もされるため
      // add はプロトタイプではなくここで吸収しない（テスト対象では未使用経路）
    };
    registry.push(el);
    return el;
  }
  const documentMock = {
    readyState: 'complete',
    scripts: [],
    head: { appendChild() { } },
    createElement: (tag) => makeElement(tag),
    addEventListener() { },
    querySelector(selector) {
      if (!selector.startsWith('#')) return null;
      const id = selector.slice(1);
      return registry.find(el => el.id === id) || null;
    },
  };
  return { documentMock, makeElement, registry };
}

function createContext(documentMock) {
  const ctx = vm.createContext({
    console, performance, Date, Math, JSON, Promise, Number, Object, Array,
    setTimeout, clearTimeout,
    document: documentMock,
    navigator: {},
    localStorage: { getItem: () => null, setItem() { }, removeItem() { } },
    DataView, ArrayBuffer, Uint8Array,
  });
  ctx.globalThis = ctx;
  ctx.window = ctx;
  return ctx;
}

function fireChange(input, checked) {
  input.checked = checked;
  const handlers = input.listeners['change'] || [];
  const results = handlers.map(fn => fn.call(input));
  return Promise.all(results);
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  // ── 1. CORE 未読み込み（INSOLE 単独）ではエラーで案内 ─────────
  {
    const { documentMock, makeElement } = createFakeDom();
    const ctx = createContext(documentMock);
    vm.runInContext(INSOLE_SRC, ctx, { filename: 'ORPHE-INSOLE.js' });
    vm.runInContext(TOOLKIT_SRC, ctx, { filename: 'CoreCompanionToolkit.js' });
    ctx.__parent = makeElement('div');
    assert.throws(
      () => vm.runInContext(`buildCoreCompanionToolkit(__parent, 'CORE')`, ctx),
      /ORPHE-CORE\.js/,
      'must explain that ORPHE-CORE.js is required'
    );
    const loaded = vm.runInContext('isOrpheCoreSdkLoaded()', ctx);
    assert.equal(loaded, false, 'INSOLE alias must not count as CORE');
  }

  // ── 2. CORE + INSOLE 読み込みで build → トグルON → begin ──────
  {
    const { documentMock, makeElement } = createFakeDom();
    const ctx = createContext(documentMock);
    vm.runInContext(CORE_STUB, ctx, { filename: 'ORPHE-CORE.js (stub)' });
    vm.runInContext(INSOLE_SRC, ctx, { filename: 'ORPHE-INSOLE.js' });
    vm.runInContext(TOOLKIT_SRC, ctx, { filename: 'CoreCompanionToolkit.js' });

    assert.equal(vm.runInContext('isOrpheCoreSdkLoaded()', ctx), true);

    ctx.__parent = makeElement('div');
    vm.runInContext(`buildCoreCompanionToolkit(__parent, 'CORE', {
      notification: 'SENSOR_VALUES',
      range: { acc: 8, gyro: 1000 }
    })`, ctx);

    const orpheCore = ctx.orpheCore;
    assert.ok(orpheCore && orpheCore.isCore === true, 'orpheCore must be a CORE instance');
    assert.equal(orpheCore.calls[0][0], 'setup', 'setup() must be called at build time');
    assert.ok(ctx.__parent.children.length > 0, 'UI must be appended to parent');

    // トグルON
    const input = documentMock.querySelector('#switch_core0');
    assert.ok(input, 'switch_core0 must exist');
    await fireChange(input, true);
    await wait(10);

    const beginCall = orpheCore.calls.find(c => c[0] === 'begin');
    assert.ok(beginCall, 'begin() must be called on toggle ON');
    assert.equal(beginCall[1], 'SENSOR_VALUES', 'notification option must be passed');
    assert.equal(beginCall[2].range.acc, 8, 'range.acc option must be passed');
    assert.equal(beginCall[2].range.gyro, 1000, 'range.gyro option must be passed');
    assert.equal(beginCall[2].forceDeviceSelection, true, 'device chooser must be forced');

    const ui = documentMock.querySelector('#ui_core0');
    assert.equal(ui.style.visibility, 'visible', 'UI must be shown after successful begin');

    // ── 3. トグルOFF → reset ──────────────────────────────────
    await fireChange(input, false);
    await wait(10);
    assert.ok(orpheCore.calls.some(c => c[0] === 'reset'), 'reset() must be called on toggle OFF');
    assert.equal(ui.style.visibility, 'hidden', 'UI must be hidden after toggle OFF');

    // notification 変更は次回接続時に反映
    vm.runInContext(`changeCoreCompanionNotification({ value: 'STEP_ANALYSIS' })`, ctx);
    orpheCore.calls.length = 0;
    await fireChange(input, true);
    await wait(10);
    const beginCall2 = orpheCore.calls.find(c => c[0] === 'begin');
    assert.equal(beginCall2[1], 'STEP_ANALYSIS', 'changed notification must be used on next connect');
  }

  // ── 4. requestDevice が namePrefix + services の ORフィルタに
  //       差し替えられている（実機 CORE はサービスUUIDをアドバタイズ
  //       しないため、標準の services フィルタだけでは chooser に出ない）─
  {
    const { documentMock, makeElement } = createFakeDom();
    const ctx = createContext(documentMock);
    vm.runInContext(CORE_STUB, ctx, { filename: 'ORPHE-CORE.js (stub)' });
    vm.runInContext(INSOLE_SRC, ctx, { filename: 'ORPHE-INSOLE.js' });
    vm.runInContext(TOOLKIT_SRC, ctx, { filename: 'CoreCompanionToolkit.js' });

    ctx.__parent = makeElement('div');
    vm.runInContext(`buildCoreCompanionToolkit(__parent, 'CORE')`, ctx);

    let capturedOptions = null;
    const fakeDevice = {
      id: 'dev-1', name: 'CR-3 TEST',
      addEventListener() { }, gatt: { connected: false },
    };
    ctx.navigator.bluetooth = {
      requestDevice(opts) {
        capturedOptions = opts;
        return Promise.resolve(fakeDevice);
      }
    };

    await ctx.orpheCore.requestDevice('DEVICE_INFORMATION');
    assert.ok(capturedOptions, 'navigator.bluetooth.requestDevice must be called');
    const prefixes = capturedOptions.filters
      .filter(f => f.namePrefix).map(f => f.namePrefix);
    assert.ok(prefixes.includes('CR-'), 'chooser filter must include namePrefix CR-');
    const serviceFilters = capturedOptions.filters.filter(f => f.services);
    assert.equal(serviceFilters.length, 1, 'services filter must be kept as OR condition');
    assert.equal(serviceFilters[0].services[0], '01a9d6b5-ff6e-444a-b266-0be75e85c064');
    assert.equal(ctx.orpheCore.bluetoothDevice, fakeDevice, 'selected device must be assigned');
    assert.ok(ctx.orpheCore.calls.some(c => c[0] === 'onScan' && c[1] === 'CR-3 TEST'),
      'onScan must be called with device name');

    // chooserNamePrefix オプションで差し替え可能
    vm.runInContext(`buildCoreCompanionToolkit(__parent, 'CORE', { chooserNamePrefix: 'ORPHE' })`, ctx);
    await ctx.orpheCore.requestDevice('DEVICE_INFORMATION');
    const prefixes2 = capturedOptions.filters
      .filter(f => f.namePrefix).map(f => f.namePrefix);
    assert.ok(prefixes2.includes('ORPHE'), 'chooserNamePrefix option must override the prefix');
  }

  // ── 5. CORE 3.0 の 200Hz SENSOR_VALUES（header 50・104バイト）が
  //       先頭92バイトに切り直されて既存パーサへ渡る ────────────────
  {
    const { documentMock, makeElement } = createFakeDom();
    const ctx = createContext(documentMock);
    vm.runInContext(CORE_STUB, ctx, { filename: 'ORPHE-CORE.js (stub)' });
    vm.runInContext(INSOLE_SRC, ctx, { filename: 'ORPHE-INSOLE.js' });
    vm.runInContext(TOOLKIT_SRC, ctx, { filename: 'CoreCompanionToolkit.js' });

    ctx.__parent = makeElement('div');
    vm.runInContext(`buildCoreCompanionToolkit(__parent, 'CORE')`, ctx);
    const orpheCore = ctx.orpheCore;

    function makePacket(len, header) {
      const dv = new DataView(new ArrayBuffer(len));
      dv.setUint8(0, header);
      return dv;
    }

    // CORE 3.0 の 104バイト header 50 → 92バイトに切り直し
    orpheCore.calls.length = 0;
    orpheCore.onRead(makePacket(104, 50), 'SENSOR_VALUES');
    let read = orpheCore.calls.find(c => c[0] === 'onRead');
    assert.equal(read[2], 92, 'CORE 3.0 104-byte packet must be trimmed to 92 bytes');
    assert.equal(read[3], 50, 'header byte must be preserved');

    // 従来の 92バイト header 50 はそのまま
    orpheCore.calls.length = 0;
    orpheCore.onRead(makePacket(92, 50), 'SENSOR_VALUES');
    read = orpheCore.calls.find(c => c[0] === 'onRead');
    assert.equal(read[2], 92, 'legacy 92-byte packet must pass through unchanged');

    // header 50 以外の 104バイトはそのまま（誤トリム防止）
    orpheCore.calls.length = 0;
    orpheCore.onRead(makePacket(104, 40), 'SENSOR_VALUES');
    read = orpheCore.calls.find(c => c[0] === 'onRead');
    assert.equal(read[2], 104, 'non-header-50 packet must pass through unchanged');

    // STEP_ANALYSIS はトリム対象外
    orpheCore.calls.length = 0;
    orpheCore.onRead(makePacket(104, 50), 'STEP_ANALYSIS');
    read = orpheCore.calls.find(c => c[0] === 'onRead');
    assert.equal(read[2], 104, 'STEP_ANALYSIS packets must pass through unchanged');
  }

  // ── 6. begin() が settle しない場合はタイムアウトでトグルが戻る ─
  {
    const { documentMock, makeElement } = createFakeDom();
    const ctx = createContext(documentMock);
    vm.runInContext(CORE_STUB, ctx, { filename: 'ORPHE-CORE.js (stub)' });
    vm.runInContext(INSOLE_SRC, ctx, { filename: 'ORPHE-INSOLE.js' });
    vm.runInContext(TOOLKIT_SRC, ctx, { filename: 'CoreCompanionToolkit.js' });

    ctx.__parent = makeElement('div');
    vm.runInContext(`buildCoreCompanionToolkit(__parent, 'CORE', { connectTimeoutMs: 50 })`, ctx);
    ctx.orpheCore.beginBehavior = 'never';

    const input = documentMock.querySelector('#switch_core0');
    await fireChange(input, true);
    await wait(150);
    assert.equal(input.checked, false, 'switch must be turned back off after connect timeout');
    const ui = documentMock.querySelector('#ui_core0');
    assert.equal(ui.style.visibility, 'hidden', 'UI must stay hidden after connect timeout');
  }

  console.log('core-companion-toolkit.test.js passed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
