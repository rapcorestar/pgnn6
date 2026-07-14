import * as THREE from './node_modules/three/build/three.module.js';
import { RoundedBoxGeometry } from './node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { FBXLoader } from './node_modules/three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from './node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';

const canvas = document.querySelector('#room');
const arrival = document.querySelector('#arrival');
const enter = document.querySelector('#enter');
const focus = document.querySelector('#focus');
const whisper = document.querySelector('#whisper');
const fragment = document.querySelector('#fragment');
const settings = document.querySelector('#settings');
const continueButton = document.querySelector('#continue');
const forgetButton = document.querySelector('#forget');
const volumeInput = document.querySelector('#volume');
const subtitleInput = document.querySelector('#subtitles');
const accessibility = document.querySelector('#accessibility');

const SAVE_KEY = 'room-seven-memory-v1';
const emptyState = () => ({ visits: 0, objects: {}, snow: false, subtitles: false, volume: .65 });
let memory;
try { memory = { ...emptyState(), ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; } catch { memory = emptyState(); }
memory.visits += 1;
const save = () => localStorage.setItem(SAVE_KEY, JSON.stringify(memory));
const seen = id => memory.objects[id] || 0;
const mark = id => { memory.objects[id] = seen(id) + 1; save(); return memory.objects[id]; };
save();

// ----------------------- renderer / atmosphere -----------------------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
// Keep the deliberately tactile image inexpensive: one modest shadow map and a capped pixel ratio.
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .84;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#10191a');
scene.fog = new THREE.Fog('#11191a', 10, 34);
const camera = new THREE.PerspectiveCamera(57, 1, .05, 30);
const yaw = new THREE.Object3D();
const pitch = new THREE.Object3D();
yaw.position.set(.72, 1.63, 4.9);
pitch.add(camera); yaw.add(pitch); scene.add(yaw);

// The softness is a single low-resolution image pass, not an expensive lighting stack.
const composer = new EffectComposer(renderer);
composer.setPixelRatio(1);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), .22, .42, .82);
composer.addPass(bloomPass);

const hemi = new THREE.HemisphereLight('#7897a2', '#3d3025', 1.08); scene.add(hemi);
scene.add(new THREE.AmbientLight('#d8d6c6', .46));
const windowLight = new THREE.PointLight('#6d9bad', 18, 7, 2); windowLight.position.set(0, 2.35, -4.95); scene.add(windowLight);
const lamp = new THREE.PointLight('#e5ba80', 25, 8.5, 2); lamp.position.set(-.3, 3.45, .05); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); scene.add(lamp);

const world = new THREE.Group(); scene.add(world);
const interactive = [];
let snow = null;
let tvScreenMaterial = null;
let tvGlowLight = null;
const gltfLoader = new GLTFLoader();
const fbxManager = new THREE.LoadingManager();
// The supplied FBX files refer to source TGA names beside the meshes. Redirect those
// requests to the resized runtime atlas so loading stays clean and network-light.
fbxManager.setURLModifier(url => {
  if (url.endsWith('Interior_D.tga')) return './assets/models/soviet-props/runtime-textures/Interior_D_2k.png';
  if (url.endsWith('Interior_N.tga')) return './assets/models/soviet-props/runtime-textures/Interior_N_2k.png';
  if (url.endsWith('snowing.png')) return './assets/models/fixprice/snow128256.png';
  return url;
});
const fbxLoader = new FBXLoader(fbxManager);
let buildToken = 0;

function canvasTexture(draw, width = 256, height = 256) {
  const c = document.createElement('canvas'); c.width = width; c.height = height;
  const x = c.getContext('2d'); draw(x, width, height);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
function cloneTexture(texture, rx, ry) { const t = texture.clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return t; }
function speckles(x, w, h, amount, alpha) { for (let i = 0; i < amount; i++) { x.fillStyle = `rgba(20,14,11,${alpha * Math.random()})`; x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } }

const textures = {
  wall: canvasTexture((x,w,h) => { x.fillStyle = '#77746b'; x.fillRect(0,0,w,h); for(let i=18;i<w;i+=42){x.fillStyle='rgba(62,76,66,.17)';x.fillRect(i,0,1,h);} for(let y=19;y<h;y+=48){for(let z=14;z<w;z+=44){x.strokeStyle='rgba(112,85,70,.25)';x.beginPath();x.arc(z,y,4,0,Math.PI*2);x.stroke();x.fillStyle='rgba(169,147,113,.18)';x.fillRect(z-1,y-1,3,3);}} speckles(x,w,h,500,.12); }),
  wood: canvasTexture((x,w,h) => { x.fillStyle='#5b4130';x.fillRect(0,0,w,h);for(let y=5;y<h;y+=12){x.strokeStyle=`rgba(35,18,12,${.18+Math.random()*.18})`;x.beginPath();x.moveTo(0,y);for(let a=0;a<w;a+=20)x.lineTo(a,y+Math.sin(a*.05+y)*2);x.stroke();}speckles(x,w,h,700,.17); }),
  floor: canvasTexture((x,w,h) => { x.fillStyle='#4b3829';x.fillRect(0,0,w,h);for(let y=0;y<h;y+=24){for(let a=0;a<w;a+=56){let off=(y/24%2)*28;x.fillStyle=((a/56+y/24)%2)?'#5a4330':'#493526';x.fillRect(a-off,y,54,22);x.strokeStyle='rgba(30,20,14,.38)';x.strokeRect(a-off,y,54,22);}}speckles(x,w,h,600,.2); }),
  carpet: canvasTexture((x,w,h) => { x.fillStyle='#5a2f2b';x.fillRect(0,0,w,h);x.strokeStyle='#b37a4a';x.lineWidth=9;x.strokeRect(12,12,w-24,h-24);x.strokeStyle='#7e4932';x.lineWidth=6;x.strokeRect(34,34,w-68,h-68);for(let y=52;y<h-45;y+=42)for(let z=52;z<w-45;z+=42){x.fillStyle='#c08755';x.fillRect(z,y,10,10);x.fillStyle='#7e4432';x.fillRect(z+10,y+10,9,9);}speckles(x,w,h,650,.18); }),
  cloth: canvasTexture((x,w,h) => { x.fillStyle='#7b7460';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=18){x.fillStyle=i%36?'rgba(74,63,52,.32)':'rgba(206,190,151,.28)';x.fillRect(i,0,2,h);}for(let y=0;y<h;y+=18){x.fillStyle='rgba(55,47,42,.22)';x.fillRect(0,y,w,2);}speckles(x,w,h,300,.12); }),
  lace: canvasTexture((x,w,h) => { x.fillStyle='rgba(220,215,194,.88)';x.fillRect(0,0,w,h);x.clearRect(0,0,w,8);for(let y=14;y<h;y+=22){for(let z=8;z<w;z+=19){x.globalCompositeOperation='destination-out';x.beginPath();x.arc(z,y,4,0,Math.PI*2);x.fill();x.globalCompositeOperation='source-over';}} }),
};
const crtSignalMap = canvasTexture((x,w,h) => {
  x.fillStyle='#4d7380';x.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=3){x.fillStyle=`rgba(201,229,234,${.10+Math.random()*.09})`;x.fillRect(0,y,w,1);}
  for(let i=0;i<2600;i++) { const v=76+Math.floor(Math.random()*66); x.fillStyle=`rgba(${v+24},${v+42},${v+47},${.08+Math.random()*.16})`;x.fillRect(Math.random()*w,Math.random()*h,1,1); }
  const haze=x.createLinearGradient(0,0,w,h);haze.addColorStop(0,'rgba(196,228,231,.14)');haze.addColorStop(.5,'rgba(109,153,167,.02)');haze.addColorStop(1,'rgba(20,37,43,.12)');x.fillStyle=haze;x.fillRect(0,0,w,h);
},256,192);
const textureLoader = new THREE.TextureLoader();
function loadPbrTexture(path, repeatX = 1, repeatY = repeatX, color = false) {
  const texture = textureLoader.load(path);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const wornFloorMap = loadPbrTexture('./assets/textures/old_wood_floor_diff_1k.jpg', 4, 4, true);
const wornFloorRoughness = loadPbrTexture('./assets/textures/old_wood_floor_rough_1k.jpg', 4);
const wornFloorNormal = loadPbrTexture('./assets/textures/old_wood_floor_nor_gl_1k.jpg', 4);
const wallpaperMap = loadPbrTexture('./assets/textures/generated/late-90s-floral-wallpaper.png', 2.15, 1.2, true);
const rugMap = loadPbrTexture('./assets/textures/generated/worn-soviet-rug.png', 1, 1, true);
const veneerMap = loadPbrTexture('./assets/textures/generated/worn-walnut-veneer.png', 1.15, 1.15, true);
const curtainMap = loadPbrTexture('./assets/textures/generated/slavic-lace-curtain.png', .9, 1.45, true);
const sofaMap = loadPbrTexture('./assets/textures/generated/faded-sofa-upholstery.png', 1.1, 1.1, true);
// The residential prop pack is a single deliberately authored material atlas.  Keeping
// the atlas shared means the furniture remains light enough for a browser scene while
// still being actual authored meshes rather than boxes with pictures attached.
const sovietInteriorDiffuse = loadPbrTexture('./assets/models/soviet-props/runtime-textures/Interior_D_2k.png', 1, 1, true);
const sovietInteriorNormal = loadPbrTexture('./assets/models/soviet-props/runtime-textures/Interior_N_2k.png');
const sovietInteriorRoughness = loadPbrTexture('./assets/models/soviet-props/runtime-textures/Interior_R_1k.png');
const sovietInteriorMetalness = loadPbrTexture('./assets/models/soviet-props/runtime-textures/Interior_M_1k.png');
const sovietInteriorMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff', map: sovietInteriorDiffuse, normalMap: sovietInteriorNormal,
  roughnessMap: sovietInteriorRoughness, metalnessMap: sovietInteriorMetalness,
  roughness: .78, metalness: 0, normalScale: new THREE.Vector2(.5, .5),
});
const panelAlbedoPaths = {
  Fasad_01: './assets/models/panel-house/textures/Fasad_01_albedo.jpeg',
  Fasad_02: './assets/models/panel-house/textures/Fasad_02_albedo.jpeg',
  Fasad_03: './assets/models/panel-house/textures/Fasad_03_albedo.jpeg',
  Balkon_01: './assets/models/panel-house/textures/Balkon_01_albedo.jpeg',
  Balkon_02: './assets/models/panel-house/textures/Balkon_02_albedo.jpeg',
  Balkon_03: './assets/models/panel-house/textures/Balkon_03_albedo.jpeg',
  Wall_top: './assets/models/panel-house/textures/Wall_top_albedo.jpeg',
  Wall_down: './assets/models/panel-house/textures/Wall_down_albedo.jpeg',
  Roof_01: './assets/models/panel-house/textures/Roof_01_albedo.jpeg',
  Entrance_01: './assets/models/panel-house/textures/Entrance_01_albedo.jpg',
  Entrance_02: './assets/models/panel-house/textures/Entrance_02_albedo.jpg',
};
const panelHouseMaterials = new Map();
function getPanelHouseMaterial(name) {
  if (!panelHouseMaterials.has(name)) {
    const diffuse=loadPbrTexture(panelAlbedoPaths[name] || panelAlbedoPaths.Fasad_01, 1, 1, true);
    // The courtyard facade is intentionally self-lit at a very low level. This keeps
    // its real geometry legible through winter fog without a giant point light that
    // would flatten the apartment interior.
    panelHouseMaterials.set(name, new THREE.MeshBasicMaterial({color:'#d8e2e1',map:diffuse}));
  }
  return panelHouseMaterials.get(name);
}
const mat = (color, roughness = .8, map = null) => new THREE.MeshStandardMaterial({ color, map, roughness, metalness: 0 });
const wood = mat('#654937', .74, cloneTexture(textures.wood, 1, 1));
const darkWood = mat('#2b211b', .82, cloneTexture(textures.wood, 1, 1));
const wallMat = mat('#77736a', 1, cloneTexture(textures.wall, 3, 2));
const floorMat = new THREE.MeshStandardMaterial({ color:'#785a42', map:wornFloorMap, roughnessMap:wornFloorRoughness, normalMap:wornFloorNormal, roughness:.7, normalScale:new THREE.Vector2(.45,.45) });
const roomWallpaper = new THREE.MeshStandardMaterial({ color:'#b9af96', map:wallpaperMap, roughness:1 });
const veneer = new THREE.MeshStandardMaterial({ color:'#a76d51', map:veneerMap, roughness:.52, metalness:.02 });
const veneerDark = new THREE.MeshStandardMaterial({ color:'#51372b', map:veneerMap, roughness:.66, metalness:0 });
const sovietRug = new THREE.MeshStandardMaterial({ color:'#c69374', map:rugMap, roughness:1, side:THREE.DoubleSide });
const sofaFabric = new THREE.MeshStandardMaterial({ color:'#a19872', map:sofaMap, roughness:.94 });
const paper = mat('#cbc3aa', .95);
const upholstery = mat('#746b57', .96, cloneTexture(textures.cloth, 1, 1));
const greenUpholstery = mat('#536258', .96, cloneTexture(textures.cloth, 1, 1));
const brass = new THREE.MeshStandardMaterial({ color: '#9d7a43', roughness: .46, metalness: .66 });
const glass = new THREE.MeshPhysicalMaterial({ color:'#91b8bf', roughness:.18, transmission:.08, transparent:true, opacity:.55, side:THREE.DoubleSide });

function mesh(geometry, material, position, { shadow = true, name } = {}) {
  const m = new THREE.Mesh(geometry, material); m.position.copy(position); m.castShadow = shadow; m.receiveShadow = shadow; if (name) m.name = name; world.add(m); return m;
}
function box(w,h,d, material, position, opts) { return mesh(new THREE.BoxGeometry(w,h,d), material, position, opts); }
function roundedBox(w,h,d,radius,material,position,opts) { return mesh(new RoundedBoxGeometry(w,h,d,4,radius), material, position, opts); }
function cylinder(rt, rb, h, material, position, segments = 12, opts) { return mesh(new THREE.CylinderGeometry(rt,rb,h,segments), material, position, opts); }
function plane(w,h, material, position, rotation, opts = {}) { const m=mesh(new THREE.PlaneGeometry(w,h),material,position,{...opts,shadow:false});m.rotation.set(...rotation);return m; }
function markInteractive(object, id) { object.traverse(child => { if (child.isMesh) { child.userData.interaction = id; interactive.push(child); } }); return object; }
function group() { const g=new THREE.Group();world.add(g);return g; }
function addTo(g, object) { world.remove(object); g.add(object); return object; }

// --------------------------- room architecture --------------------------
function buildRoom() {
  plane(12,11, floorMat, new THREE.Vector3(0,0,0), [-Math.PI/2,0,0]);
  plane(12,11, wallMat, new THREE.Vector3(0,4.12,0), [Math.PI/2,0,0]);
  plane(12,4.1, wallMat, new THREE.Vector3(-6,2.05,0), [0,Math.PI/2,0]);
  plane(12,4.1, wallMat, new THREE.Vector3(6,2.05,0), [0,-Math.PI/2,0]);
  // Rear wall is broken into pieces so the window feels cut into it.
  plane(3.8,4.1, wallMat, new THREE.Vector3(-4.1,2.05,-5.7), [0,0,0]);
  plane(3.8,4.1, wallMat, new THREE.Vector3(4.1,2.05,-5.7), [0,0,0]);
  plane(4.4,.85, wallMat, new THREE.Vector3(0,.43,-5.7), [0,0,0]);
  plane(4.4,.62, wallMat, new THREE.Vector3(0,3.8,-5.7), [0,0,0]);
  // Front wall only appears after turning: an exit, not a backdrop.
  plane(12,4.1, wallMat, new THREE.Vector3(0,2.05,5.7), [0,Math.PI,0]);
  box(1.76,3.72,.09, darkWood, new THREE.Vector3(-2.55,1.86,5.63));
  box(.08,.08,.06, brass, new THREE.Vector3(-1.83,1.85,5.56), {shadow:false});
  // old ceiling fixture
  cylinder(.025,.025,.35,brass,new THREE.Vector3(-.25,3.82,.1),8);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(.48,.26,18,1,true), new THREE.MeshStandardMaterial({color:'#c9b27d',roughness:.7,side:THREE.DoubleSide}));
  shade.position.set(-.25,3.56,.1); shade.rotation.x=Math.PI; shade.castShadow=true; world.add(shade);
}

function buildWindow() {
  const g = group();
  const frame = new THREE.MeshStandardMaterial({ color:'#796b54', roughness:.78, map:cloneTexture(textures.wood,1,1) });
  const outside = new THREE.Group(); world.add(outside);
  // A dim courtyard beyond a genuine glazed opening.
  for (const [x,w,h] of [[-1.6,1.3,1.4],[.15,1.75,2.2],[1.85,1.2,1.05]]) addTo(outside,box(w,h,.75,mat('#1a2d32'),new THREE.Vector3(x,h/2,-7.05)));
  const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(3.25,2.35),glass); glassPane.position.set(0,2.3,-5.64); world.add(glassPane);
  const pieces = [ [0,3.5,.11,.12], [0,1.1,.11,.12], [-1.72,2.3,.12,2.5], [1.72,2.3,.12,2.5], [0,2.3,.1,2.35], [0,2.3,3.35,.1] ];
  for (const [x,y,w,h] of pieces) addTo(g,box(w,h,.13,frame,new THREE.Vector3(x,y,-5.57)));
  // gathered lace: a set of semi-transparent cloth planes and a brass rail
  const laceMat = new THREE.MeshStandardMaterial({ map:cloneTexture(textures.lace,1,2), transparent:true, opacity:.72, side:THREE.DoubleSide, roughness:1 });
  addTo(g,cylinder(.035,.035,3.8,brass,new THREE.Vector3(0,3.58,-5.5),8));
  for (const x of [-1.53,-1.32,1.32,1.53]) addTo(g,plane(.2,2.45,laceMat,new THREE.Vector3(x,2.25,-5.48),[0,0,0]));
  markInteractive(g,'window');
  snow = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color:'#e8f2f2', size:.024, transparent:true, opacity:.68, sizeAttenuation:true, depthWrite:false }));
  const points=[]; for(let i=0;i<150;i++)points.push((Math.random()-.5)*3.1,.95+Math.random()*2.7,-5.49-Math.random()*.05);
  snow.geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));snow.userData.lowerY=.92;snow.userData.upperY=3.62;snow.visible=memory.snow;world.add(snow);
}

function buildWallUnit() {
  const g=group(); const x=-4.2,z=-3.95;
  // dark veneer sideboard with asymmetric cupboards and a glass display bay
  addTo(g,box(2.45,2.85,.48,wood,new THREE.Vector3(x,1.46,z)));
  addTo(g,box(2.2,.08,.08,darkWood,new THREE.Vector3(x,.55,z-.27)));
  addTo(g,box(2.2,.08,.08,darkWood,new THREE.Vector3(x,1.47,z-.27)));
  addTo(g,box(2.2,.08,.08,darkWood,new THREE.Vector3(x,2.37,z-.27)));
  const display = new THREE.Mesh(new THREE.PlaneGeometry(.95,.72), new THREE.MeshPhysicalMaterial({color:'#708b87',roughness:.35,transparent:true,opacity:.45,side:THREE.DoubleSide}));
  display.position.set(-4.44,2.0,z-.255); world.add(display);
  for(let i=0;i<8;i++) addTo(g,box(.1,.3+(i%3)*.09,.12,[paper,upholstery,greenUpholstery][i%3],new THREE.Vector3(-5.12+i*.15,.78,z-.3)));
  // ornamental crystal / cups behind glass
  for(let i=0;i<3;i++) addTo(g,cylinder(.09,.06,.24,new THREE.MeshStandardMaterial({color:'#b7c5bb',roughness:.22,metalness:.15,transparent:true,opacity:.72}),new THREE.Vector3(-4.67+i*.25,1.88,z-.3),8));
  markInteractive(g,'cassette');
  // VCR / cassette player occupying its own shelf
  const tape=box(.78,.27,.31,new THREE.MeshStandardMaterial({color:'#1b2423',roughness:.6}),new THREE.Vector3(-3.55,1.05,-4.2));
  addTo(g,tape); addTo(g,box(.5,.04,.015,paper,new THREE.Vector3(-3.55,1.05,-4.035),{shadow:false}));
}

function buildCRT() {
  const g=group();
  addTo(g,roundedBox(1.2,.82,.62,.11,new THREE.MeshStandardMaterial({color:'#2a2925',roughness:.56}),new THREE.Vector3(-2.95,1.3,-4.55)));
  const screenMat=new THREE.MeshStandardMaterial({color:'#1e565d',emissive:'#102b30',emissiveIntensity:.7,roughness:.24});
  addTo(g,box(.92,.55,.025,screenMat,new THREE.Vector3(-2.95,1.31,-4.225),{shadow:false}));
  addTo(g,box(1.45,.24,.72,wood,new THREE.Vector3(-2.95,.73,-4.55)));
  const antennaMat=new THREE.MeshStandardMaterial({color:'#313331',metalness:.5,roughness:.45});
  const a=addTo(g,cylinder(.017,.017,.48,antennaMat,new THREE.Vector3(-3.13,1.98,-4.55),6));a.rotation.z=.62;
  const b=addTo(g,cylinder(.017,.017,.48,antennaMat,new THREE.Vector3(-2.77,1.98,-4.55),6));b.rotation.z=-.62;
}

function buildDesk() {
  const g=group(); const x=3.25,z=-1.75;
  addTo(g,box(2.58,.16,1.12,wood,new THREE.Vector3(x,1.01,z)));
  for(const dx of[-1.05,1.05])for(const dz of[-.42,.42])addTo(g,box(.12,1.02,.12,darkWood,new THREE.Vector3(x+dx,.48,z+dz)));
  addTo(g,box(1.9,1.18,.13,darkWood,new THREE.Vector3(3.2,1.65,-2.23)));
  // rotary phone: base, dial, and rounded handset
  const phoneMat=new THREE.MeshStandardMaterial({color:'#25312e',roughness:.45});
  addTo(g,box(.5,.12,.34,phoneMat,new THREE.Vector3(2.87,1.16,-2.02)));
  addTo(g,cylinder(.1,.1,.025,new THREE.MeshStandardMaterial({color:'#a1a785',roughness:.35}),new THREE.Vector3(2.87,1.23,-2.02),16));
  const handset=addTo(g,cylinder(.055,.055,.34,phoneMat,new THREE.Vector3(2.87,1.29,-2.02),10)); handset.rotation.z=Math.PI/2;
  const book=box(.72,.06,.48,paper,new THREE.Vector3(3.7,1.13,-2.04)); addTo(g,book);
  markInteractive(g,'phone'); markInteractive(book,'notebook');
}

function buildTableAndCup() {
  const g=group(); const x=-2.55,z=.86;
  addTo(g,cylinder(.76,.67,.08,wood,new THREE.Vector3(x,.78,z),18));
  for(const a of[-.48,.48])for(const b of[-.4,.4])addTo(g,cylinder(.055,.07,.75,darkWood,new THREE.Vector3(x+a,.39,z+b),8));
  const cloth = new THREE.Mesh(new THREE.CircleGeometry(.76,24), new THREE.MeshStandardMaterial({map:cloneTexture(textures.cloth,1,1),color:'#9a9277',roughness:1,side:THREE.DoubleSide}));cloth.rotation.x=-Math.PI/2;cloth.position.set(x,.83,z);world.add(cloth);
  const cupMat=new THREE.MeshStandardMaterial({color:'#ddd3b8',roughness:.6});
  const cup=addTo(g,cylinder(.13,.11,.28,cupMat,new THREE.Vector3(-2.7,1.02,.72),14));
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.09,.018,8,12,Math.PI),cupMat);handle.position.set(-2.54,1.03,.72);handle.rotation.y=Math.PI/2;g.add(handle);
  const ash=addTo(g,cylinder(.23,.18,.055,new THREE.MeshStandardMaterial({color:'#403d39',roughness:.42}),new THREE.Vector3(-2.23,.91,.89),14));
  markInteractive(cup,'cup'); markInteractive(ash,'cup');
}

function buildArmchair() {
  const g=group(); const shifted=memory.visits>2?.24:0, x=-2.32+shifted,z=-.55;
  // Rounded cushions give the chair a soft, worn silhouette instead of a blockout profile.
  addTo(g,roundedBox(1.45,.42,1.12,.16,upholstery,new THREE.Vector3(x,.65,z)));
  addTo(g,roundedBox(1.1,1.14,.24,.18,upholstery,new THREE.Vector3(x,1.18,z+.38)));
  addTo(g,box(.18,.58,.9,greenUpholstery,new THREE.Vector3(x-.73,.72,z)));addTo(g,box(.18,.58,.9,greenUpholstery,new THREE.Vector3(x+.73,.72,z)));
  for(const dx of[-.52,.52])for(const dz of[-.38,.38])addTo(g,cylinder(.045,.06,.58,darkWood,new THREE.Vector3(x+dx,.28,z+dz),8));
}

function buildRugAndDetails() {
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.7,2.55), new THREE.MeshStandardMaterial({map:cloneTexture(textures.carpet,1,1),roughness:1,side:THREE.DoubleSide})); rug.rotation.x=-Math.PI/2;rug.position.set(.2,.014,-.25);rug.receiveShadow=true;world.add(rug);
  // radiator with a little pipe; its white enamel catches the window light.
  for(let i=0;i<7;i++)cylinder(.055,.055,.83,new THREE.MeshStandardMaterial({color:'#aaa89a',roughness:.55,metalness:.14}),new THREE.Vector3(5.48,.54,.32+i*.17),10);
  const pipe=cylinder(.045,.045,1.15,new THREE.MeshStandardMaterial({color:'#969487',roughness:.55}),new THREE.Vector3(5.5,.13,.86),10);pipe.rotation.z=Math.PI/2;
  // a small, forgotten plant on the wall unit
  cylinder(.17,.12,.28,new THREE.MeshStandardMaterial({color:'#815238',roughness:.75}),new THREE.Vector3(-4.95,.68,-4.64),10);
  for(const [dx,rz] of [[.18,.4],[-.17,-.35],[.34,-.2]]){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.09,.45,5),new THREE.MeshStandardMaterial({color:'#405d42',roughness:1}));leaf.position.set(-4.95+dx,.99,-4.64);leaf.rotation.z=rz;leaf.castShadow=true;world.add(leaf);}
  // a framed photograph that is deliberately unreadable
  box(.52,.68,.04,wood,new THREE.Vector3(4.95,2.3,1.6));box(.39,.53,.015,new THREE.MeshStandardMaterial({color:'#354a4b',roughness:.8}),new THREE.Vector3(4.95,2.3,1.57),{shadow:false});
}

const LIMINAL_LENGTH = 7.5;
const liminalModules = [];
// The apartment is the installation. The corridor is an optional threshold reached
// through the door, not the default experience visitors accidentally get stuck in.
const requestedSpace = new URLSearchParams(location.search).get('space');
let space = requestedSpace === 'corridor' ? 'corridor' : 'room';
const corridorWall = new THREE.MeshStandardMaterial({ map:cloneTexture(textures.wall,1,1), color:'#77746c', roughness:1 });
const corridorTrim = new THREE.MeshStandardMaterial({ map:cloneTexture(textures.wood,1,1), color:'#5c4537', roughness:.75 });
const corridorDoor = new THREE.MeshStandardMaterial({ map:cloneTexture(textures.wood,1,1), color:'#3a2922', roughness:.84 });
const darkness = new THREE.MeshStandardMaterial({ color:'#080b0c', roughness:1 });
const sickLight = new THREE.MeshStandardMaterial({ color:'#c9b77f', emissive:'#6c552e', emissiveIntensity:1.5, roughness:.65 });
function localMesh(g, geometry, material, x, y, z, rotation = null) { const m = new THREE.Mesh(geometry,material);m.position.set(x,y,z);if(rotation)m.rotation.set(...rotation);m.castShadow=true;m.receiveShadow=true;g.add(m);return m; }
function localBox(g,w,h,d,material,x,y,z) { return localMesh(g,new THREE.BoxGeometry(w,h,d),material,x,y,z); }
function localRoundedBox(g,w,h,d,radius,material,x,y,z) { return localMesh(g,new RoundedBoxGeometry(w,h,d,4,radius),material,x,y,z); }
function localPlane(g,w,h,material,x,y,z,rotation) { const m=localMesh(g,new THREE.PlaneGeometry(w,h),material,x,y,z,rotation);m.receiveShadow=true;return m; }
function addSheerCurtain(g, x, width, height, phase) {
  const geometry = new THREE.PlaneGeometry(width,height,18,20);
  const positions = geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
    const u=(positions.getX(i)/width)+.5;
    const v=(positions.getY(i)/height)+.5;
    // The mesh is softly gathered into depth instead of functioning as a flat card.
    positions.setZ(i,Math.sin((u+phase)*Math.PI*5)*.065*(.65+v*.35)+Math.sin(v*Math.PI*3)*.012);
  }
  positions.needsUpdate=true;geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({map:curtainMap,color:'#e9e4d7',transparent:true,opacity:.42,roughness:1,side:THREE.DoubleSide,depthWrite:false});
  const curtain=new THREE.Mesh(geometry,material);curtain.position.set(x,1.67,-2.90);curtain.castShadow=false;curtain.receiveShadow=false;curtain.renderOrder=1;g.add(curtain);
  return curtain;
}
function attachAsset(g, path, position, scale, rotation, token, interaction = null) {
  gltfLoader.load(path, ({ scene: asset }) => {
    if (token !== buildToken) return;
    asset.position.copy(position); asset.scale.setScalar(scale); asset.rotation.y = rotation;
    asset.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = true; node.receiveShadow = true;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      const remapped = materials.map(material => {
        if (path.includes('ArmChair_01') && material?.color) {
          material.color.set('#ab9678'); material.roughness=.76;
        }
        if (!material?.name?.toLowerCase().includes('screen')) return material;
        // The signal is mapped directly onto the imported, curved CRT screen mesh.
        // It is not a separate rectangle in front of the model, so the cabinet keeps
        // its authored depth and the light follows the glass curvature.
        const screen = new THREE.MeshBasicMaterial({
          color:'#8aaeb8', map:crtSignalMap, side:material.side,
          transparent:false, toneMapped:false,
        });
        tvScreenMaterial = screen;
        return screen;
      });
      node.material = Array.isArray(node.material) ? remapped : remapped[0];
      if (interaction) { node.userData.interaction = interaction; interactive.push(node); }
    });
    g.add(asset);
  });
}

function attachFbxAsset(g, path, position, scale, rotation, token, onReady = null, preserveTextureMaps = false) {
  fbxLoader.load(path, asset => {
    if (token !== buildToken) return;
    asset.position.copy(position); asset.scale.setScalar(scale); asset.rotation.y = rotation;
    asset.traverse(node => {
      if (!node.isMesh) return;
      if (node.name.startsWith('UCX_')) {
        node.visible = false;
        node.userData.collision = true;
        return;
      }
      node.castShadow = true; node.receiveShadow = true;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) {
        if (!material) continue;
        // The supplied FBX points to source textures that are not included in its
        // one-file export. An unresolved Three texture renders black, so fall back
        // to deliberately chosen architectural materials on the real mesh.
        if (!preserveTextureMaps && material.map && !material.map.image) material.map = null;
        const name = material.name.toLowerCase();
        if (name.includes('glass')) {
          material.color.set('#93abb2'); material.transparent = true; material.opacity = .22;
          material.roughness = .18; material.metalness = .08;
        } else if (name.includes('concrete_slab')) {
          material.color.set('#777c7a'); material.roughness = .92;
        } else if (name.includes('blue_plaster')) {
          material.color.set('#6f7e7d'); material.roughness = .96;
        } else if (name.includes('plastered_wall')) {
          material.color.set('#a79e8c'); material.roughness = .97;
        } else if (name.includes('long_white_tiles')) {
          material.color.set('#c2bbae'); material.roughness = .66;
        } else if (name.includes('dirty_tiles')) {
          material.color.set('#8d897d'); material.roughness = .78;
        } else if (name.includes('concrete_floor')) {
          material.color.set('#655f56'); material.roughness = .9;
        } else if (name.includes('herringbone')) {
          material.color.set('#7b5941'); material.roughness = .73;
        } else if (name.includes('dark_wood')) {
          material.color.set('#483126'); material.roughness = .64;
        }
        if (material.emissive) material.emissive.copy(material.color).multiplyScalar(.15);
        // FBX stores much of the apartment as single-sided architectural planes.
        // Rendering both sides is essential once the visitor is inside it.
        material.side = THREE.DoubleSide;
        material.needsUpdate = true;
      }
    });
    g.add(asset);
    onReady?.(asset, new THREE.Box3().setFromObject(asset));
  }, undefined, error => console.error('Brezhnevka failed to load', error));
}

function attachSovietProp(g, name, position, scale, rotation, token, interaction = null) {
  fbxLoader.load(`./assets/models/soviet-props/Meshes_fbx/${name}.fbx`, asset => {
    if (token !== buildToken) return;
    asset.position.copy(position); asset.scale.setScalar(scale); asset.rotation.y = rotation;
    asset.traverse(node => {
      if (!node.isMesh) return;
      // Every mesh in this collection has UVs into Interior_D/N/R/M.  Reusing the
      // authored atlas keeps all the small domestic detail without a material per prop.
      node.material = sovietInteriorMaterial;
      node.castShadow = true; node.receiveShadow = true;
      if (interaction) { node.userData.interaction = interaction; interactive.push(node); }
    });
    g.add(asset);
  }, undefined, error => console.error(`Could not load ${name}`, error));
}

function attachPanelHouse(g, position, scale, rotation, token) {
  fbxLoader.load('./assets/models/panel-house/House_panel.fbx', asset => {
    if (token !== buildToken) return;
    asset.position.copy(position); asset.scale.setScalar(scale); asset.rotation.y = rotation;
    asset.traverse(node => {
      if (!node.isMesh) return;
      const source = Array.isArray(node.material) ? node.material : [node.material];
      const remapped = source.map(material => getPanelHouseMaterial(material?.name || 'Fasad_01'));
      node.material = Array.isArray(node.material) ? remapped : remapped[0];
      node.castShadow = false; node.receiveShadow = true;
    });
    g.add(asset);
  }, undefined, error => console.error('Could not load panel house', error));
}
function addDoorway(g, side, z, open, interaction = null) {
  const x = side * 2.14;
  const aperture = localPlane(g,1.12,2.34,darkness,x,1.18,z,[0,side > 0 ? -Math.PI/2 : Math.PI/2,0]);
  aperture.castShadow=false;
  localBox(g,.12,2.48,.12,corridorTrim,x,1.24,z-.61); localBox(g,.12,2.48,.12,corridorTrim,x,1.24,z+.61);
  localBox(g,.12,.12,1.32,corridorTrim,x,2.42,z);
  const door = localBox(g,.08,2.22,1.06,corridorDoor,x-side*.045,1.14,z+(open?.42:0));
  if(open) door.rotation.y=side * -.68;
  if(interaction){door.userData.interaction=interaction;interactive.push(door);}
  const handle=localMesh(g,new THREE.SphereGeometry(.045,10,8),brass,x-side*.09,1.14,z-.35);handle.castShadow=false;
}
function addModule(index,z) {
  const g=new THREE.Group();g.position.z=z;g.userData.index=index;world.add(g);liminalModules.push(g);
  localPlane(g,4.3,LIMINAL_LENGTH,floorMat,0,0,-LIMINAL_LENGTH/2,[-Math.PI/2,0,0]);
  localPlane(g,4.3,LIMINAL_LENGTH,corridorWall,0,3.15,-LIMINAL_LENGTH/2,[Math.PI/2,0,0]);
  localPlane(g,LIMINAL_LENGTH,3.15,corridorWall,-2.15,1.575,-LIMINAL_LENGTH/2,[0,Math.PI/2,0]);
  localPlane(g,LIMINAL_LENGTH,3.15,corridorWall,2.15,1.575,-LIMINAL_LENGTH/2,[0,-Math.PI/2,0]);
  localBox(g,.12,.16,LIMINAL_LENGTH,corridorTrim,-2.05,.13,-LIMINAL_LENGTH/2);localBox(g,.12,.16,LIMINAL_LENGTH,corridorTrim,2.05,.13,-LIMINAL_LENGTH/2);
  // repeated ceiling fixtures make the hallway feel longer than it is.
  const fixture=localMesh(g,new THREE.BoxGeometry(.72,.06,.34),sickLight,0,3.02,-LIMINAL_LENGTH/2);fixture.castShadow=false;
  const choice=Math.abs(index)%4;
  addDoorway(g,-1,-2.0,choice===1,index===0?'room-door':null); addDoorway(g,1,-5.55,choice===2);
  if(choice===0){
    const rug=localMesh(g,new THREE.PlaneGeometry(1.55,2.65),new THREE.MeshStandardMaterial({map:cloneTexture(textures.carpet,1,1),roughness:1}),0,.014,-3.75,[-Math.PI/2,0,0]);rug.receiveShadow=true;
  }
  if(choice===2){
    const mirror=localPlane(g,.72,1.36,new THREE.MeshStandardMaterial({color:'#526563',metalness:.55,roughness:.3}),-2.085,1.74,-3.75,[0,Math.PI/2,0]);mirror.userData.interaction='mirror';interactive.push(mirror);
  }
}
function build() {
  if(space==='room'){buildRoom7();return;}
  buildToken++; while(world.children.length)world.remove(world.children[0]); interactive.length=0; liminalModules.length=0; snow=null; tvScreenMaterial=null; tvGlowLight=null;
  yaw.position.set(0,1.62,2.3); yaw.rotation.set(0,0,0); pitch.rotation.set(-.015,0,0);
  hemi.intensity=1.08; lamp.intensity=25; windowLight.intensity=18; scene.background.set('#10191a'); scene.fog.color.set('#11191a');
  for(let i=-2;i<20;i++) addModule(i,-i*LIMINAL_LENGTH);
}
function buildRoom7() {
  const token=++buildToken; while(world.children.length)world.remove(world.children[0]); interactive.length=0; liminalModules.length=0; snow=null; tvScreenMaterial=null; tvGlowLight=null;
  yaw.position.set(.45,1.62,2.47); yaw.rotation.set(0,0,0); pitch.rotation.set(-.11,0,0);
  lamp.position.set(-.34,2.93,1.72); lamp.intensity=8.1; windowLight.position.set(0,1.7,-2.45); windowLight.intensity=5.7;
  hemi.intensity=.69; scene.background.set('#121b1d'); scene.fog.color.set('#1c292c'); scene.fog.near=9; scene.fog.far=31;
  const g=group();
  const ceilingMat=new THREE.MeshStandardMaterial({color:'#aba596',roughness:1});
  const baseboard=new THREE.MeshStandardMaterial({color:'#594237',map:veneerMap,roughness:.62});
  const enamel=new THREE.MeshStandardMaterial({color:'#bebaa9',roughness:.56,metalness:.04});
  const blackPlastic=new THREE.MeshStandardMaterial({color:'#252827',roughness:.48});
  const glassy=new THREE.MeshPhysicalMaterial({color:'#739390',metalness:.08,roughness:.18,transparent:true,opacity:.38,side:THREE.DoubleSide});

  // Architecture is deliberately simple; the density comes from period-specific materials and trim, not extra geometry.
  localPlane(g,6.8,6.3,floorMat,0,0,0,[-Math.PI/2,0,0]);
  localPlane(g,6.8,6.3,ceilingMat,0,3.2,0,[Math.PI/2,0,0]);
  localPlane(g,6.3,3.2,roomWallpaper,-3.4,1.6,0,[0,Math.PI/2,0]);
  localPlane(g,6.3,3.2,roomWallpaper,3.4,1.6,0,[0,-Math.PI/2,0]);
  localPlane(g,1.65,3.2,roomWallpaper,-2.58,1.6,-3.12,[0,0,0]);
  localPlane(g,1.65,3.2,roomWallpaper,2.58,1.6,-3.12,[0,0,0]);
  localPlane(g,3.55,.62,roomWallpaper,0,.31,-3.12,[0,0,0]);
  localPlane(g,3.55,.52,roomWallpaper,0,2.95,-3.12,[0,0,0]);
  localPlane(g,6.8,3.2,roomWallpaper,0,1.6,3.12,[0,Math.PI,0]);
  for(const [x,z,w,d] of [[0,-3.05,6.75,.07],[0,3.05,6.75,.07],[-3.31,0,.07,6.15],[3.31,0,.07,6.15]]) localRoundedBox(g,w,.12,d,.025,baseboard,x,.06,z);
  // Slightly imperfect Soviet ceiling seams, just enough to catch the lamp.
  for(const x of[-2.25,0,2.25]) localPlane(g,.018,6.05,new THREE.MeshBasicMaterial({color:'#77756d',transparent:true,opacity:.38}),x,3.185,0,[Math.PI/2,0,0]);
  localMesh(g,new THREE.CylinderGeometry(.25,.25,.052,18),new THREE.MeshStandardMaterial({color:'#8b836e',roughness:.68}),-.34,3.15,1.72);
  localMesh(g,new THREE.CylinderGeometry(.18,.18,.025,18),new THREE.MeshStandardMaterial({color:'#ded2aa',emissive:'#7d6338',emissiveIntensity:.08,roughness:.56}),-.34,3.105,1.72);

  // The supplied Fix Price winter quarter is used as the actual exterior world—not a
  // window image. It includes streets, snow, facades, distant buildings and depth.
  // The scene sits a storey below this room and continues far into fog.
  const winterSky = localPlane(g,120,34,new THREE.MeshBasicMaterial({color:'#18272c'}),0,8,-70,[0,0,0]);
  winterSky.castShadow=false; winterSky.receiveShadow=false;
  // This is a complete, authored winter quarter.  Moving its nearest building beyond
  // the road gives the room a third-floor viewpoint instead of a facade pressed
  // directly against the glass; the scene fog now has real distance to work with.
  attachFbxAsset(g,'./assets/models/fixprice/fixprice.fbx',new THREE.Vector3(0,-.46,-20),.001,0,token,null,true);
  const windowFrame=new THREE.MeshStandardMaterial({color:'#7b6f58',map:veneerMap,roughness:.58});
  const windowGlass=new THREE.MeshBasicMaterial({color:'#cfebed',transparent:true,opacity:.025,depthWrite:false});
  const glassPane=localPlane(g,3.32,2.1,windowGlass,0,1.67,-3.08,[0,0,0]);glassPane.userData.interaction='window';interactive.push(glassPane);
  for(const [x,y,w,h] of [[0,2.74,3.55,.1],[0,.62,3.55,.1],[-1.72,1.68,.1,2.24],[1.72,1.68,.1,2.24],[0,1.68,.075,2.1],[0,1.68,3.32,.075]]) localRoundedBox(g,w,h,.1,.015,windowFrame,x,y,-3.02);
  // A deep painted sill creates a believable boundary between heated room and winter.
  localRoundedBox(g,3.6,.11,.32,.025,windowFrame,0,.64,-2.89);
  localRoundedBox(g,3.7,.05,.08,.015,brass,0,2.84,-2.95);
  // Lace curtains are part of the room's silhouette: gathered, translucent meshes
  // framing the court rather than the broken folded-prop export used previously.
  const curtainRod=localMesh(g,new THREE.CylinderGeometry(.028,.028,3.55,10),brass,0,2.72,-2.89);curtainRod.rotation.z=Math.PI/2;curtainRod.castShadow=false;
  addSheerCurtain(g,-1.18,.82,2.08,.12);addSheerCurtain(g,1.18,.82,2.08,.62);
  const windowSpill=new THREE.SpotLight('#789eb1',12,8,.88,.92,1.65);windowSpill.position.set(0,2.25,-2.76);windowSpill.target.position.set(.15,.18,.45);windowSpill.castShadow=false;g.add(windowSpill,windowSpill.target);
  // Period furniture is grouped in readable zones rather than scattered around the
  // floor: a sofa and tea table, a CRT corner, a working desk and a wall unit.
  attachSovietProp(g,'Carpet_straight01',new THREE.Vector3(.15,.012,-.05),.01,0,token);
  // Measured from the supplied model bounds: its back is flush to the left wall and
  // its face turns into the room, rather than exposing the wrong side to the visitor.
  attachSovietProp(g,'Sofa02_blue',new THREE.Vector3(-2.72,0,.60),.01,Math.PI/2,token);
  attachSovietProp(g,'Table03',new THREE.Vector3(-.28,0,.46),.01,.06,token);
  attachSovietProp(g,'Cup01',new THREE.Vector3(-.32,.79,.44),.01,.06,token,'cup');
  attachSovietProp(g,'Kettle',new THREE.Vector3(-.02,.79,.65),.01,.12,token,'cup');
  attachSovietProp(g,'Tumb01',new THREE.Vector3(-2.53,0,-2.7),.01,0,token);
  attachAsset(g,'./assets/models/crt-vhs/GLTF/CRTTV.gltf',new THREE.Vector3(-2.53,.84,-2.86),1.04,0,token,'cassette');
  tvGlowLight=new THREE.PointLight('#6f99ae',.82,2.55,2);tvGlowLight.position.set(-2.53,1.22,-2.08);g.add(tvGlowLight);
  // Greenery belongs in the TV / cabinet cluster, rather than stranded in the middle
  // of a wall. This keeps the domestic silhouette dense without blocking the view.
  attachSovietProp(g,'Houseplant01',new THREE.Vector3(-2.13,.92,-2.68),.01,-.22,token);
  attachSovietProp(g,'Radiator01',new THREE.Vector3(-.26,0,-3.055),.01,0,token);
  attachSovietProp(g,'Table01',new THREE.Vector3(2.42,0,-1.78),.01,0,token);
  attachSovietProp(g,'Telephone01',new THREE.Vector3(2.16,.735,-1.83),.01,.05,token,'phone');
  attachSovietProp(g,'Files_merged_b',new THREE.Vector3(2.65,.735,-1.82),.004,-.05,token,'notebook');
  attachSovietProp(g,'Radio01',new THREE.Vector3(2.70,.735,-1.48),.01,0,token,'cassette');
  attachSovietProp(g,'Light01_table',new THREE.Vector3(2.89,.735,-2.02),.01,-.18,token);
  // The right wall is a single continuous household zone.  The shelving and dresser
  // are rotated to face into the room and set flush to the wall, not viewed as thin
  // floating side panels.
  attachSovietProp(g,'Bookshelf03',new THREE.Vector3(2.82,0,.28),.01,Math.PI/2,token);
  attachSovietProp(g,'Dresser',new THREE.Vector3(2.84,0,1.70),.01,Math.PI/2,token);
  attachSovietProp(g,'Houseplant03',new THREE.Vector3(2.70,1.44,1.70),.01,.18,token);
  attachSovietProp(g,'Chandelier01a',new THREE.Vector3(-.34,2.32,1.72),.01,0,token);

  // The apartment door closes the room behind the visitor; its route opens onto the
  // corridor only after the core apartment atmosphere is established.
  localRoundedBox(g,1.9,2.46,.11,.03,veneerDark,.15,1.22,3.04);
  const exitDoor=localRoundedBox(g,1.7,2.28,.045,.02,veneer,.15,1.16,2.975);exitDoor.userData.interaction='corridor-door';interactive.push(exitDoor);
  for(const y of [.57,1.18,1.79]) localRoundedBox(g,1.35,.48,.015,.02,veneerDark,.15,y,2.945);
  localMesh(g,new THREE.SphereGeometry(.045,10,8),brass,.78,1.13,2.91);
  // Snow lives in the courtyard volume beyond the glass; it must never cross the room's plane.
  snow=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({color:'#d9e7ef',size:.018,transparent:true,opacity:.64,sizeAttenuation:true,depthWrite:false}));
  const dots=[];for(let i=0;i<180;i++)dots.push((Math.random()-.5)*5.6,.18+Math.random()*4.35,-4.45-Math.random()*5.2);
  snow.geometry.setAttribute('position',new THREE.Float32BufferAttribute(dots,3));snow.userData.lowerY=.12;snow.userData.upperY=4.5;snow.userData.outdoor=true;snow.visible=memory.snow;world.add(snow);
}
function updateLiminalSpace() {
  if(!liminalModules.length)return;
  let front=Math.min(...liminalModules.map(m=>m.position.z)),back=Math.max(...liminalModules.map(m=>m.position.z));
  for(const module of liminalModules){
    if(module.position.z > yaw.position.z + LIMINAL_LENGTH*2){module.position.z=front-LIMINAL_LENGTH;front=module.position.z;}
    else if(module.position.z < yaw.position.z-LIMINAL_LENGTH*12){module.position.z=back+LIMINAL_LENGTH;back=module.position.z;}
  }
  const lampSegment=Math.floor((yaw.position.z+LIMINAL_LENGTH*.5)/LIMINAL_LENGTH)*LIMINAL_LENGTH-LIMINAL_LENGTH*.5;
  lamp.position.set(0,2.86,lampSegment); windowLight.position.set(0,1.95,lampSegment-LIMINAL_LENGTH*.55);
}
function buildMirror() {
  const g=group(); const frame=mat('#746851',.7,cloneTexture(textures.wood,1,1));
  addTo(g,box(.12,2.15,1.28,frame,new THREE.Vector3(-5.7,2.18,-.4)));
  const mirrorMat=new THREE.MeshPhysicalMaterial({color:seen('mirror')>=4?'#0d1010':'#728c89',metalness:.6,roughness:.28,transparent:seen('mirror')<4,opacity:.7});
  addTo(g,box(.025,1.82,1.0,mirrorMat,new THREE.Vector3(-5.62,2.18,-.4),{shadow:false}));
  if(seen('mirror')>=3){for(let i=0;i<4;i++){const crack=box(.018,.018,.62,paper,new THREE.Vector3(-5.6,2.12+i*.14,-.4+i*.04),{shadow:false});crack.rotation.x=.5+i*.3;}}
  markInteractive(g,'mirror');
}

// -------------------------- snow / interaction --------------------------
function updateSnow(dt) {
  if (!snow?.visible) return;
  const p=snow.geometry.attributes.position, lower=snow.userData.lowerY??.92, upper=snow.userData.upperY??3.6;
  for(let i=0;i<p.count;i++){
    p.array[i*3+1]-=dt*.38;
    if(p.array[i*3+1]<lower){
      p.array[i*3+1]=upper;
      if(snow.userData.outdoor){p.array[i*3]=(Math.random()-.5)*5.6;p.array[i*3+2]=-4.45-Math.random()*5.2;}
    }
    p.array[i*3]+=Math.sin(i*17+p.array[i*3+1])*dt*.035;
  }
  p.needsUpdate=true;
}
const raycaster = new THREE.Raycaster();
let current = null;
function updateFocus() { raycaster.setFromCamera(new THREE.Vector2(),camera); const hit=raycaster.intersectObjects(interactive,false).find(h=>h.object.userData.interaction);current=hit?.object.userData.interaction||null;focus.classList.toggle('active',Boolean(current)); }

function speak(text,duration=4400){whisper.textContent=text;whisper.classList.add('visible');accessibility.textContent=text;clearTimeout(speak.timer);speak.timer=setTimeout(()=>whisper.classList.remove('visible'),duration);}
function showTrack(text,duration=8200){fragment.textContent=text;fragment.classList.add('visible');clearTimeout(showTrack.timer);showTrack.timer=setTimeout(()=>fragment.classList.remove('visible'),duration);}
const subtitle=text=>{if(memory.subtitles)speak(text,3600);};

class Sound {
  constructor(){this.context=null;this.master=null;}
  start(){if(this.context){this.context.resume();return;}const A=window.AudioContext||window.webkitAudioContext;if(!A)return;this.context=new A();this.master=this.context.createGain();this.master.gain.value=memory.volume;this.master.connect(this.context.destination);const b=this.context.createBuffer(1,this.context.sampleRate*2,this.context.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.13;const n=this.context.createBufferSource(),f=this.context.createBiquadFilter(),g=this.context.createGain();n.buffer=b;n.loop=true;f.type='lowpass';f.frequency.value=360;g.gain.value=.055;n.connect(f).connect(g).connect(this.master);n.start();}
  tone(freq,seconds=.3,type='sine',amount=.04){if(!this.context)return;const t=this.context.currentTime,o=this.context.createOscillator(),g=this.context.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(amount,t+.025);g.gain.exponentialRampToValueAtTime(.001,t+seconds);o.connect(g).connect(this.master);o.start(t);o.stop(t+seconds+.03);}
  fragment(kind){const notes=kind==='jump'?[220,293,349,440,330,262]:kind==='casting'?[164,196,246,220,196]:[146,174,220,196,146];let i=0;const play=()=>{this.tone(notes[i%notes.length],.55,'triangle',.034);i++;if(i<38)setTimeout(play,480);};play();}
  kettle(){if(!this.context)return;const t=this.context.currentTime,o=this.context.createOscillator(),g=this.context.createGain();o.frequency.setValueAtTime(1380,t);o.frequency.linearRampToValueAtTime(1740,t+2.1);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(.035,t+.12);g.gain.exponentialRampToValueAtTime(.001,t+2.4);o.connect(g).connect(this.master);o.start(t);o.stop(t+2.5);}
}
const sound=new Sound();const pages=['the room was warmer then.','do not wait for me.','it was snowing in the kitchen.','you already know this place.','leave the light on.'];
let interactionBusy=false;
function interact(id) {
  if(!id||interactionBusy)return;interactionBusy=true;setTimeout(()=>interactionBusy=false,600);sound.start();const n=mark(id);
  if(id==='room-door'){space='room';build();speak('the lock gives way without a sound.',4400);return;}
  if(id==='corridor-door'){space='corridor';build();speak('the hallway is where you left it.',4400);return;}
  if(id==='window'){memory.snow=true;save();snow.visible=true;sound.fragment('jump');speak('outside, something keeps falling.');showTrack('прыжок / fragment');}
  if(id==='phone'){if(n===1){sound.tone(440,.9);setTimeout(()=>sound.tone(440,.9),1100);subtitle('a line opens, then forgets you.');}else if(n===2){sound.tone(262,.18,'square');speak('1 missed call',4800);}else subtitle('only the room answers.');}
  if(id==='notebook'){speak(pages[(memory.visits+n-1)%pages.length],5500);sound.tone(620,.1);}
  if(id==='mirror'){build();if(n===2)speak('the reflection arrives a moment late.');if(n===3)speak('a thin line remembers the impact.');if(n>=4)speak('there is no one here.');sound.fragment('casting');showTrack('кастинг / fragment');}
  if(id==='cup'){subtitle('the cup is warm.');setTimeout(()=>sound.kettle(),5100);}
  if(id==='cassette'){sound.fragment('water');showTrack(n%2?'состояние воды / fragment':'слово / fragment');subtitle('the tape begins in the middle.');}
}

// ------------------------------ movement ---------------------------------
const keys=new Set();let started=false,settingsOpen=false,last=performance.now();
let sustainedSlowFrames=0, reducedQuality=false;
// Invisible clearance volumes prevent the camera from passing through large furniture.
// They are intentionally a little smaller than each model's footprint so visitors can
// still lean close to an object without discovering its raw polygon interiors.
const roomObstacles=[
  {minX:-3.30,maxX:-2.32,minZ:-.36,maxZ:1.56},  // sofa against the left wall
  {minX:-.98,maxX:.43,minZ:.02,maxZ:1.10},      // central tea table
  {minX:-3.18,maxX:-1.88,minZ:-3.08,maxZ:-2.32},// TV stand
  {minX:1.76,maxX:3.15,minZ:-2.35,maxZ:-1.10},  // writing table
  {minX:2.34,maxX:3.34,minZ:-.50,maxZ:2.40},    // right-wall shelf + dresser
];
function clearsRoomFurniture(position){
  const padding=.22;
  return !roomObstacles.some(o=>position.x>o.minX-padding&&position.x<o.maxX+padding&&position.z>o.minZ-padding&&position.z<o.maxZ+padding);
}
function toggleSettings(force){if(!started)return;settingsOpen=force??!settingsOpen;settings.classList.toggle('open',settingsOpen);settings.setAttribute('aria-hidden',String(!settingsOpen));if(settingsOpen&&document.pointerLockElement===canvas)document.exitPointerLock();}
function begin(){started=true;arrival.classList.add('leaving');canvas.focus();sound.start();canvas.requestPointerLock?.();}
function move(dt){
  if(!started||settingsOpen)return;
  const speed=dt*.0011;
  const forward=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0),yaw.rotation.y);
  const side=new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0),yaw.rotation.y);
  const candidate=yaw.position.clone();
  if(keys.has('KeyW'))candidate.addScaledVector(forward,speed);
  if(keys.has('KeyS'))candidate.addScaledVector(forward,-speed);
  if(keys.has('KeyA'))candidate.addScaledVector(side,-speed);
  if(keys.has('KeyD'))candidate.addScaledVector(side,speed);
  if(space==='room'){
    candidate.x=THREE.MathUtils.clamp(candidate.x,-3.0,3.0);
    candidate.z=THREE.MathUtils.clamp(candidate.z,-1.65,2.65);
    if(clearsRoomFurniture(candidate))yaw.position.copy(candidate);
  }else{candidate.x=THREE.MathUtils.clamp(candidate.x,-1.86,1.86);yaw.position.copy(candidate);}
}
canvas.addEventListener('click',()=>{if(!started||settingsOpen)return;if(current)interact(current);else canvas.requestPointerLock?.();});
enter.addEventListener('click',begin);
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas&&!settingsOpen){yaw.rotation.y-=e.movementX*.0021;pitch.rotation.x=THREE.MathUtils.clamp(pitch.rotation.x-e.movementY*.0017,-.68,.34);}});
document.addEventListener('keydown',e=>{if(e.code==='Escape'){if(started)toggleSettings();return;}if(settingsOpen)return;if(['KeyW','KeyA','KeyS','KeyD'].includes(e.code)){keys.add(e.code);e.preventDefault();}if(e.code==='KeyE')interact(current);});
document.addEventListener('keyup',e=>keys.delete(e.code));
continueButton.addEventListener('click',()=>toggleSettings(false));
forgetButton.addEventListener('click',()=>{localStorage.removeItem(SAVE_KEY);location.reload();});
volumeInput.value=Math.round(memory.volume*100);subtitleInput.checked=memory.subtitles;
volumeInput.addEventListener('input',()=>{memory.volume=Number(volumeInput.value)/100;save();if(sound.master)sound.master.gain.value=memory.volume;});
subtitleInput.addEventListener('change',()=>{memory.subtitles=subtitleInput.checked;save();});

function resize(){renderer.setSize(innerWidth,innerHeight,false);composer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();build();
function render(time){
  const rawDt=time-last,dt=Math.min(45,rawDt);last=time;
  // One quiet fallback on weak machines: preserve the scene before chasing pixels.
  if(!reducedQuality){
    sustainedSlowFrames=rawDt>29?sustainedSlowFrames+1:Math.max(0,sustainedSlowFrames-2);
    if(sustainedSlowFrames>90){renderer.setPixelRatio(1);reducedQuality=true;resize();}
  }
  if(tvScreenMaterial){
    const flicker=.43+Math.sin(time*.018)*.035+Math.sin(time*.071)*.02;
    // The screen keeps a restrained, evenly distributed phosphor glow.  Brightness
    // changes only slightly, avoiding the old hard flare that made it look like a
    // light source pasted on the cabinet.
    tvScreenMaterial.color.setRGB(.40+flicker*.30,.57+flicker*.32,.61+flicker*.34);
    if(tvGlowLight)tvGlowLight.intensity=.58+Math.sin(time*.018)*.08;
  }
  move(dt);if(space==='corridor')updateLiminalSpace();updateSnow(dt*.001);updateFocus();composer.render();requestAnimationFrame(render);
}requestAnimationFrame(render);
