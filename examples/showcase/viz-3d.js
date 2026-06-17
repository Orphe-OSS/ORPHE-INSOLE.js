/**
 * 姿勢セクションの可視化: クォータニオン → 3D 靴モデル（左右2台分）
 *
 * ORPHE-CORE.js examples/VIEW (sketch.js) からの移植。
 * p5.js(WEBGL) で STL モデルを表示し、受信クォータニオンを
 * toxiclibs の Quaternion で axis-angle に変換して回転を適用する。
 * モデル (assets/models/orphe_shoeL3.stl / R3.stl) も ORPHE-CORE.js リポジトリ由来。
 *
 * INSOLE SDK には CORE の resetMotionSensorAttitude() が無いため、
 * 「姿勢リセット」は基準クォータニオンの共役を掛けるオフセット方式で実装している。
 */

const AttitudeViz = (function () {

    const quats = [null, null];  // 最新の受信クォータニオン {w,x,y,z}
    const qRefs = [null, null];  // 姿勢リセット時の基準
    const feet = ['L', 'R'];     // デバイスごとの装着位置（mount_position で更新）

    function conj(q) {
        return { w: q.w, x: -q.x, y: -q.y, z: -q.z };
    }

    function mul(a, b) {
        return {
            w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
            x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
            y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
            z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
        };
    }

    return {
        setQuat(id, q) { quats[id] = q; },
        setFoot(id, side) { feet[id] = side; },
        getFoot(id) { return feet[id]; },
        /** 全デバイスの現在姿勢を基準にする */
        reset() {
            for (let id = 0; id < 2; id++) {
                qRefs[id] = quats[id] ? { ...quats[id] } : null;
            }
        },
        /** 基準補正済みのクォータニオンを返す（基準未設定時は生値） */
        relativeQuat(id) {
            if (!quats[id]) return null;
            if (!qRefs[id]) return quats[id];
            return mul(conj(qRefs[id]), quats[id]);
        },
    };
})();

/* ---- ここから p5.js グローバルモード（VIEW の sketch.js 相当） ---- */

var showcase_model_L, showcase_model_R;

function preload() {
    showcase_model_L = loadModel('./assets/models/orphe_shoeL3.stl');
    showcase_model_R = loadModel('./assets/models/orphe_shoeR3.stl');
}

function setup() {
    const placeholder = document.querySelector('#canvas3d_placeholder');
    const w = placeholder.clientWidth;
    const h = Math.max(240, w * 9 / 16);
    const c = createCanvas(w, h, WEBGL);
    placeholder.appendChild(c.elt);
}

function draw() {
    background(16, 23, 28);
    camera(
        0, 400, 400,
        0, 0, 0,
        0, 1, 0
    );

    // 左足を画面左、右足を画面右に配置。両方同じ足の場合はデバイス順に並べる
    const feet = [AttitudeViz.getFoot(0), AttitudeViz.getFoot(1)];
    const xs = (feet[0] === feet[1])
        ? [-110, 110]
        : feet.map(f => (f === 'L' ? -110 : 110));

    for (let id = 0; id < 2; id++) {
        // 注: STLモデルは VIEW のカメラ・rotateZ(PI) 前提で作られており、
        // 装着位置(L/R)に対して左右反転のモデルを当てると正しい向きで表示される。
        const model3d = (feet[id] === 'R') ? showcase_model_L : showcase_model_R;
        const q = AttitudeViz.relativeQuat(id);

        push();
        translate(xs[id], 0, 0);
        directionalLight(255, 255, 255, 0, -100, -100);
        ambientLight(80);
        ambientMaterial(255, 255, 255);
        noStroke();
        rotateZ(PI);
        if (q && typeof toxi !== 'undefined') {
            // 座標系変換は VIEW と同一: (z, -x, y, w)
            const quatr = new toxi.geom.Quaternion(q.z, -q.x, q.y, q.w);
            const axisAngle = quatr.toAxisAngle();
            rotate(axisAngle[0], createVector(axisAngle[1], axisAngle[2], axisAngle[3]));
        }
        if (model3d) model(model3d);
        pop();
    }
}

function windowResized() {
    const placeholder = document.querySelector('#canvas3d_placeholder');
    const w = placeholder.clientWidth;
    resizeCanvas(w, Math.max(240, w * 9 / 16));
}
