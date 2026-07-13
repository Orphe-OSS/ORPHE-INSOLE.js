const assert = require('node:assert/strict');
const { OrpheInsoleSimulator } = require('../src/InsoleSimulator.js');

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function collectFor(options, ms = 300) {
    const simulator = new OrpheInsoleSimulator(0);
    const calls = {
        press: [],
        acc: [],
        gyro: [],
        quat: [],
        euler: [],
        convertedAcc: [],
        convertedGyro: [],
        frequency: []
    };
    simulator.gotPress = value => calls.press.push(value);
    simulator.gotAcc = value => calls.acc.push(value);
    simulator.gotGyro = value => calls.gyro.push(value);
    simulator.gotQuat = value => calls.quat.push(value);
    simulator.gotEuler = value => calls.euler.push(value);
    simulator.gotConvertedAcc = value => calls.convertedAcc.push(value);
    simulator.gotConvertedGyro = value => calls.convertedGyro.push(value);
    simulator.gotBLEFrequency = value => calls.frequency.push(value);
    await simulator.begin(options);
    await wait(ms);
    return { simulator, calls };
}

async function main() {
    {
        const { simulator, calls } = await collectFor({ preset: 'stand', streamingMode: 4 }, 300);
        simulator.stop();

        assert.equal(simulator.isConnected(), false);
        assert.ok(simulator.device_information);
        assert.deepEqual(simulator.device_information.range, { acc: 3, gyro: 3 });
        assert.ok(calls.press.length >= 21 && calls.press.length <= 39, `mode 4 sample count: ${calls.press.length}`);
        assert.ok(calls.press.every(sample => sample.values.length === 6));
        assert.ok(calls.press.every(sample => sample.values.every(value => value >= 0 && value <= 65535)));
        assert.ok(calls.quat.length > 0);
        assert.ok(calls.euler.length > 0);
        assert.ok(calls.frequency.every(value => value === 50));
    }

    {
        const { simulator, calls } = await collectFor({ preset: 'walk', streamingMode: 3 }, 120);
        simulator.stop();
        assert.ok(calls.press.length > 0);
        assert.equal(calls.quat.length, 0);
        assert.equal(calls.euler.length, 0);
    }

    {
        const { simulator, calls } = await collectFor({ preset: 'walk', streamingMode: 1 }, 120);
        simulator.stop();
        assert.ok(calls.quat.length > 0);
        assert.equal(calls.press.length, 0);
    }

    {
        const { simulator, calls } = await collectFor({ preset: 'sway', streamingMode: 4 }, 120);
        assert.ok(calls.press.length > 0);
        const pressCount = calls.press.length;
        const accCount = calls.acc.length;
        simulator.stop();
        await wait(100);
        assert.equal(calls.press.length, pressCount);
        assert.equal(calls.acc.length, accCount);
    }

    {
        const frame = {
            device: 0,
            t: 123,
            serial: 42,
            press: [1, 2, 3, 4, 5, 6],
            acc: { x: 8, y: -4, z: 16 },
            gyro: { x: 200, y: -400, z: 1000 },
            quat: { w: 1, x: 0, y: 0.1, z: 0 },
            euler: { pitch: 0.2, roll: -0.1, yaw: 0.05 }
        };
        const simulator = new OrpheInsoleSimulator(0);
        const calls = { press: [], acc: [], convertedAcc: [], convertedGyro: [], quat: [], euler: [] };
        simulator.gotPress = value => calls.press.push(value);
        simulator.gotAcc = value => calls.acc.push(value);
        simulator.gotConvertedAcc = value => calls.convertedAcc.push(value);
        simulator.gotConvertedGyro = value => calls.convertedGyro.push(value);
        simulator.gotQuat = value => calls.quat.push(value);
        simulator.gotEuler = value => calls.euler.push(value);

        await simulator.begin({ frames: [frame], loop: false, streamingMode: 4 });
        await wait(50);

        assert.equal(simulator.isConnected(), false);
        assert.deepEqual(calls.press[0].values, frame.press);
        assert.equal(calls.press[0].timestamp, frame.t);
        assert.equal(calls.press[0].serial_number, frame.serial);
        assert.equal(calls.acc[0].x, frame.acc.x / 16);
        assert.equal(calls.acc[0].y, frame.acc.y / 16);
        assert.equal(calls.acc[0].z, frame.acc.z / 16);
        assert.deepEqual(
            {
                x: calls.convertedAcc[0].x,
                y: calls.convertedAcc[0].y,
                z: calls.convertedAcc[0].z
            },
            frame.acc
        );
        assert.deepEqual(
            {
                x: calls.convertedGyro[0].x,
                y: calls.convertedGyro[0].y,
                z: calls.convertedGyro[0].z
            },
            frame.gyro
        );
        assert.equal(calls.quat[0].w, frame.quat.w);
        assert.equal(calls.euler[0].pitch, frame.euler.pitch);
    }

    // ── InsoleToolkit 互換メソッド（PR#6 で追加） ──────────────────
    {
        const simulator = new OrpheInsoleSimulator(1);

        // getDeviceInformation は begin 前でも既定値を返す
        const info = await simulator.getDeviceInformation();
        assert.equal(info.mount_position, 1, 'id=1 → RIGHT');
        assert.deepEqual(info.range, { acc: 3, gyro: 3 });

        // setDataStreamingMode: 実行中のモード切替が次 tick から反映される
        const calls = { press: [], quat: [] };
        simulator.gotPress = (value) => calls.press.push(value);
        simulator.gotQuat = (value) => calls.quat.push(value);
        await simulator.begin({ preset: 'stand', streamingMode: 4 });
        assert.equal(simulator.streaming_mode, 4);
        await wait(100);
        assert.ok(calls.quat.length > 0, 'mode 4 emits quat');

        await simulator.setDataStreamingMode(3);
        assert.equal(simulator.streaming_mode, 3);
        const quatCountAtSwitch = calls.quat.length;
        const pressCountAtSwitch = calls.press.length;
        await wait(120);
        assert.equal(calls.quat.length, quatCountAtSwitch, 'mode 3 stops quat');
        assert.ok(calls.press.length > pressCountAtSwitch, 'press keeps flowing after switch');

        // 実SDKと同じエラーメッセージで不正モードを拒否
        await assert.rejects(() => simulator.setDataStreamingMode(2), /Invalid ORPHE INSOLE data streaming mode/);
        assert.equal(simulator.streaming_mode, 3, 'invalid mode does not change state');

        // resetAnalysisLogs は no-op（例外を投げない）
        simulator.resetAnalysisLogs();
        simulator.stop();
    }
}

main().then(() => {
    console.log('insole-simulator.test.js passed');
}).catch(error => {
    console.error(error);
    process.exit(1);
});
