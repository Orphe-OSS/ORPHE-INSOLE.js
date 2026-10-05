/**
 * ORPHE INSOLE — Calibrated Pressure [N]
 *
 * 校正済みの圧力値（荷重[N]）を 6ch の折れ線グラフで表示する最小サンプル。
 *
 *  - gotPress          : ADC 生値
 *  - gotConvertedPress : 荷重[N]（このサンプルで使う）
 *
 * 校正値は begin() の中でデバイスから自動取得され、insole.pressure_calibration に入る。
 * 取得できないデバイスでは null になり、SDK 内蔵の既定係数で換算される。
 */

const HISTORY = 100; // グラフに表示するサンプル数
const LABELS = ['1 つま先内', '2 母趾球', '3 つま先外', '4 中足中央', '5 中足外', '6 踵'];
const COLORS = ['#45e6e6', '#ff6040', '#ffffff', '#7f7f7f', '#ffcd56', '#9966ff'];

const charts = [];
const pending = [[], []]; // 受信したサンプルを描画まで溜めておく
const calibrationKeys = [];

function renderCalibration(id) {
  const insole = insoles[id];
  const connected = insole.isConnected();
  const calibration = connected ? insole.pressure_calibration : null;
  const state = insole.connectionState;
  const key = JSON.stringify([connected, state, calibration]);
  if (calibrationKeys[id] === key) return false;
  calibrationKeys[id] = key;

  const source = calibration ? 'デバイスの校正値' : connected ? '既定係数' : '未取得';
  charts[id].options.plugins.title.text = `Pressure [N]（${source}）`;
  const status = document.getElementById(`calibration-status${id}`);
  status.textContent = calibration ? 'デバイスから取得した6chの校正値'
    : state === 'connecting' || state === 'reconnecting' ? '接続中・校正値未取得'
      : connected ? '校正値未取得・荷重は既定係数で換算'
        : '未接続・校正値未取得';

  const body = document.getElementById(`calibration-body${id}`);
  body.replaceChildren();
  if (calibration) {
    for (const row of calibration) {
      const tr = document.createElement('tr');
      const values = [LABELS[row.sensor_index], row.func === 0 ? '指数関数 (0)' : '4次多項式 (1)',
        ...row.coeffs.map((value, index) => row.func === 0 && index > 2
          ? `${value.toExponential()}（未使用）` : value.toExponential())];
      values.forEach((value, index) => {
        const cell = document.createElement(index === 0 ? 'th' : 'td');
        if (index === 0) cell.scope = 'row';
        cell.textContent = value;
        tr.appendChild(cell);
      });
      body.appendChild(tr);
    }
  }
  document.getElementById(`calibration-table${id}`).hidden = !calibration;
  return true;
}

function createChart(canvas) {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: [],
      datasets: LABELS.map((label, i) => ({
        label,
        data: [],
        borderColor: COLORS[i],
        backgroundColor: COLORS[i],
        borderWidth: 1.5,
        pointRadius: 0,
      })),
    },
    options: {
      animation: false,
      plugins: { title: { display: true, text: 'Pressure [N]' } },
      scales: { y: { min: 0 } },
    },
  });
}

window.onload = function () {
  for (let id = 0; id < 2; id++) {
    // 1. 接続 UI を作る
    buildInsoleToolkit(document.getElementById(`toolkit${id}`), `INSOLE 0${id + 1}`, id, {
      streamingMode: 4,
      autoReconnect: true,
    });
    charts[id] = createChart(document.getElementById(`chart${id}`));

    const insole = insoles[id];
    insole.setup();

    // 2. 荷重[N] を受け取る（100Hz で届くので、ここでは溜めるだけ）
    insole.gotConvertedPress = function (press) {
      pending[this.id].push(press.values);
    };
  }

  // 3. 描画は requestAnimationFrame でまとめて行う（毎サンプル update すると重い）
  function render() {
    charts.forEach((chart, id) => {
      // 圧力通知がなくても、校正値の取得・切断を表示に反映する。
      const calibrationChanged = renderCalibration(id);
      if (pending[id].length === 0 && !calibrationChanged) return;
      for (const values of pending[id].splice(0)) {
        chart.data.labels.push('');
        values.forEach((v, ch) => chart.data.datasets[ch].data.push(v));
      }
      const excess = chart.data.labels.length - HISTORY;
      if (excess > 0) {
        chart.data.labels.splice(0, excess);
        chart.data.datasets.forEach((ds) => ds.data.splice(0, excess));
      }
      chart.update();
    });
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
};
