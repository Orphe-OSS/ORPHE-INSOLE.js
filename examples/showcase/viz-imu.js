/**
 * IMUセクションの可視化: 加速度[G]・ジャイロ[deg/s] の折れ線チャート + 数値表示
 * （デバイスごとに1パネル）
 */
function createImuPanel(deviceId) {
    let accFeed = null, gyroFeed = null;
    let latestAcc = null, latestGyro = null;
    let accReadout, gyroReadout;

    function init() {
        accFeed = new ChartFeed(makeLineChart(`chart_acc${deviceId}`, 'chartAccTitle',
            ['x', 'y', 'z'], -4, 4));
        gyroFeed = new ChartFeed(makeLineChart(`chart_gyro${deviceId}`, 'chartGyroTitle',
            ['x', 'y', 'z'], -800, 800));
        accReadout = document.getElementById(`acc_readout${deviceId}`);
        gyroReadout = document.getElementById(`gyro_readout${deviceId}`);
    }

    function push(frame) {
        if (frame.acc) {
            latestAcc = frame.acc;
            accFeed.push([frame.acc.x, frame.acc.y, frame.acc.z]);
        }
        if (frame.gyro) {
            latestGyro = frame.gyro;
            gyroFeed.push([frame.gyro.x, frame.gyro.y, frame.gyro.z]);
        }
    }

    function fmt(v, digits) {
        return (v >= 0 ? '+' : '') + v.toFixed(digits);
    }

    function render() {
        if (accFeed.flush()) accFeed.chart.update();
        if (gyroFeed.flush()) gyroFeed.chart.update();
        if (latestAcc) {
            accReadout.textContent =
                `x ${fmt(latestAcc.x, 2)}  y ${fmt(latestAcc.y, 2)}  z ${fmt(latestAcc.z, 2)} G`;
        }
        if (latestGyro) {
            gyroReadout.textContent =
                `x ${fmt(latestGyro.x, 1)}  y ${fmt(latestGyro.y, 1)}  z ${fmt(latestGyro.z, 1)} deg/s`;
        }
    }

    return { init, push, render };
}
