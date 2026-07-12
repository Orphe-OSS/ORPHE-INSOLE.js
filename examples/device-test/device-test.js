// ORPHE INSOLE 実機チェックページ（PR#4: characteristic UUID別管理の検証）
// 通知（SENSOR_VALUES）中の read/write（DEVICE_INFORMATION）が通知を壊さないことを
// 実機で確認する自動テストシーケンス。

/* global OrpheInsole */

var insole = new OrpheInsole(0);
insole.setup();
insole.debug = true;

// ── 受信カウンタ ─────────────────────────────────────────────
var counters = { press: 0, quat: 0, lost: 0 };
var lastFreq = 0;

insole.gotPress = function () { counters.press++; };
insole.gotQuat = function () { counters.quat++; };
insole.gotBLEFrequency = function (frequency) { lastFreq = frequency; };
insole.lostData = function () { counters.lost++; setText('mLost', String(counters.lost)); };
insole.onConnect = function () { setText('mConn', '接続中'); };
insole.onDisconnect = function () { setText('mConn', '切断'); };
insole.onError = function (error) { log('onError: ' + error, true); };
insole.onReconnectSuccess = function (info) { log('自動再接続に成功 (attempt ' + info.attempt + ')'); };

// ── UI ヘルパ ────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }
function setText(id, text) { $(id).textContent = text; }
function log(message, isWarn) {
  var line = new Date().toLocaleTimeString() + '  ' + message;
  var el = document.createElement('div');
  if (isWarn) el.className = 'warn';
  el.textContent = line;
  $('log').appendChild(el);
  $('log').scrollTop = $('log').scrollHeight;
}
function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

// 1秒ごとにレート表示を更新
var prevCounts = { press: 0, quat: 0 };
setInterval(function () {
  setText('mPress', (counters.press - prevCounts.press) + ' Hz');
  setText('mQuat', (counters.quat - prevCounts.quat) + ' Hz');
  setText('mFreq', lastFreq + ' Hz');
  prevCounts.press = counters.press;
  prevCounts.quat = counters.quat;
}, 1000);

// 指定時間 press/quat のサンプル数を計測する
async function measureRates(ms) {
  var start = { press: counters.press, quat: counters.quat };
  await wait(ms);
  return {
    press: (counters.press - start.press) * 1000 / ms,
    quat: (counters.quat - start.quat) * 1000 / ms
  };
}

// ── テスト定義 ───────────────────────────────────────────────
// mode 4 の期待レート: press/quat ≈ 100Hz。閾値は緩め（BLE環境差を許容）。
var RATE_MIN = 50; // Hz: これ未満は「データが流れていない」とみなす

var tests = [
  {
    name: 'T1: begin(mode4) 後にデータが流れる（press/quat ≈ 100Hz）',
    run: async function () {
      var rates = await measureRates(3000);
      var ok = rates.press > RATE_MIN && rates.quat > RATE_MIN;
      return { ok: ok, observed: 'press ' + rates.press.toFixed(0) + 'Hz / quat ' + rates.quat.toFixed(0) + 'Hz' };
    }
  },
  {
    name: 'T2: 通知中に getDeviceInformation() ×5 → 全て成功しデータ継続',
    run: async function () {
      var batteries = [];
      for (var i = 0; i < 5; i++) {
        var info = await insole.getDeviceInformation();
        batteries.push(info.battery);
        setText('mBatt', String(info.battery));
        await wait(150);
      }
      var rates = await measureRates(3000);
      var ok = batteries.length === 5 && rates.press > RATE_MIN;
      return { ok: ok, observed: 'battery=' + batteries.join(',') + ' / press ' + rates.press.toFixed(0) + 'Hz' };
    }
  },
  {
    name: 'T3: 通知確立と read の同時実行（await せず並行）でもデータ継続',
    run: async function () {
      // 修正前の実装で最も壊れやすいパターン:
      // stopNotify → startNotify の通知再確立中に read を並行実行する
      await insole.stopNotify('SENSOR_VALUES');
      var notifyPromise = insole.startNotify('SENSOR_VALUES');
      var readPromise = insole.getDeviceInformation(); // await せずに並行実行
      await Promise.all([notifyPromise, readPromise]);
      var rates = await measureRates(3000);
      var ok = rates.press > RATE_MIN;
      return { ok: ok, observed: 'press ' + rates.press.toFixed(0) + 'Hz（並行実行後）' };
    }
  },
  {
    name: 'T4: 通知中に setDataStreamingMode(3→4) → quat 停止と再開',
    run: async function () {
      await insole.setDataStreamingMode(3);
      await wait(500);
      var mode3 = await measureRates(2000);
      await insole.setDataStreamingMode(4);
      await wait(500);
      var mode4 = await measureRates(2000);
      var ok = mode3.quat < 5 && mode3.press > RATE_MIN && mode4.quat > RATE_MIN;
      return {
        ok: ok,
        observed: 'mode3: press ' + mode3.press.toFixed(0) + 'Hz / quat ' + mode3.quat.toFixed(0) + 'Hz → mode4: quat ' + mode4.quat.toFixed(0) + 'Hz'
      };
    }
  },
  {
    name: 'T5: stopNotify で1秒以内にデータ停止',
    run: async function () {
      await insole.stopNotify('SENSOR_VALUES');
      await wait(1000); // 停止反映を待つ
      var rates = await measureRates(1500);
      var ok = rates.press < 5;
      return { ok: ok, observed: '停止後 press ' + rates.press.toFixed(1) + 'Hz' };
    }
  },
  {
    name: 'T6: startNotify 再開 → レートが正常（リスナー二重登録で2倍になっていない）',
    run: async function () {
      await insole.startNotify('SENSOR_VALUES');
      await wait(500);
      var rates = await measureRates(3000);
      var ok = rates.press > RATE_MIN && rates.press < 160; // 2重登録なら ~200Hz になる
      return { ok: ok, observed: 'press ' + rates.press.toFixed(0) + 'Hz（100Hz想定・160Hz未満で合格）' };
    }
  }
];

// ── テスト実行・結果表示 ─────────────────────────────────────
var results = [];

function renderRows() {
  var tbody = $('testRows');
  tbody.innerHTML = '';
  tests.forEach(function (test, i) {
    var row = document.createElement('tr');
    var result = results[i];
    var status = result === undefined ? '' : (result === 'running' ? '⏳' : (result.ok ? '✅' : '❌'));
    var observed = (result && result.observed) || '';
    [String(i + 1), test.name, status, observed].forEach(function (text, col) {
      var cell = document.createElement('td');
      if (col === 2) cell.className = 'status';
      cell.textContent = text;
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
}
renderRows();

async function runAll() {
  $('btnRun').disabled = true;
  results = [];
  for (var i = 0; i < tests.length; i++) {
    results[i] = 'running';
    renderRows();
    log('実行中: ' + tests[i].name);
    try {
      results[i] = await tests[i].run();
    } catch (error) {
      results[i] = { ok: false, observed: 'エラー: ' + error };
      log('エラー: ' + error, true);
    }
    log((results[i].ok ? 'PASS' : 'FAIL') + ' — ' + results[i].observed, !results[i].ok);
    renderRows();
  }
  $('btnRun').disabled = false;
  $('btnCopy').disabled = false;
  var failed = results.filter(function (r) { return !r.ok; }).length;
  log(failed === 0 ? '=== 自動テスト全て PASS ===' : '=== 自動テスト ' + failed + ' 件 FAIL ===', failed > 0);
}

function buildReport() {
  var lines = ['## PR#4 実機チェック結果', '', '実施日時: ' + new Date().toLocaleString(), 'UA: ' + navigator.userAgent, ''];
  lines.push('### 自動テスト');
  tests.forEach(function (test, i) {
    var result = results[i];
    lines.push('- ' + (result && result.ok ? '✅' : '❌') + ' ' + test.name + ' — ' + ((result && result.observed) || '未実行'));
  });
  lines.push('', '### 手動チェック');
  Array.prototype.forEach.call(document.querySelectorAll('#manualChecks input[type=checkbox]'), function (box) {
    lines.push('- ' + (box.checked ? '✅' : '⬜') + ' ' + box.parentElement.textContent.trim());
  });
  lines.push('', '- lostData 累計: ' + counters.lost);
  return lines.join('\n');
}

// ── イベント ────────────────────────────────────────────────
$('btnConnect').addEventListener('click', async function () {
  try {
    await insole.begin('SENSOR_VALUES', { streamingMode: 4, autoReconnect: true });
    $('btnRun').disabled = false;
    $('btnDisconnect').disabled = false;
    $('btnSelect').disabled = false;
    log('begin() 完了。データ受信を開始しました。');
  } catch (error) {
    log('接続失敗: ' + error, true);
  }
});

$('btnDisconnect').addEventListener('click', function () {
  insole.reset();
  $('btnRun').disabled = true;
  $('btnSelect').disabled = true;
  log('reset() 実行（手動切断・自動再接続も解除）');
});

$('btnSelect').addEventListener('click', async function () {
  try {
    await insole.selectBluetoothDevice();
    await insole.begin('SENSOR_VALUES', { streamingMode: 4, autoReconnect: true });
    log('デバイス切替 + begin() 完了');
  } catch (error) {
    log('切替失敗: ' + error, true);
  }
});

$('btnRun').addEventListener('click', runAll);

$('btnCopy').addEventListener('click', function () {
  navigator.clipboard.writeText(buildReport()).then(function () {
    log('結果をクリップボードにコピーしました（PR#4 のプルリクエストコメントに貼ってください）');
  });
});
