(function(root){
"use strict";
root.createGaitCGRenderer=function(T,el){
const {body,pose}=root.GaitCGModel;
const renderer=new T.WebGLRenderer({antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFShadowMap;
el.appendChild(renderer.domElement);
const scene = new T.Scene();
scene.background = new T.Color('#eef2f6');
scene.fog = new T.Fog('#eef2f6', 7, 16);
const camera = new T.PerspectiveCamera(36, 1, .01, 50);
camera.position.set(3, 1.8, 3.7);
let yaw = .65, pitch = .25, distance = 4.5;
const target = new T.Vector3(0, .9, 0);
const controls = { target, update() { camera.position.set(target.x + distance * Math.sin(yaw) * Math.cos(pitch), target.y + distance * Math.sin(pitch), target.z + distance * Math.cos(yaw) * Math.cos(pitch)); camera.lookAt(target); }, dispose() { } };
let drag = null;
const down = e => { drag = [e.clientX, e.clientY]; renderer.domElement.setPointerCapture(e.pointerId); };
const move = e => { if (!drag)
    return; yaw -= (e.clientX - drag[0]) * .008; pitch = Math.max(-.05, Math.min(1.2, pitch + (e.clientY - drag[1]) * .008)); drag = [e.clientX, e.clientY]; };
const up = () => { drag = null; };
const wheel = e => { e.preventDefault(); distance = Math.max(1.8, Math.min(7, distance + e.deltaY * .003)); };
renderer.domElement.addEventListener('pointerdown', down);
renderer.domElement.addEventListener('pointermove', move);
renderer.domElement.addEventListener('pointerup', up);
renderer.domElement.addEventListener('pointercancel', up);
renderer.domElement.addEventListener('wheel', wheel, { passive: false });
scene.add(new T.HemisphereLight('#ffffff', '#75839b', 3));
const light = new T.DirectionalLight('#fff9ef', 3);
light.position.set(3, 6, 4);
light.castShadow = true;
light.shadow.mapSize.set(2048, 2048);
scene.add(light);
const floor = new T.Mesh(new T.PlaneGeometry(200, 200), new T.MeshStandardMaterial({ color: '#e8edf3', roughness: 1 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -.004;
floor.receiveShadow = true;
scene.add(floor);
const grid = new T.GridHelper(20, 80, '#aab9cc', '#d1dbe6');
grid.position.y = .001;
scene.add(grid);
const skin = new T.MeshStandardMaterial({ color: '#b7c4d5', roughness: .58, metalness: .12 });
const jointsMat = new T.MeshBasicMaterial({ color: '#e66b16', depthTest: false, depthWrite: false, transparent: true });
const leftMat = new T.MeshBasicMaterial({ color: '#177cbd', transparent: true, opacity: .6 });
const rightMat = new T.MeshBasicMaterial({ color: '#e89743', transparent: true, opacity: .6 });
let group = new T.Group();
scene.add(group);
let key = '', oldView = '';
const sphere = new T.SphereGeometry(1, 24, 16);
const cylinder = new T.CylinderGeometry(1, 1, 1, 20, 1);
let meshes = {};
let markers = [];
let bones = [];
function ball(name, r) { const m = new T.Mesh(sphere, skin); m.scale.set(...r); m.castShadow = true; group.add(m); meshes[name] = m; return m; }
function segment(name, r) { const m = new T.Mesh(cylinder, skin); m.userData.radius = r; m.castShadow = true; group.add(m); meshes[name] = m; return m; }
function link(m, a, b, r) { const av = new T.Vector3(...a), bv = new T.Vector3(...b), v = bv.clone().sub(av); m.position.copy(av.add(bv).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.clone().normalize()); m.scale.set(r ?? m.userData.radius, v.length(), r ?? m.userData.radius); }
function build(p) {
    scene.remove(group);
    group.traverse(o => { if (o instanceof T.Mesh && o.geometry !== sphere && o.geometry !== cylinder)
        o.geometry.dispose(); });
    group = new T.Group();
    scene.add(group);
    meshes = {};
    markers = [];
    bones = [];
    const b = body(p), h = b.h, f = b.fat;
    ball('pelvis', [h * .067 * f, h * .075, h * .108 * f]);
    ball('abdomen', [h * .062 * f, h * .105, h * .086 * f]);
    ball('chest', [h * .071 * f, h * .11, h * .116 * f]);
    ball('head', [h * .061, h * .077, h * .052]);
    ball('nose', [h * .016, h * .019, h * .017]);
    ball('neck', [h * .037, h * .045, h * .038]);
    for (let i = 0; i < 2; i++) {
        ball('shoulder' + i, [h * .054 * f, h * .055 * f, h * .055 * f]);
        segment('upperArm' + i, h * .03 * f);
        segment('forearm' + i, h * .024 * f);
        ball('elbow' + i, [h * .026 * f, h * .026 * f, h * .026 * f]);
        ball('hand' + i, [h * .024, h * .049, h * .016]);
        segment('thigh' + i, h * .055 * f);
        segment('shin' + i, h * .036 * f);
        ball('knee' + i, [h * .039 * f, h * .039 * f, h * .039 * f]);
        ball('hip' + i, [h * .06 * f, h * .062 * f, h * .06 * f]);
        ball('ankle' + i, [h * .024, h * .027, h * .024]);
        const shape = new T.Shape();
        shape.moveTo(-h * .045, -b.ankle);
        shape.lineTo(h * .105, -b.ankle);
        shape.quadraticCurveTo(h * .112, -b.ankle + h * .032, h * .07, -b.ankle + h * .043);
        shape.lineTo(-h * .03, -b.ankle + h * .053);
        shape.quadraticCurveTo(-h * .052, -b.ankle + h * .04, -h * .045, -b.ankle);
        const footMesh = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: h * .061, bevelEnabled: false, curveSegments: 16 }), skin);
        footMesh.geometry.translate(0, 0, -h * .0305);
        footMesh.castShadow = true;
        group.add(footMesh);
        meshes['foot' + i] = footMesh;
        const contact = new T.Mesh(new T.CircleGeometry(.12, 40), i === 0 ? leftMat : rightMat);
        contact.rotation.x = -Math.PI / 2;
        contact.scale.set(1.5, .65, 1);
        group.add(contact);
        meshes['contact' + i] = contact;
    }
    for (let i = 0; i < 12; i++) {
        const m = new T.Mesh(sphere, jointsMat);
        m.scale.setScalar(.023);
        m.renderOrder = 101;
        group.add(m);
        markers.push(m);
    }
    for (let i = 0; i < 8; i++) {
        const m = new T.Mesh(cylinder, jointsMat);
        m.renderOrder = 100;
        group.add(m);
        bones.push(m);
    }
}
const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
const observer = new ResizeObserver(resize);
observer.observe(el);
resize();
let previousPhase = 0, travel = 0;
const draw = ({ parameters: p, phase, wire = false, skeleton = false, view = 'perspective' }) => {
    const nextKey = JSON.stringify([p.height, p.weight, p.sex, p.age]);
    if (nextKey !== key) {
        build(p);
        key = nextKey;
    }
    const b = body(p), h = b.h, s = pose(p, phase);
    skin.wireframe = wire;
    skin.transparent = skeleton;
    skin.opacity = skeleton ? .25 : 1;
    if (view !== oldView) {
        yaw = view === 'front' ? Math.PI / 2 : view === 'side' ? 0 : .65;
        pitch = view === 'perspective' ? .25 : .05;
        controls.target.set(0, h * .5, 0);
        oldView = view;
    }
    const orient = (name, pt, e) => { meshes[name].position.set(...pt); meshes[name].rotation.set(...e, 'ZYX'); };
    orient('pelvis', s.root, s.pelvisRotation);
    orient('abdomen', s.waist, s.pelvisRotation);
    orient('chest', s.chest, s.chestRotation);
    orient('neck', s.neck, s.chestRotation);
    orient('head', s.head, [0, s.chestRotation[1] * .25, 0]);
    meshes.nose.position.set(s.head[0] + h * .058, s.head[1], s.head[2]);
    let mi = 0, bi = 0;
    s.legs.forEach((leg, i) => {
        meshes['hip' + i].position.set(...leg.hip);
        link(meshes['thigh' + i], leg.hip, leg.knee);
        link(meshes['shin' + i], leg.knee, leg.ankle);
        meshes['knee' + i].position.set(...leg.knee);
        meshes['ankle' + i].position.set(...leg.ankle);
        meshes['foot' + i].position.set(...leg.ankle);
        meshes['foot' + i].rotation.z = leg.pitch;
        const contact = meshes['contact' + i];
        contact.visible = leg.contact;
        contact.position.set(leg.ankle[0] + h * .025, .005, leg.ankle[2]);
        const { shoulder: sh, elbow, hand } = s.arms[i];
        meshes['shoulder' + i].position.set(...sh);
        link(meshes['upperArm' + i], sh, elbow);
        link(meshes['forearm' + i], elbow, hand);
        meshes['elbow' + i].position.set(...elbow);
        meshes['hand' + i].position.set(...hand);
        [leg.hip, leg.knee, leg.ankle, sh, elbow, hand].forEach(pt => { markers[mi].position.set(...pt); markers[mi++].visible = skeleton; });
        [[leg.hip, leg.knee], [leg.knee, leg.ankle], [sh, elbow], [elbow, hand]].forEach(([a, c]) => { link(bones[bi], a, c, .007); bones[bi++].visible = skeleton; });
    });
    let delta = phase - previousPhase;
    if (delta < -.5)
        delta += 1;
    else if (delta > .5)
        delta -= 1;
    travel += delta * 2 * p.step;
    previousPhase = phase;
    grid.position.x = -(travel % .25);
    controls.update();
    renderer.render(scene, camera);
};
const dispose = () => { renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointermove', move); renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('pointercancel', up); renderer.domElement.removeEventListener('wheel', wheel); observer.disconnect(); controls.dispose(); scene.traverse(o => { if (o instanceof T.Mesh)
    o.geometry.dispose(); }); skin.dispose(); jointsMat.dispose(); leftMat.dispose(); rightMat.dispose(); floor.material.dispose(); renderer.dispose(); renderer.domElement.remove(); };
return { draw, dispose };

};
})(globalThis);
