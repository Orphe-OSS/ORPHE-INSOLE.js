(function (global) {
    'use strict';

    const SERIAL_MOD = 65536;
    const HALF_SERIAL_RANGE = SERIAL_MOD / 2;

    const PRESET_EXPECTATIONS = {
        rt1: {
            id: 'rt1',
            label: 'Realtime Format 1',
            acquisition: 'realtime',
            streamingMode: 1,
            raw: true,
            step: false,
            nominalSampleHz: 200,
            fields: { acc: true, gyro: true, press: false, quat: true },
        },
        rt3: {
            id: 'rt3',
            label: 'Realtime Format 3',
            acquisition: 'realtime',
            streamingMode: 3,
            raw: true,
            step: false,
            nominalSampleHz: 200,
            fields: { acc: true, gyro: true, press: true, quat: false },
        },
        rt4: {
            id: 'rt4',
            label: 'Realtime Format 4',
            acquisition: 'realtime',
            streamingMode: 4,
            raw: true,
            step: false,
            nominalSampleHz: 100,
            fields: { acc: true, gyro: true, press: true, quat: true },
        },
        fifo: {
            id: 'fifo',
            label: 'FIFO Raw',
            acquisition: 'fifo',
            streamingMode: 4,
            raw: true,
            step: false,
            nominalSampleHz: 200,
            fields: { acc: true, gyro: true, press: true, quat: false },
        },
        step: {
            id: 'step',
            label: 'Step Analysis only',
            acquisition: 'realtime',
            streamingMode: 4,
            raw: false,
            step: true,
            nominalSampleHz: null,
            fields: { acc: false, gyro: false, press: false, quat: false },
        },
        'fifo-step': {
            id: 'fifo-step',
            label: 'FIFO Raw + Step Analysis',
            acquisition: 'fifo',
            streamingMode: 4,
            raw: true,
            step: true,
            nominalSampleHz: 200,
            fields: { acc: true, gyro: true, press: true, quat: false },
        },
    };

    function serialForwardDistance(from, to) {
        return ((to - from) % SERIAL_MOD + SERIAL_MOD) % SERIAL_MOD;
    }

    function createSerialTracker() {
        return {
            first: null,
            lastForward: null,
            maxDistance: -1,
            serials: new Set(),
            duplicates: 0,
            outOfOrder: 0,
            gapEvents: [],
        };
    }

    function recordSerial(tracker, serial) {
        const normalized = Number(serial) & 0xffff;
        if (tracker.serials.has(normalized)) tracker.duplicates += 1;
        tracker.serials.add(normalized);

        if (tracker.first === null) {
            tracker.first = normalized;
            tracker.lastForward = normalized;
            tracker.maxDistance = 0;
            return { kind: 'first', serial: normalized, missing: 0 };
        }

        const fromLast = serialForwardDistance(tracker.lastForward, normalized);
        if (fromLast === 0) {
            return { kind: 'duplicate', serial: normalized, missing: 0 };
        }
        if (fromLast >= HALF_SERIAL_RANGE) {
            tracker.outOfOrder += 1;
            const beforeFirst = serialForwardDistance(normalized, tracker.first);
            if (beforeFirst > 0 && beforeFirst < HALF_SERIAL_RANGE) {
                tracker.first = normalized;
                tracker.maxDistance += beforeFirst;
            }
            return { kind: 'reordered', serial: normalized, missing: 0 };
        }

        const missing = Math.max(0, fromLast - 1);
        if (missing > 0) {
            tracker.gapEvents.push({
                after: tracker.lastForward,
                before: normalized,
                missing,
            });
        }
        tracker.lastForward = normalized;
        tracker.maxDistance = Math.max(
            tracker.maxDistance,
            serialForwardDistance(tracker.first, normalized)
        );
        return { kind: missing > 0 ? 'gap' : 'next', serial: normalized, missing };
    }

    function summarizeSerialTracker(tracker) {
        if (tracker.first === null || tracker.maxDistance < 0) {
            return {
                first: null,
                last: null,
                expected: 0,
                received: 0,
                missing: 0,
                missingRate: 0,
                duplicates: tracker.duplicates,
                outOfOrder: tracker.outOfOrder,
            };
        }
        const expected = tracker.maxDistance + 1;
        let receivedInSpan = 0;
        for (const serial of tracker.serials) {
            if (serialForwardDistance(tracker.first, serial) <= tracker.maxDistance) {
                receivedInSpan += 1;
            }
        }
        const missing = Math.max(0, expected - receivedInSpan);
        return {
            first: tracker.first,
            last: tracker.lastForward,
            expected,
            received: receivedInSpan,
            missing,
            missingRate: expected > 0 ? missing / expected : 0,
            duplicates: tracker.duplicates,
            outOfOrder: tracker.outOfOrder,
        };
    }

    function percentile(values, q) {
        if (!values || values.length === 0) return null;
        const sorted = values.slice().sort((a, b) => a - b);
        const position = (sorted.length - 1) * Math.max(0, Math.min(1, q));
        const lower = Math.floor(position);
        const upper = Math.ceil(position);
        if (lower === upper) return sorted[lower];
        const weight = position - lower;
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }

    function summarizeValues(values) {
        if (!values || values.length === 0) {
            return { count: 0, min: null, median: null, p95: null, max: null, mean: null };
        }
        const sum = values.reduce((total, value) => total + value, 0);
        return {
            count: values.length,
            min: Math.min(...values),
            median: percentile(values, 0.5),
            p95: percentile(values, 0.95),
            max: Math.max(...values),
            mean: sum / values.length,
        };
    }

    function summarizeArrivals(arrivals) {
        if (!arrivals || arrivals.length === 0) {
            return { count: 0, rateHz: 0, intervals: summarizeValues([]) };
        }
        const intervals = [];
        for (let i = 1; i < arrivals.length; i += 1) {
            const interval = arrivals[i] - arrivals[i - 1];
            if (interval >= 0 && Number.isFinite(interval)) intervals.push(interval);
        }
        const elapsed = arrivals.length > 1 ? arrivals[arrivals.length - 1] - arrivals[0] : 0;
        return {
            count: arrivals.length,
            rateHz: elapsed > 0 ? ((arrivals.length - 1) * 1000) / elapsed : 0,
            intervals: summarizeValues(intervals),
        };
    }

    function deviceTimestampToEpoch(timestamp, now = Date.now()) {
        if (!Number.isFinite(timestamp)) return null;
        if (timestamp > 172800000) return timestamp;
        const date = new Date(now);
        date.setHours(0, 0, 0, 0);
        let epoch = date.getTime() + timestamp;
        const day = 86400000;
        if (epoch - now > day / 2) epoch -= day;
        if (now - epoch > day / 2) epoch += day;
        return epoch;
    }

    function fieldRatio(fieldCount, sampleCount) {
        return sampleCount > 0 ? fieldCount / sampleCount : 0;
    }

    function sampleHasField(sample, field) {
        if (!sample) return false;
        if (field === 'acc') return Boolean(sample.acc || sample.converted_acc);
        if (field === 'gyro') return Boolean(sample.gyro || sample.converted_gyro);
        return Boolean(sample[field]);
    }

    /**
     * ToolkitはRaw/Stepの同時OFFを許可しないため、設定切替中だけ使う安全な中間出力。
     * Rawを維持し、現在または切替先で必要なStepを先に購読してから最終出力へ移る。
     */
    function safeOutputBridge(currentOutputs = {}, targetOutputs = {}) {
        return {
            sensorValues: true,
            stepAnalysis: Boolean(currentOutputs.stepAnalysis || targetOutputs.stepAnalysis),
        };
    }

    /**
     * FIFOはホスト側の同時BLE要求数で結果が変わるため、単体baselineと2台負荷試験を分ける。
     */
    function classifyRunProfile(preset, activeDeviceCount) {
        const count = Math.max(0, Number(activeDeviceCount) || 0);
        if (!preset || preset.acquisition !== 'fifo') {
            return {
                id: 'standard',
                label: `${count}台 通常計測`,
                fifo: false,
                dualHostStress: false,
            };
        }
        if (count <= 1) {
            return {
                id: 'fifo-single-baseline',
                label: 'FIFO単体 baseline',
                fifo: true,
                dualHostStress: false,
            };
        }
        return {
            id: 'fifo-dual-host-stress',
            label: `FIFO ${count}台同時 Host負荷試験`,
            fifo: true,
            dualHostStress: true,
        };
    }

    function evaluateDeviceRun(stats, preset) {
        const checks = [];
        const add = (level, label, detail) => checks.push({ level, label, detail });
        const rawSamples = stats.rawSamples || 0;
        const rawPackets = stats.rawPackets || 0;
        const durationSec = Math.max(0.001, stats.durationSec || 0);

        if (preset.raw) {
            add(
                rawPackets > 0 ? 'pass' : 'fail',
                'Raw packet',
                rawPackets > 0 ? `${rawPackets} packets` : '受信なし'
            );
            for (const field of ['acc', 'gyro', 'press', 'quat']) {
                const expected = preset.fields[field];
                const ratio = fieldRatio(stats.fieldCounts[field] || 0, rawSamples);
                if (expected) {
                    add(
                        ratio >= 0.9 ? 'pass' : ratio > 0 ? 'warn' : 'fail',
                        field,
                        `${(ratio * 100).toFixed(1)}% samples`
                    );
                } else {
                    add(
                        ratio <= 0.01 ? 'pass' : 'warn',
                        `${field}なし`,
                        `${(ratio * 100).toFixed(1)}% samples`
                    );
                }
            }

            const effectiveHz = rawSamples / durationSec;
            if (preset.nominalSampleHz) {
                const ratio = effectiveHz / preset.nominalSampleHz;
                add(
                    ratio >= 0.6 && ratio <= 1.35 ? 'pass' : 'warn',
                    '実効sample Hz',
                    `${effectiveHz.toFixed(1)} / nominal ${preset.nominalSampleHz}`
                );
            }

            const serial = stats.serial || { missing: 0, expected: 0 };
            add(
                serial.missing === 0 ? 'pass' : 'warn',
                'serial continuity',
                `${serial.missing} missing / ${serial.expected} expected`
            );

            if (preset.acquisition === 'fifo') {
                add(
                    (stats.fifoDropped || 0) === 0 ? 'pass' : 'warn',
                    'FIFO dropped',
                    String(stats.fifoDropped || 0)
                );
                add(
                    (stats.unexpectedRealtimePackets || 0) === 0 ? 'pass' : 'warn',
                    'Realtime notify停止',
                    `${stats.unexpectedRealtimePackets || 0} packets after settle`
                );
                if (stats.finished) {
                    const drainOk = stats.fifoStopped && !stats.fifoDrainError;
                    add(
                        drainOk ? 'pass' : 'fail',
                        'FIFO stop / drain',
                        drainOk
                            ? `recovered ${stats.fifoDrainRecovered || 0}, ${Math.round(stats.fifoDrainMs || 0)} ms`
                            : stats.fifoDrainError || 'onStopped未確認'
                    );
                }
                const profile = stats.runProfile || classifyRunProfile(preset, stats.activeDeviceCount || 1);
                const hasLoss = serial.missing > 0 || (stats.fifoDropped || 0) > 0;
                if (profile.dualHostStress) {
                    add(
                        hasLoss ? 'warn' : 'pass',
                        '2台同時FIFO条件',
                        hasLoss
                            ? 'このMac/Web Bluetoothの既知負荷条件。単体baselineと比較'
                            : '同時負荷でも最終欠損なし'
                    );
                } else {
                    add(
                        hasLoss ? 'warn' : 'pass',
                        '単体FIFO baseline',
                        hasLoss ? '単体でも欠損あり。デバイス/リンクを確認' : '最終欠損なし'
                    );
                }
            }
        } else {
            add(
                (stats.unexpectedRealtimePackets || 0) === 0 ? 'pass' : 'warn',
                'Raw停止',
                (stats.unexpectedRealtimePackets || 0) === 0
                    ? 'SENSOR_VALUES 0 packets'
                    : `${stats.unexpectedRealtimePackets} packets after settle`
            );
        }

        if (preset.step) {
            add(
                (stats.stepPackets || 0) > 0 ? 'pass' : 'fail',
                'Step notify',
                `${stats.stepPackets || 0} packets`
            );
            add(
                (stats.completedSteps || 0) > 0 ? 'pass' : 'warn',
                '完成step',
                `${stats.completedSteps || 0} rows`
            );
        }

        let level = 'pass';
        if (checks.some((check) => check.level === 'fail')) level = 'fail';
        else if (checks.some((check) => check.level === 'warn')) level = 'warn';
        return { level, checks };
    }

    const api = {
        SERIAL_MOD,
        PRESET_EXPECTATIONS,
        serialForwardDistance,
        createSerialTracker,
        recordSerial,
        summarizeSerialTracker,
        percentile,
        summarizeValues,
        summarizeArrivals,
        deviceTimestampToEpoch,
        sampleHasField,
        safeOutputBridge,
        classifyRunProfile,
        evaluateDeviceRun,
    };

    global.ToolkitValidationMetrics = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
