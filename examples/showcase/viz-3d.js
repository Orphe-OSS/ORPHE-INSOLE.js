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

    // pitch / roll 入れ替え（FW・IMU実装差の吸収）
    //
    // quaternion.js の toEuler() は roll=X軸回り / pitch=Y軸回り、INSOLEの座標系は
    // X=つま先方向に向かって右 / Y=つま先方向。FWによってIMUの X/Y の割り当てが
    // 90°ずれる個体があり、その場合「つま先上げ」が roll 側に出てCGも横倒しに動く。
    //
    // 単なるラベルの入れ替え（X↔Y）は鏡像（det=-1）になりクォータニオンで表せないため、
    // センサ座標系を Z 軸回りに -90° 回す相似変換 q' = r q r* で補正する。
    // これで X軸回りの回転は Y軸回り（pitch）として描画され、yaw はそのまま保たれる。
    //
    // 符号は実機で確認済み: +90° だと軸の入れ替えは合うが回転の向きが両軸とも逆になり、
    // つま先を上げるとCGは踵が上がる。-90°（下記）が実機の動きと一致する。
    const SWAP_R = { w: Math.SQRT1_2, x: 0, y: 0, z: -Math.SQRT1_2 };
    let swapPitchRoll = false;

    /** センサ座標系のX/Yを入れ替えた姿勢を返す（表示用。生値は変更しない） */
    function swapQuat(q) {
        return mul(mul(SWAP_R, q), conj(SWAP_R));
    }

    return {
        setQuat(id, q) { quats[id] = q; },
        setFoot(id, side) { feet[id] = side; },
        getFoot(id) { return feet[id]; },
        /** pitch/roll 入れ替えの有効・無効（CG・ゲージ共通） */
        setSwapPitchRoll(enabled) { swapPitchRoll = !!enabled; },
        /** 入れ替えが有効なら適用した姿勢を、無効ならそのまま返す */
        oriented(q) {
            if (!q) return null;
            return swapPitchRoll ? swapQuat(q) : q;
        },
        /** 全デバイスの現在姿勢を基準にする */
        reset() {
            for (let id = 0; id < 2; id++) {
                qRefs[id] = quats[id] ? { ...quats[id] } : null;
            }
        },
        /** 基準補正済みのクォータニオンを返す（基準未設定時は生値） */
        relativeQuat(id) {
            if (!quats[id]) return null;
            // 相似変換は積と可換（r(q0* q)r* = (r q0* r*)(r q r*)）なので基準補正後に適用してよい
            const rel = qRefs[id] ? mul(conj(qRefs[id]), quats[id]) : quats[id];
            return this.oriented(rel);
        },
    };
})();

/* ---- ここから p5.js グローバルモード（VIEW の sketch.js 相当） ---- */

var showcase_model_L, showcase_model_R;

// 他のexampleから読み込む場合はモデルの場所を上書きできる（既定はこのページの assets/）
function shoeModelBase() {
    return window.ORPHE_SHOE_MODEL_BASE || './assets/models/';
}

// プレースホルダに高さが指定されていればそれに従い、無ければ幅から16:9で決める
function canvasSizeForPlaceholder(placeholder) {
    const w = placeholder.clientWidth;
    const h = placeholder.clientHeight > 40 ? placeholder.clientHeight : Math.max(240, w * 9 / 16);
    return { w, h };
}

function preload() {
    showcase_model_L = loadModel(`${shoeModelBase()}orphe_shoeL3.stl`);
    showcase_model_R = loadModel(`${shoeModelBase()}orphe_shoeR3.stl`);
}

function setup() {
    const placeholder = document.querySelector('#canvas3d_placeholder');
    const { w, h } = canvasSizeForPlaceholder(placeholder);
    const c = createCanvas(w, h, WEBGL);
    placeholder.appendChild(c.elt);
}

function draw() {
    background(16, 23, 28);
    // 展示用ページなど、大きく見せたいときは window.ORPHE_ATTITUDE_ZOOM で寄れる
    const zoom = window.ORPHE_ATTITUDE_ZOOM || 1;
    camera(
        0, 400 / zoom, 400 / zoom,
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
    const { w, h } = canvasSizeForPlaceholder(placeholder);
    resizeCanvas(w, h);
}
