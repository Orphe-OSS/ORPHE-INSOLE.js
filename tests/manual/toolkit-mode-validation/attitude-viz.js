/* global
loadModel, createCanvas, resizeCanvas, WEBGL, background, camera,
directionalLight, ambientLight, ambientMaterial, noStroke, rotateZ, rotate,
createVector, model, push, pop, translate, PI, toxi
*/

/**
 * showcaseのQuaternion→3D靴モデル表示を、手動検証ページ用に切り出したもの。
 * 各モードでQuaternionが実際に配信されているかを左右同時に確認する。
 */
const AttitudeViz = (() => {
    const quats = [null, null];
    const references = [null, null];
    const feet = ['L', 'R'];

    function conjugate(q) {
        return { w: q.w, x: -q.x, y: -q.y, z: -q.z };
    }

    function multiply(a, b) {
        return {
            w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
            x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
            y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
            z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
        };
    }

    return {
        setQuat(id, quat) {
            quats[id] = quat ? { ...quat } : null;
        },
        setFoot(id, side) {
            feet[id] = side === 'R' ? 'R' : 'L';
        },
        getFoot(id) {
            return feet[id];
        },
        reset() {
            for (let id = 0; id < 2; id += 1) {
                references[id] = quats[id] ? { ...quats[id] } : null;
            }
        },
        clearAll() {
            for (let id = 0; id < 2; id += 1) {
                quats[id] = null;
                references[id] = null;
            }
        },
        relativeQuat(id) {
            if (!quats[id]) return null;
            if (!references[id]) return quats[id];
            return multiply(conjugate(references[id]), quats[id]);
        },
    };
})();

globalThis.AttitudeViz = AttitudeViz;

let validationModelLeft;
let validationModelRight;

globalThis.preload = function () {
    validationModelLeft = loadModel('../../../examples/showcase/assets/models/orphe_shoeL3.stl');
    validationModelRight = loadModel('../../../examples/showcase/assets/models/orphe_shoeR3.stl');
};

globalThis.setup = function () {
    const placeholder = document.querySelector('#validation_canvas3d');
    if (!placeholder) return;
    const width = Math.max(320, placeholder.clientWidth);
    const height = Math.max(260, Math.min(430, width * 0.5));
    const canvas = createCanvas(width, height, WEBGL);
    placeholder.appendChild(canvas.elt);
};

globalThis.draw = function () {
    const placeholder = document.querySelector('#validation_canvas3d');
    if (!placeholder) return;
    background(5, 9, 13);
    camera(0, 400, 400, 0, 0, 0, 0, 1, 0);

    const feet = [AttitudeViz.getFoot(0), AttitudeViz.getFoot(1)];
    const xPositions = feet[0] === feet[1]
        ? [-110, 110]
        : feet.map((side) => side === 'L' ? -110 : 110);

    for (let id = 0; id < 2; id += 1) {
        const shoe = feet[id] === 'R' ? validationModelLeft : validationModelRight;
        const quat = AttitudeViz.relativeQuat(id);
        push();
        translate(xPositions[id], 0, 0);
        directionalLight(255, 255, 255, 0, -100, -100);
        ambientLight(80);
        ambientMaterial(255, 255, 255);
        noStroke();
        rotateZ(PI);
        if (quat && typeof toxi !== 'undefined') {
            const converted = new toxi.geom.Quaternion(quat.z, -quat.x, quat.y, quat.w);
            const axisAngle = converted.toAxisAngle();
            rotate(axisAngle[0], createVector(axisAngle[1], axisAngle[2], axisAngle[3]));
        }
        if (shoe) model(shoe);
        pop();
    }
};

globalThis.windowResized = function () {
    const placeholder = document.querySelector('#validation_canvas3d');
    if (!placeholder) return;
    const width = Math.max(320, placeholder.clientWidth);
    resizeCanvas(width, Math.max(260, Math.min(430, width * 0.5)));
};
