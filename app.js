import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadImageFile, parseFloorPlanCV } from './floorplanParser.js';

// ============================================================
// 1. DESIGN VARIANTS (3 Warm Minimalism / Japandi Options)
// ============================================================
const VARIANTS = {
  light: {
    name: 'Светлый Japandi',
    bgDay: 0xeee9e1,
    bgNight: 0x1d1a17,
    wall: 0xefe9df,
    wallOuter: 0xd9d1c5,
    wood: 0xd1ad82,
    woodDark: 0xb68d60,
    floorBase: '#d8b991',
    floorLine: '#be9c72',
    tileBase: '#e4ddd2',
    tileLine: '#cfc6b8',
    deckBase: '#c69e72',
    deckLine: '#9e784f',
    sofa: 0xf4eee4,
    cushion: 0xc2ab90,
    bedLinen: 0xf6f1e9,
    bedThrow: 0xb99d80,
    rug: 0xe6ddd0,
    kitchenLower: 0xdfd5c7,
    kitchenUpper: 0xf3ede4,
    countertop: 0xebe4da,
    metal: 0x5c5349,
    plant: 0x587352,
    specs: [
      '<strong>Стены:</strong> кремовая декоративная штукатурка / известковая краска',
      '<strong>Пол:</strong> инженерная доска светлый дуб, в санузлах — светлый травертин',
      '<strong>Кухня:</strong> фасады без ручек кашемир + светлый дуб, столешница травертин',
      '<strong>Мебель:</strong> диван букле, реечная ТВ-стена, обеденный стол из массива дуба',
      '<strong>Свет:</strong> тёплая скрытая LED-подсветка 3000K + льняные шторы в пол'
    ]
  },
  walnut: {
    name: 'Орех и Грейдж',
    bgDay: 0xe4dfd8,
    bgNight: 0x171412,
    wall: 0xd4cdc3,
    wallOuter: 0xb8b0a4,
    wood: 0x6f4b34,
    woodDark: 0x4d3322,
    floorBase: '#7d563c',
    floorLine: '#5c3c27',
    tileBase: '#8f887e',
    tileLine: '#726b62',
    deckBase: '#5d4736',
    deckLine: '#3f2f23',
    sofa: 0xb8a898,
    cushion: 0xb3694a,
    bedLinen: 0xe2dbd1,
    bedThrow: 0x9b5a3f,
    rug: 0xc8bfb4,
    kitchenLower: 0x66442f,
    kitchenUpper: 0xc2bab0,
    countertop: 0x4b4640,
    metal: 0x24211e,
    plant: 0x486144,
    specs: [
      '<strong>Стены:</strong> тёплый грейдж микроцемент и фактурная штукатурка',
      '<strong>Пол:</strong> широкая доска американский орех, в санузлах — тёмный керамогранит',
      '<strong>Кухня:</strong> рифлёный орех снизу, матовый грейдж сверху, тёмный камень',
      '<strong>Мебель:</strong> низкий диван тауп, терракотовые акценты, чёрная матовая фурнитура',
      '<strong>Свет:</strong> камерная вечерняя подсветка ниш, бронзовые подвесы'
    ]
  },
  scandi: {
    name: 'Сканди-Джапанди',
    bgDay: 0xf1f0eb,
    bgNight: 0x1c1f1c,
    wall: 0xf7f6f1,
    wallOuter: 0xdce0da,
    wood: 0xdec8aa,
    woodDark: 0xc3a884,
    floorBase: '#e4d3ba',
    floorLine: '#cbb698',
    tileBase: '#ecebe6',
    tileLine: '#d5d4ce',
    deckBase: '#cfa97e',
    deckLine: '#ab855c',
    sofa: 0xedeae2,
    cushion: 0x8ea38b,
    bedLinen: 0xfafaf6,
    bedThrow: 0x8da189,
    rug: 0xebe6dc,
    kitchenLower: 0x9eb09b,
    kitchenUpper: 0xf6f5f0,
    countertop: 0xfaf9f5,
    metal: 0x4c524b,
    plant: 0x5c8054,
    specs: [
      '<strong>Стены:</strong> тёплый молочно-белый с акцентными деревянными панелями',
      '<strong>Пол:</strong> белёный ясень в комнатах, светлое терраццо в санузлах',
      '<strong>Кухня:</strong> нижние фасады цвета шалфей, белый верх, кварцевая столешница',
      '<strong>Мебель:</strong> льняной диван, плетёные стулья, много живых растений',
      '<strong>Свет:</strong> максимум дневного воздуха, лёгкие ткани, уютная лаунж-терраса'
    ]
  },
  neoclassic: {
    name: 'Неоклассика / Luxury',
    bgDay: 0xececf0,
    bgNight: 0x171821,
    wall: 0xf2f1ee,
    wallOuter: 0xd6d4d0,
    wood: 0xc5a882,
    woodDark: 0x9e7f58,
    floorBase: '#d4b891',
    floorLine: '#b89b74',
    tileBase: '#f5f4f0',
    tileLine: '#d8d2c7',
    deckBase: '#dcd8d0',
    deckLine: '#c1bcb2',
    sofa: 0x264b42,
    cushion: 0xd4b47c,
    bedLinen: 0xf7f4ee,
    bedThrow: 0x2c4e46,
    rug: 0xe9e4dc,
    kitchenLower: 0xf4f2ec,
    kitchenUpper: 0xfaf9f5,
    countertop: 0xf6f4ee,
    metal: 0xc7a252,
    plant: 0x3b5c42,
    specs: [
      '<strong>Стены:</strong> жемчужно-белый с молдингами и акцентами из матовой латуни',
      '<strong>Пол:</strong> паркет ёлочка в спальнях, белый мрамор Calacatta на кухне и в санузлах',
      '<strong>Кухня:</strong> классические рамочные фасады крем-белый, латунные ручки, мрамор',
      '<strong>Мебель:</strong> изумрудный бархатный диван, золотые детали, мягкие изголовья',
      '<strong>Свет:</strong> элегантный дневной свет и тёплое свечение латунных светильников'
    ]
  },
  loft: {
    name: 'Лофт / Индустриальный',
    bgDay: 0xd8d6d2,
    bgNight: 0x121213,
    wall: 0x94918c,
    wallOuter: 0x5c5955,
    wood: 0x593d2b,
    woodDark: 0x362419,
    floorBase: '#5e4332',
    floorLine: '#3d2a1e',
    tileBase: '#4c4b49',
    tileLine: '#333230',
    deckBase: '#4a3d33',
    deckLine: '#2e251e',
    sofa: 0x9c552e,
    cushion: 0x383634,
    bedLinen: 0x52504e,
    bedThrow: 0x8f4c2a,
    rug: 0x736f6a,
    kitchenLower: 0x292827,
    kitchenUpper: 0x3b3937,
    countertop: 0x21201f,
    metal: 0x1a1a1a,
    plant: 0x455c3e,
    specs: [
      '<strong>Стены:</strong> архитектурный бетон, акценты тёплого кирпича и чёрный металл',
      '<strong>Пол:</strong> тёмный копчёный дуб, в санузлах и кухне — графитовый сланец',
      '<strong>Кухня:</strong> матовый чёрный фасад, тёмная каменная столешница, трековый свет',
      '<strong>Мебель:</strong> коньячный кожаный диван, стальные стеллажи, массивный стол',
      '<strong>Свет:</strong> контрастный направленный свет и тёплые лампы Эдисона'
    ]
  },
  mediterranean: {
    name: 'Средиземноморский',
    bgDay: 0xf4efe6,
    bgNight: 0x1e1a16,
    wall: 0xf8f5ee,
    wallOuter: 0xe3d8c8,
    wood: 0xd8b88c,
    woodDark: 0xb58d5e,
    floorBase: '#e6d6bc',
    floorLine: '#cfbda0',
    tileBase: '#e8d7c0',
    tileLine: '#ccb79b',
    deckBase: '#c98863',
    deckLine: '#a36846',
    sofa: 0xf7f4ed,
    cushion: 0x5d8aa8,
    bedLinen: 0xfaf8f2,
    bedThrow: 0x628ea8,
    rug: 0xe7dccb,
    kitchenLower: 0xe6dac8,
    kitchenUpper: 0xf8f5ee,
    countertop: 0xeee5d8,
    metal: 0xa68356,
    plant: 0x688255,
    specs: [
      '<strong>Стены:</strong> тёплая белая фактурная штукатурка, мягкие ниши, много солнца',
      '<strong>Пол:</strong> светлый известняк/песчаник, на балконах — тёплая терракота',
      '<strong>Кухня:</strong> выбеленный дуб и светлая штукатурка, столешница из песчаника',
      '<strong>Мебель:</strong> белый льняной диван, ротанг, акценты морского синего и терракоты',
      '<strong>Свет:</strong> атмосфера курортной виллы, оливковые деревья на террасе'
    ]
  },
  hightech: {
    name: 'Хай-Тек / Футуризм',
    bgDay: 0xe6eaef,
    bgNight: 0x10141c,
    wall: 0xf2f4f7,
    wallOuter: 0xc2c8d1,
    wood: 0x9aa3ad,
    woodDark: 0x4b535e,
    floorBase: '#d4d8de',
    floorLine: '#bcc2cb',
    tileBase: '#dfe3e8',
    tileLine: '#c5cbd4',
    deckBase: '#7c838c',
    deckLine: '#5c626b',
    sofa: 0xeef1f5,
    cushion: 0x3b82a8,
    bedLinen: 0xf5f7fa,
    bedThrow: 0x374151,
    rug: 0xd0d5dc,
    kitchenLower: 0x323740,
    kitchenUpper: 0xf5f7fa,
    countertop: 0xfafbfc,
    metal: 0x94a3b8,
    plant: 0x486e58,
    specs: [
      '<strong>Стены:</strong> идеально гладкий холодный белый + матовые графитовые панели',
      '<strong>Пол:</strong> наливной светло-серый микроцемент и крупноформатный глянец',
      '<strong>Кухня:</strong> глянцевый белый + матовый графит без ручек, белый Corian',
      '<strong>Мебель:</strong> итальянская белая кожа, стекло, хром и парящая кровать с подсветкой',
      '<strong>Свет:</strong> тонкие линейные LED-профили холодного белого и ледяного синего'
    ]
  }
};

// ============================================================
// 2. PROCEDURAL TEXTURES
// ============================================================
function createWoodFloorTexture(baseColor, lineColor) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const rows = 8;
  const rowH = 512 / rows;
  for (let r = 0; r < rows; r++) {
    ctx.fillStyle = r % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
    ctx.fillRect(0, r * rowH, 512, rowH);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, r * rowH);
    ctx.lineTo(512, r * rowH);
    ctx.stroke();

    // Vertical seam
    const offset = (r % 2) * 220 + 90;
    ctx.beginPath();
    ctx.moveTo(offset, r * rowH);
    ctx.lineTo(offset, (r + 1) * rowH);
    ctx.stroke();

    // Subtle wood grain
    ctx.strokeStyle = 'rgba(0,0,0,0.035)';
    ctx.lineWidth = 1;
    for (let g = 0; g < 4; g++) {
      const gy = r * rowH + 10 + g * 14;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(512, gy + (g % 2 === 0 ? 2 : -2));
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3.5, 3.5);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTileTexture(baseColor, lineColor) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle stone mottling
  for (let i = 0; i < 180; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 18, 12);
  }

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 128, 128);
  ctx.strokeRect(128, 0, 128, 128);
  ctx.strokeRect(0, 128, 128, 128);
  ctx.strokeRect(128, 128, 128, 128);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createDeckTexture(baseColor, lineColor) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 10; i++) {
    const y = i * 25.6;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    ctx.fillRect(0, y, 256, 25.6);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ============================================================
// 3. THREE.JS SCENE SETUP
// ============================================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(VARIANTS.light.bgDay);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(14.5, 13.5, 16.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.minDistance = 3;
controls.maxDistance = 32;
controls.target.set(6.8, 0.6, 4.7);

// Lighting
const hemiLight = new THREE.HemisphereLight(0xfff9f0, 0xc9bfb2, 0.9);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff5e4, 1.35);
sunLight.position.set(12, 18, 14);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 2;
sunLight.shadow.camera.far = 45;
sunLight.shadow.camera.left = -12;
sunLight.shadow.camera.right = 12;
sunLight.shadow.camera.top = 12;
sunLight.shadow.camera.bottom = -12;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0xdbe8f8, 0.35);
fillLight.position.set(-10, 10, -8);
scene.add(fillLight);

// Warm interior point lights (stronger in evening mode)
const interiorLights = [];
function addWarmLight(x, y, z, intensity = 0.4, distance = 7) {
  const pl = new THREE.PointLight(0xffcb8c, intensity, distance, 1.6);
  pl.position.set(x, y, z);
  scene.add(pl);
  interiorLights.push(pl);
  return pl;
}
addWarmLight(4.8, 2.3, 3.8, 0.4, 8);   // Living room
addWarmLight(7.5, 2.2, 4.9, 0.35, 6);  // Kitchen
addWarmLight(1.6, 2.2, 4.4, 0.35, 7);  // Master bedroom
addWarmLight(9.4, 2.2, 5.2, 0.25, 6);  // Bedroom 2
addWarmLight(12.1, 2.2, 3.5, 0.3, 7);  // Bedroom 3
addWarmLight(1.6, 2.1, 1.1, 0.25, 5);  // Bath 1
addWarmLight(9.2, 2.1, 1.0, 0.25, 5);  // Bath 2

// Soft ground plane
const groundGeo = new THREE.PlaneGeometry(80, 80);
const groundMat = new THREE.ShadowMaterial({ opacity: 0.14 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.06;
ground.receiveShadow = true;
scene.add(ground);

// ============================================================
// 4. SHARED MATERIALS (Updated live when switching variants)
// ============================================================
const M = {
  wall: new THREE.MeshStandardMaterial({ color: VARIANTS.light.wall, roughness: 0.88 }),
  wallOuter: new THREE.MeshStandardMaterial({ color: VARIANTS.light.wallOuter, roughness: 0.9 }),
  wood: new THREE.MeshStandardMaterial({ color: VARIANTS.light.wood, roughness: 0.62 }),
  woodDark: new THREE.MeshStandardMaterial({ color: VARIANTS.light.woodDark, roughness: 0.58 }),
  floorWood: new THREE.MeshStandardMaterial({ roughness: 0.55 }),
  floorTile: new THREE.MeshStandardMaterial({ roughness: 0.42 }),
  floorDeck: new THREE.MeshStandardMaterial({ roughness: 0.72 }),
  sofa: new THREE.MeshStandardMaterial({ color: VARIANTS.light.sofa, roughness: 0.92 }),
  cushion: new THREE.MeshStandardMaterial({ color: VARIANTS.light.cushion, roughness: 0.88 }),
  bedLinen: new THREE.MeshStandardMaterial({ color: VARIANTS.light.bedLinen, roughness: 0.9 }),
  bedThrow: new THREE.MeshStandardMaterial({ color: VARIANTS.light.bedThrow, roughness: 0.88 }),
  rug: new THREE.MeshStandardMaterial({ color: VARIANTS.light.rug, roughness: 0.96 }),
  kitchenLower: new THREE.MeshStandardMaterial({ color: VARIANTS.light.kitchenLower, roughness: 0.55 }),
  kitchenUpper: new THREE.MeshStandardMaterial({ color: VARIANTS.light.kitchenUpper, roughness: 0.5 }),
  countertop: new THREE.MeshStandardMaterial({ color: VARIANTS.light.countertop, roughness: 0.3 }),
  metal: new THREE.MeshStandardMaterial({ color: VARIANTS.light.metal, roughness: 0.35, metalness: 0.65 }),
  ceramic: new THREE.MeshStandardMaterial({ color: 0xfbfaf8, roughness: 0.2 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xdff0f5,
    transparent: true,
    opacity: 0.32,
    roughness: 0.08,
    metalness: 0.05
  }),
  tvScreen: new THREE.MeshStandardMaterial({ color: 0x16171a, roughness: 0.18, metalness: 0.2 }),
  plant: new THREE.MeshStandardMaterial({ color: VARIANTS.light.plant, roughness: 0.8 }),
  pot: new THREE.MeshStandardMaterial({ color: 0xc9b8a3, roughness: 0.85 }),
  lampGlow: new THREE.MeshStandardMaterial({
    color: 0xfff3dc,
    emissive: 0xffc675,
    emissiveIntensity: 0.55,
    roughness: 0.4
  })
};

// ============================================================
// 5. ARCHITECTURAL HELPERS (Centering apartment at ~6.85, 4.7)
// ============================================================
const aptGroup = new THREE.Group();
scene.add(aptGroup);

const wallMeshes = [];
const FULL_WALL_H = 2.75;
const CUTAWAY_WALL_H = 1.65;
let isCutaway = true;

function addBox(w, h, d, x, y, z, mat, parent = aptGroup, cast = true, receive = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  parent.add(mesh);
  return mesh;
}

function addWall(x1, z1, x2, z2, thickness = 0.12, isOuter = false, heightScale = 1.0) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const h = FULL_WALL_H * heightScale;
  const geo = new THREE.BoxGeometry(len, h, thickness);
  const mesh = new THREE.Mesh(geo, isOuter ? M.wallOuter : M.wall);
  mesh.position.set(cx, h / 2, cz);
  mesh.rotation.y = -Math.atan2(dz, dx);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.baseHeight = h;
  mesh.userData.isWall = true;
  aptGroup.add(mesh);
  wallMeshes.push(mesh);
  return mesh;
}

function addGlassPartition(x1, z1, x2, z2, height = 2.35, thickness = 0.04) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, height, thickness), M.glass);
  mesh.position.set(cx, height / 2, cz);
  mesh.rotation.y = -Math.atan2(dz, dx);
  aptGroup.add(mesh);
  // Top/bottom slender frames
  const frameB = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.06), M.metal);
  frameB.position.set(cx, 0.025, cz);
  frameB.rotation.y = -Math.atan2(dz, dx);
  aptGroup.add(frameB);
  return mesh;
}

function addFloor(x1, z1, x2, z2, mat, y = 0) {
  const w = x2 - x1;
  const d = z2 - z1;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), mat);
  mesh.position.set((x1 + x2) / 2, y - 0.04, (z1 + z2) / 2);
  mesh.receiveShadow = true;
  aptGroup.add(mesh);
  return mesh;
}

// ============================================================
// 6. BUILD EXACT APARTMENT SHELL (Matching Blueprint mm!)
// ============================================================
// Base architectural slab
addBox(14.1, 0.14, 9.7, 6.85, -0.11, 4.75, M.wallOuter, aptGroup, false, true);

// Floors per room
// 1) Bath 1 (top-left, 4.52 m²)
addFloor(0.25, 0.25, 2.95, 2.05, M.floorTile);
// 2) Master Bedroom (left + bottom alcove, 22.72 m²)
addFloor(0.25, 2.05, 2.95, 9.20, M.floorWood);
// 3) Living Room + Entry (center, 31.17 m² total with kitchen)
addFloor(3.05, 0.25, 6.55, 6.65, M.floorWood);
// 4) Kitchen zone (right side of open living)
addFloor(6.55, 3.10, 8.15, 6.65, M.floorTile);
// 5) Entry passage to inner hall
addFloor(6.55, 1.80, 8.20, 3.10, M.floorWood);
// 6) Bathroom 2 (top-right-center, 4.15 m²)
addFloor(7.85, 0.25, 10.65, 1.75, M.floorTile);
// 7) Inner Hallway (5.58 m²)
addFloor(8.20, 1.80, 10.65, 3.10, M.floorWood);
// 8) Bedroom 2 (middle-right, 10.63 m²)
addFloor(8.25, 3.15, 10.65, 7.55, M.floorWood);
// 9) Bedroom 3 (far-right, 14.85 m²)
addFloor(10.75, 0.65, 13.45, 6.15, M.floorWood);
// 10) Big Balcony (10.03 m²)
addFloor(3.05, 6.65, 6.85, 9.20, M.floorDeck, -0.02);
// 11) Small Balcony (3.12 m²)
addFloor(10.75, 6.15, 13.45, 7.55, M.floorDeck, -0.02);

// Exterior Perimeter Walls
// Top wall
addWall(0.15, 0.18, 5.40, 0.18, 0.24, true);   // Top-left to entry door
addWall(6.50, 0.18, 10.75, 0.18, 0.24, true);  // Entry door to Bed 3 top
addWall(10.75, 0.58, 13.55, 0.58, 0.24, true); // Bed 3 top wall (recessed utility niches)
// Left exterior wall
addWall(0.18, 0.15, 0.18, 9.28, 0.24, true);
// Bottom-left wall (Master Bedroom bottom)
addWall(0.15, 9.22, 3.05, 9.22, 0.24, true);
// Right exterior wall
addWall(13.52, 0.55, 13.52, 7.58, 0.24, true);
// Bottom wall of Kitchen & Bed 2 (with 1.7m window in Bed 2)
addWall(6.80, 6.68, 8.30, 6.68, 0.24, true);
addWall(8.22, 6.65, 8.22, 7.58, 0.22, true);
addWall(8.20, 7.58, 8.65, 7.58, 0.22, true);   // Bed 2 left of window
addWall(10.35, 7.58, 10.78, 7.58, 0.22, true); // Bed 2 right of window
// Bed 2 window sill + glass
addWall(8.65, 7.58, 10.35, 7.58, 0.20, true, 0.30);
addGlassPartition(8.65, 7.58, 10.35, 7.58, 2.2);

// Entry Door (top-center)
addBox(1.06, 2.25, 0.08, 5.95, 1.125, 0.18, M.woodDark);
addBox(0.05, 0.16, 0.12, 5.55, 1.05, 0.20, M.metal);

// Interior Partitions
// Bath 1 / Master Bedroom wall (with 0.85m door opening at X=1.2–2.05)
addWall(0.25, 2.10, 1.20, 2.10, 0.12);
addWall(2.05, 2.10, 3.00, 2.10, 0.12);

// Master Bedroom / Living Room wall (X=3.00, door near top Z=2.2–3.1, balcony door Z=7.2–8.1)
addWall(3.00, 0.25, 3.00, 2.20, 0.12);
addWall(3.00, 3.10, 3.00, 7.15, 0.12);
addWall(3.00, 8.15, 3.00, 9.22, 0.12);
addGlassPartition(3.00, 7.15, 3.00, 8.15, 2.25); // Master -> Big Balcony glass door

// Living Room / Big Balcony floor-to-ceiling glass wall (Z=6.65, X=3.05–6.80)
addGlassPartition(3.05, 6.65, 6.80, 6.65, 2.35);

// Structural pillar + utility shaft between Entry/Hallway and Kitchen
addBox(0.95, 2.75, 0.65, 7.05, 1.375, 0.60, M.wall);
addBox(1.55, 2.75, 0.62, 7.42, 1.375, 3.12, M.wall); // Kitchen top shaft

// Kitchen / Bedroom 2 wall (X=8.20)
addWall(8.20, 3.12, 8.20, 6.68, 0.12);

// Bathroom 2 walls (Z=1.80, with door at X=8.4–9.2; left wall X=7.85)
addWall(7.85, 0.25, 7.85, 1.80, 0.12);
addWall(7.85, 1.80, 8.40, 1.80, 0.12);
addWall(9.20, 1.80, 10.70, 1.80, 0.12);

// Hallway / Bedroom 2 wall (Z=3.12, with door at X=8.4–9.3)
addWall(8.20, 3.12, 8.40, 3.12, 0.12);
addWall(9.30, 3.12, 10.70, 3.12, 0.12);

// Bedroom 2 & Hallway / Bedroom 3 wall (X=10.70, door at Z=2.0–2.9)
addWall(10.70, 0.25, 10.70, 2.00, 0.12);
addWall(10.70, 2.90, 10.70, 7.58, 0.12);

// Bedroom 3 / Small Balcony glass wall & door (Z=6.15, X=10.75–13.45)
addGlassPartition(10.75, 6.15, 13.45, 6.15, 2.30);

// Balcony Glass Railings (1.05m high)
addGlassPartition(3.05, 9.18, 6.85, 9.18, 1.05, 0.04);   // Big balcony front
addGlassPartition(6.85, 6.68, 6.85, 9.18, 1.05, 0.04);   // Big balcony right
addGlassPartition(10.75, 7.52, 13.45, 7.52, 1.05, 0.04); // Small balcony front

// ============================================================
// 7. FURNITURE & INTERIOR DETAILS (Every Room!)
// ============================================================
function addPlant(x, z, scale = 1.0) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.14 * scale, 0.34 * scale, 16), M.pot);
  pot.position.y = 0.17 * scale;
  pot.castShadow = true;
  g.add(pot);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * scale, 0.035 * scale, 0.7 * scale, 8), M.woodDark);
  trunk.position.y = 0.55 * scale;
  g.add(trunk);

  const foliagePositions = [
    [0, 0.95, 0, 0.26],
    [0.14, 0.85, 0.1, 0.19],
    [-0.14, 0.88, -0.08, 0.2],
    [0.05, 1.12, -0.06, 0.18]
  ];
  foliagePositions.forEach(([fx, fy, fz, r]) => {
    const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(r * scale, 1), M.plant);
    leaf.position.set(fx * scale, fy * scale, fz * scale);
    leaf.castShadow = true;
    g.add(leaf);
  });
  g.position.set(x, 0, z);
  g.userData.category = 'plant';
  aptGroup.add(g);
}

function addLamp(x, y, z, scale = 1) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * scale, 0.09 * scale, 0.24 * scale, 12), M.metal);
  base.position.set(x, y + 0.12 * scale, z);
  g.add(base);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.10 * scale, 0.15 * scale, 0.18 * scale, 16), M.lampGlow);
  shade.position.set(x, y + 0.28 * scale, z);
  g.add(shade);
  g.userData.category = 'lamp';
  aptGroup.add(g);
}

function addBed(x, z, w, l, rotY = 0) {
  const g = new THREE.Group();
  g.userData.category = 'bed';
  // Platform frame
  addBox(w, 0.24, l, 0, 0.14, 0, M.wood, g);
  // Mattress
  addBox(w - 0.12, 0.24, l - 0.14, 0, 0.36, 0.03, M.bedLinen, g);
  // Throw blanket
  addBox(w - 0.08, 0.06, l * 0.42, 0, 0.47, l * 0.22, M.bedThrow, g);
  // Headboard
  addBox(w + 0.22, 1.05, 0.10, 0, 0.55, -l / 2 + 0.02, M.wood, g);
  // Pillows
  const pw = w > 1.3 ? (w - 0.4) / 2 : w - 0.35;
  if (w > 1.3) {
    addBox(pw, 0.14, 0.42, -pw / 2 - 0.06, 0.52, -l / 2 + 0.34, M.bedLinen, g);
    addBox(pw, 0.14, 0.42, pw / 2 + 0.06, 0.52, -l / 2 + 0.34, M.bedLinen, g);
    addBox(pw * 0.7, 0.13, 0.22, -pw / 2 - 0.06, 0.54, -l / 2 + 0.58, M.cushion, g);
    addBox(pw * 0.7, 0.13, 0.22, pw / 2 + 0.06, 0.54, -l / 2 + 0.58, M.cushion, g);
  } else {
    addBox(pw, 0.14, 0.42, 0, 0.52, -l / 2 + 0.34, M.bedLinen, g);
    addBox(pw * 0.6, 0.13, 0.22, 0, 0.54, -l / 2 + 0.58, M.cushion, g);
  }
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  aptGroup.add(g);
}

// --- A. LIVING ROOM + DINING + ENTRY (31.17 m²) ---
// Entry wardrobe (top-left of entry)
addBox(1.55, 2.35, 0.58, 3.85, 1.175, 0.60, M.kitchenUpper);
// Entry bench
addBox(0.85, 0.44, 0.40, 4.95, 0.22, 0.52, M.wood);

// Slatted TV Feature Wall on left partition (clear of Master Bedroom door at Z=2.20–3.10)
const tvWallG = new THREE.Group();
tvWallG.userData.category = 'tv_wall';
for (let i = 0; i < 15; i++) {
  addBox(0.03, 2.25, 0.06, 3.09, 1.15, 3.30 + i * 0.14, M.wood, tvWallG);
}
// Floating TV Console + TV
addBox(0.38, 0.32, 2.10, 3.26, 0.38, 4.28, M.kitchenUpper, tvWallG);
addBox(0.05, 0.85, 1.50, 3.13, 1.25, 4.28, M.tvScreen, tvWallG);
aptGroup.add(tvWallG);

// Living Area Rug
addBox(2.35, 0.02, 2.85, 4.65, 0.01, 3.75, M.rug, aptGroup, false, true);

// Modular Sofa facing TV (left)
const sofaG = new THREE.Group();
sofaG.userData.category = 'sofa';
addBox(0.95, 0.34, 2.55, 0, 0.19, 0, M.sofa, sofaG);          // Seat base
addBox(0.22, 0.72, 2.55, 0.38, 0.38, 0, M.sofa, sofaG);       // Backrest
addBox(0.95, 0.56, 0.20, 0, 0.30, -1.20, M.sofa, sofaG);      // Left arm
addBox(0.95, 0.56, 0.20, 0, 0.30, 1.20, M.sofa, sofaG);       // Right arm
// Chaise extension
addBox(0.65, 0.34, 0.85, -0.78, 0.19, 0.85, M.sofa, sofaG);
// Cushions
addBox(0.16, 0.34, 0.44, 0.20, 0.50, -0.72, M.cushion, sofaG);
addBox(0.16, 0.34, 0.44, 0.20, 0.50, 0.0, M.cushion, sofaG);
addBox(0.16, 0.34, 0.44, 0.20, 0.50, 0.72, M.cushion, sofaG);
sofaG.position.set(5.35, 0, 3.75);
aptGroup.add(sofaG);

// Round Travertine Coffee Table
const coffeeTop = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.06, 28), M.countertop);
coffeeTop.position.set(4.25, 0.36, 3.60);
coffeeTop.castShadow = true;
aptGroup.add(coffeeTop);
const coffeeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.33, 20), M.wood);
coffeeBase.position.set(4.25, 0.17, 3.60);
aptGroup.add(coffeeBase);

// Dining Table + 6 Chairs (near Big Balcony glass doors)
addBox(1.85, 0.06, 0.92, 4.65, 0.75, 5.75, M.wood);
addBox(0.08, 0.74, 0.72, 3.92, 0.37, 5.75, M.woodDark);
addBox(0.08, 0.74, 0.72, 5.38, 0.37, 5.75, M.woodDark);
[-0.56, 0, 0.56].forEach(dx => {
  // Top side chairs
  addBox(0.42, 0.05, 0.42, 4.65 + dx, 0.45, 5.12, M.sofa);
  addBox(0.42, 0.40, 0.06, 4.65 + dx, 0.65, 4.92, M.wood);
  addBox(0.38, 0.44, 0.38, 4.65 + dx, 0.22, 5.12, M.metal);
  // Bottom side chairs
  addBox(0.42, 0.05, 0.42, 4.65 + dx, 0.45, 6.28, M.sofa);
  addBox(0.42, 0.40, 0.06, 4.65 + dx, 0.65, 6.46, M.wood);
  addBox(0.38, 0.44, 0.38, 4.65 + dx, 0.22, 6.28, M.metal);
});
addPlant(3.38, 6.18, 1.15);

// --- B. KITCHEN (Right side of Living, X=6.6–8.1, Z=3.45–6.5) ---
// Lower run along X=7.80
addBox(0.62, 0.86, 2.95, 7.82, 0.43, 5.05, M.kitchenLower);
// Stone countertop
addBox(0.66, 0.05, 2.98, 7.80, 0.885, 5.05, M.countertop);
// Tall fridge / oven column at top of kitchen
addBox(0.64, 2.25, 0.68, 7.81, 1.125, 3.85, M.kitchenUpper);
// Upper cabinets
addBox(0.38, 0.82, 2.25, 7.93, 1.85, 5.35, M.kitchenUpper);
// Return lower peninsula at bottom (Z=6.28)
addBox(0.95, 0.86, 0.60, 7.05, 0.43, 6.24, M.kitchenLower);
addBox(0.98, 0.05, 0.64, 7.05, 0.885, 6.24, M.countertop);
// Sink & Cooktop
addBox(0.42, 0.02, 0.56, 7.78, 0.915, 4.75, M.metal);
addBox(0.46, 0.02, 0.62, 7.78, 0.915, 5.75, M.tvScreen);

// --- C. MASTER BEDROOM (Left, 22.72 m²) ---
// Rug
addBox(2.2, 0.02, 2.6, 1.55, 0.01, 4.85, M.rug, aptGroup, false, true);
// Double bed against left wall (facing right, rotY = Math.PI/2)
addBed(1.38, 4.85, 1.85, 2.10, Math.PI / 2);
// Nightstands + Lamps
addBox(0.44, 0.46, 0.46, 0.54, 0.23, 3.60, M.wood);
addLamp(0.54, 0.46, 3.60, 0.95);
addBox(0.44, 0.46, 0.46, 0.54, 0.23, 6.10, M.wood);
addLamp(0.54, 0.46, 6.10, 0.95);
// Built-in Wardrobe along top-left wall (below Bath 1)
addBox(0.60, 2.35, 1.45, 0.62, 1.175, 2.88, M.kitchenUpper);
// Bottom alcove: Walk-in Wardrobe + Cozy Reading Chair + Plant
addBox(0.60, 2.35, 2.15, 0.62, 1.175, 7.95, M.kitchenUpper);
// Reading armchair
addBox(0.75, 0.38, 0.75, 2.05, 0.22, 8.35, M.sofa);
addBox(0.75, 0.68, 0.18, 2.05, 0.48, 8.65, M.sofa);
addPlant(2.55, 8.75, 1.0);

// --- D. BATHROOM 1 (Top-Left, 4.52 m²) ---
// Floating oak vanity + ceramic sink (left wall)
addBox(0.52, 0.45, 1.05, 0.58, 0.65, 1.25, M.wood);
addBox(0.54, 0.05, 1.08, 0.58, 0.89, 1.25, M.countertop);
const sink1 = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.16, 0.12, 20), M.ceramic);
sink1.position.set(0.60, 0.96, 1.25);
aptGroup.add(sink1);
// Wall-hung toilet (top wall)
addBox(0.40, 0.42, 0.58, 1.42, 0.25, 0.62, M.ceramic);
// Walk-in shower (right side of Bath 1)
addBox(0.95, 0.06, 1.65, 2.42, 0.03, 1.15, M.countertop);
addGlassPartition(1.95, 0.35, 1.95, 1.45, 2.15, 0.03);

// --- E. BATHROOM 2 (Top-Right-Center, 4.15 m²) ---
// Vanity + sink (left/top)
addBox(0.95, 0.45, 0.50, 8.42, 0.65, 0.58, M.wood);
addBox(0.98, 0.05, 0.52, 8.42, 0.89, 0.58, M.countertop);
const sink2 = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.15, 0.12, 20), M.ceramic);
sink2.position.set(8.42, 0.96, 0.60);
aptGroup.add(sink2);
// Toilet
addBox(0.40, 0.42, 0.56, 9.25, 0.25, 0.60, M.ceramic);
// Shower / Tub (right side)
addBox(0.95, 0.42, 1.38, 10.12, 0.21, 1.02, M.ceramic);
addGlassPartition(9.64, 0.32, 9.64, 1.20, 2.10, 0.03);

// --- F. BEDROOM 2 / OFFICE (Middle-Right, 10.63 m²) ---
addBox(1.80, 0.02, 2.30, 9.45, 0.01, 5.10, M.rug, aptGroup, false, true);
// Single / Daybed along right wall (where wardrobe was, headboard at top wall, feet toward window)
addBed(10.07, 4.22, 1.05, 2.00, 0);
// Wardrobe flush against right wall right past the foot of the bed
addBox(0.55, 2.25, 1.35, 10.36, 1.125, 5.98, M.kitchenUpper);
// Desk by the bottom window (Z=7.05)
addBox(1.45, 0.05, 0.62, 9.25, 0.74, 7.05, M.wood);
addBox(0.06, 0.72, 0.56, 8.58, 0.36, 7.05, M.metal);
addBox(0.06, 0.72, 0.56, 9.92, 0.36, 7.05, M.metal);
// Desk chair
addBox(0.46, 0.06, 0.46, 9.25, 0.46, 6.48, M.sofa);
addBox(0.46, 0.42, 0.06, 9.25, 0.68, 6.26, M.sofa);
addBox(0.06, 0.44, 0.06, 9.25, 0.22, 6.48, M.metal);
addLamp(9.78, 0.765, 7.05, 0.8);

// --- G. BEDROOM 3 (Far-Right, 14.85 m²) ---
addBox(2.15, 0.02, 2.55, 12.10, 0.01, 3.95, M.rug, aptGroup, false, true);
// Double bed against right wall (facing left, rotY = -Math.PI/2)
addBed(12.30, 4.05, 1.65, 2.05, -Math.PI / 2);
// Nightstands + Lamps
addBox(0.44, 0.46, 0.44, 13.15, 0.23, 2.95, M.wood);
addLamp(13.15, 0.46, 2.95, 0.9);
addBox(0.44, 0.46, 0.44, 13.15, 0.23, 5.15, M.wood);
addLamp(13.15, 0.46, 5.15, 0.9);
// Built-in Wardrobe along top wall (Z=1.05)
addBox(2.25, 2.35, 0.60, 12.10, 1.175, 1.02, M.kitchenUpper);
addPlant(11.15, 5.65, 1.0);

// --- H. BIG BALCONY (10.03 m²) ---
// Outdoor lounge sofa + 2 armchairs + coffee table + planters
addBox(1.75, 0.36, 0.78, 4.95, 0.20, 8.45, M.sofa);
addBox(1.75, 0.66, 0.14, 4.95, 0.42, 8.78, M.wood);
addBox(0.85, 0.32, 0.55, 4.95, 0.16, 7.55, M.wood);
addBox(0.70, 0.36, 0.70, 6.20, 0.20, 7.75, M.sofa);
addPlant(3.55, 8.65, 1.25);
addPlant(6.40, 8.68, 0.95);

// --- I. SMALL BALCONY (3.12 m²) ---
const bistroTable = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 20), M.wood);
bistroTable.position.set(12.15, 0.70, 6.95);
aptGroup.add(bistroTable);
const bistroLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.70, 10), M.metal);
bistroLeg.position.set(12.15, 0.35, 6.95);
aptGroup.add(bistroLeg);
addBox(0.44, 0.42, 0.44, 11.45, 0.24, 6.95, M.wood);
addBox(0.44, 0.42, 0.44, 12.85, 0.24, 6.95, M.wood);
addPlant(13.05, 6.50, 0.85);

// ============================================================
// 8. ROOM LABELS (3D -> 2D Projected)
// ============================================================
const ROOMS = [
  { name: 'Гостиная + Кухня', area: '31.17 м²', pos: new THREE.Vector3(5.3, 1.2, 4.3) },
  { name: 'Мастер-спальня', area: '22.72 м²', pos: new THREE.Vector3(1.6, 1.2, 4.9) },
  { name: 'Спальня 3', area: '14.85 м²', pos: new THREE.Vector3(12.1, 1.2, 3.6) },
  { name: 'Спальня 2', area: '10.63 м²', pos: new THREE.Vector3(9.45, 1.2, 5.4) },
  { name: 'Большой балкон', area: '10.03 м²', pos: new THREE.Vector3(4.95, 0.9, 8.0) },
  { name: 'Санузел 1', area: '4.52 м²', pos: new THREE.Vector3(1.6, 1.2, 1.15) },
  { name: 'Санузел 2', area: '4.15 м²', pos: new THREE.Vector3(9.2, 1.2, 1.0) },
  { name: 'Балкон 2', area: '3.12 м²', pos: new THREE.Vector3(12.1, 0.9, 6.9) }
];

const labelsLayer = document.getElementById('labels-layer');
let showLabels = true;
let labelEls = [];

function setRoomLabels(roomList) {
  labelsLayer.innerHTML = '';
  labelEls = roomList.map(r => {
    const el = document.createElement('div');
    el.className = 'room-label';
    el.innerHTML = `${r.name}<small>${r.area}</small>`;
    labelsLayer.appendChild(el);
    return { el, pos: r.pos };
  });
}
setRoomLabels(ROOMS);

function updateLabels() {
  if (!showLabels) {
    labelsLayer.style.display = 'none';
    return;
  }
  labelsLayer.style.display = 'block';
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (const item of labelEls) {
    const v = item.pos.clone().project(camera);
    if (v.z > 1) {
      item.el.style.display = 'none';
    } else {
      item.el.style.display = 'block';
      item.el.style.left = `${(v.x * 0.5 + 0.5) * w}px`;
      item.el.style.top = `${(-v.y * 0.5 + 0.5) * h}px`;
    }
  }
}

// ============================================================
// 9. APPLY VARIANT & WALLS / LIGHTING CONTROLS
// ============================================================
let currentVariantKey = 'light';
let isNight = false;

function applyVariant(key) {
  const v = VARIANTS[key];
  if (!v) return;
  currentVariantKey = key;

  scene.background = new THREE.Color(isNight ? v.bgNight : v.bgDay);
  M.wall.color.setHex(v.wall);
  M.wallOuter.color.setHex(v.wallOuter);
  M.wood.color.setHex(v.wood);
  M.woodDark.color.setHex(v.woodDark);
  M.sofa.color.setHex(v.sofa);
  M.cushion.color.setHex(v.cushion);
  M.bedLinen.color.setHex(v.bedLinen);
  M.bedThrow.color.setHex(v.bedThrow);
  M.rug.color.setHex(v.rug);
  M.kitchenLower.color.setHex(v.kitchenLower);
  M.kitchenUpper.color.setHex(v.kitchenUpper);
  M.countertop.color.setHex(v.countertop);
  M.metal.color.setHex(v.metal);
  M.plant.color.setHex(v.plant);

  // Style-specific finish roughness / glossiness
  const isHighTech = key === 'hightech';
  const isLuxury = key === 'neoclassic';
  M.kitchenUpper.roughness = isHighTech ? 0.14 : 0.5;
  M.kitchenLower.roughness = isHighTech ? 0.25 : 0.55;
  M.floorTile.roughness = (isHighTech || isLuxury) ? 0.16 : 0.42;
  M.metal.metalness = (isLuxury || isHighTech) ? 0.85 : 0.65;
  M.metal.roughness = (isLuxury || isHighTech) ? 0.22 : 0.35;

  if (M.floorWood.map) M.floorWood.map.dispose();
  if (M.floorTile.map) M.floorTile.map.dispose();
  if (M.floorDeck.map) M.floorDeck.map.dispose();

  M.floorWood.map = createWoodFloorTexture(v.floorBase, v.floorLine);
  M.floorTile.map = createTileTexture(v.tileBase, v.tileLine);
  M.floorDeck.map = createDeckTexture(v.deckBase, v.deckLine);
  M.floorWood.needsUpdate = true;
  M.floorTile.needsUpdate = true;
  M.floorDeck.needsUpdate = true;

  // Update spec card
  const specBox = document.getElementById('variant-spec');
  specBox.innerHTML = `<ul>${v.specs.map(s => `<li>${s}</li>`).join('')}</ul>`;

  // Update active button
  document.querySelectorAll('.variant-card').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.variant === key);
  });
}

let customWallMeshes = [];
function applyWallHeight() {
  const factor = isCutaway ? (CUTAWAY_WALL_H / FULL_WALL_H) : 1.0;
  for (const w of [...wallMeshes, ...customWallMeshes]) {
    const targetH = Math.min(w.userData.baseHeight, FULL_WALL_H * factor);
    const scaleY = targetH / w.userData.baseHeight;
    w.scale.y = scaleY;
    w.position.y = targetH / 2;
  }
  document.getElementById('walls-label').textContent = isCutaway ? 'Срез стен' : 'Полные стены';
}

function applyLighting() {
  const v = VARIANTS[currentVariantKey];
  scene.background = new THREE.Color(isNight ? v.bgNight : v.bgDay);
  if (isNight) {
    sunLight.intensity = 0.22;
    sunLight.color.setHex(0x8fa8d6);
    hemiLight.intensity = 0.28;
    fillLight.intensity = 0.12;
    interiorLights.forEach(l => (l.intensity = 2.6));
    M.lampGlow.emissiveIntensity = 1.8;
    document.getElementById('lighting-icon').textContent = '🌙';
    document.getElementById('lighting-label').textContent = 'Вечер';
  } else {
    sunLight.intensity = 1.35;
    sunLight.color.setHex(0xfff5e4);
    hemiLight.intensity = 0.9;
    fillLight.intensity = 0.35;
    interiorLights.forEach(l => (l.intensity = 0.35));
    M.lampGlow.emissiveIntensity = 0.55;
    document.getElementById('lighting-icon').textContent = '☀️';
    document.getElementById('lighting-label').textContent = 'День';
  }
}

// ============================================================
// 10. SMOOTH CAMERA PRESETS
// ============================================================
const CAM_PRESETS = {
  iso: { pos: [14.5, 13.5, 16.5], target: [6.8, 0.5, 4.7] },
  top: { pos: [6.85, 19.5, 5.2], target: [6.85, 0, 4.8] },
  living: { pos: [5.4, 5.2, 9.8], target: [5.6, 0.7, 4.2] },
  master: { pos: [5.2, 5.8, 9.2], target: [1.5, 0.6, 5.2] },
  bed2: { pos: [9.5, 5.5, 10.5], target: [9.45, 0.6, 5.3] },
  bed3: { pos: [15.5, 6.0, 8.2], target: [12.1, 0.7, 3.8] },
  balcony: { pos: [7.6, 4.2, 12.2], target: [4.9, 0.5, 7.8] }
};

let camAnim = null;
function flyTo(presetKey) {
  const p = CAM_PRESETS[presetKey];
  if (!p) return;
  camAnim = {
    startPos: camera.position.clone(),
    endPos: new THREE.Vector3(...p.pos),
    startTarget: controls.target.clone(),
    endTarget: new THREE.Vector3(...p.target),
    t: 0
  };
  document.querySelectorAll('.cam-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cam === presetKey);
  });
}

// ============================================================
// 11. UI EVENT LISTENERS
// ============================================================
document.getElementById('variant-list').addEventListener('click', e => {
  const card = e.target.closest('.variant-card');
  if (card) applyVariant(card.dataset.variant);
});

document.getElementById('camera-bar').addEventListener('click', e => {
  const btn = e.target.closest('.cam-btn');
  if (btn) flyTo(btn.dataset.cam);
});

document.getElementById('btn-lighting').addEventListener('click', () => {
  isNight = !isNight;
  applyLighting();
});

document.getElementById('btn-walls').addEventListener('click', () => {
  isCutaway = !isCutaway;
  applyWallHeight();
});

document.getElementById('btn-labels').addEventListener('click', e => {
  showLabels = !showLabels;
  e.currentTarget.classList.toggle('active', showLabels);
});

// Renders Modal & Lightbox
const modal = document.getElementById('renders-modal');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

document.getElementById('btn-renders').addEventListener('click', () => {
  modal.classList.remove('hidden');
});
document.getElementById('modal-close').addEventListener('click', () => {
  modal.classList.add('hidden');
});
modal.querySelector('.modal-backdrop').addEventListener('click', () => {
  modal.classList.add('hidden');
});

document.getElementById('gallery-grid').addEventListener('click', e => {
  const applyBtn = e.target.closest('.btn-apply');
  if (applyBtn) {
    applyVariant(applyBtn.dataset.apply);
    modal.classList.add('hidden');
    return;
  }
  const img = e.target.closest('.render-card')?.querySelector('img');
  if (img) {
    lightboxImg.src = img.src;
    lightbox.classList.remove('hidden');
  }
});
document.getElementById('lightbox-close').addEventListener('click', () => {
  lightbox.classList.add('hidden');
});
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) lightbox.classList.add('hidden');
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
// 12. CUSTOM FLOOR PLAN UPLOAD -> DYNAMIC 3D BUILDER
// ============================================================
let customAptGroup = null;
let customBlueprintMesh = null;
let isCustomMode = false;
let selectedFile = null;
let lastUploadedPayload = null;

function imageToResizedBase64(img, maxSide = 1400) {
  const scale = Math.min(maxSide / img.width, maxSide / img.height, 1);
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL('image/jpeg', 0.88);
  return {
    dataUrl,
    mimeType: 'image/jpeg',
    imageBase64: dataUrl.split(',')[1]
  };
}

function addCustomGlass(x1, z1, x2, z2, height, parent) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  if (len < 0.2) return;
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const glass = new THREE.Mesh(new THREE.BoxGeometry(len, height, 0.04), M.glass);
  glass.position.set(cx, height / 2, cz);
  glass.rotation.y = -Math.atan2(dz, dx);
  parent.add(glass);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.06), M.metal);
  frame.position.set(cx, 0.025, cz);
  frame.rotation.y = -Math.atan2(dz, dx);
  parent.add(frame);
}

function renderAiFurnitureItem(item, parent) {
  const x = Number(item.x) || 0;
  const z = Number(item.z) || 0;
  const w = Math.max(0.3, Number(item.w) || 1.0);
  const d = Math.max(0.3, Number(item.d) || 0.8);
  const rot = ((Number(item.rot) || 0) * Math.PI) / 180;
  const g = new THREE.Group();

  switch (item.type) {
    case 'sofa': {
      addBox(w, 0.34, d, 0, 0.18, 0, M.sofa, g);
      addBox(w, 0.68, Math.min(0.22, d * 0.25), 0, 0.36, -d / 2 + 0.10, M.sofa, g);
      addBox(0.18, 0.52, d, -w / 2 + 0.09, 0.28, 0, M.sofa, g);
      addBox(0.18, 0.52, d, w / 2 - 0.09, 0.28, 0, M.sofa, g);
      addBox(w * 0.26, 0.28, 0.14, -w * 0.24, 0.48, -d / 2 + 0.26, M.cushion, g);
      addBox(w * 0.26, 0.28, 0.14, w * 0.24, 0.48, -d / 2 + 0.26, M.cushion, g);
      break;
    }
    case 'bed': {
      addCustomBed(0, 0, w, d, 0, g);
      break;
    }
    case 'dining_table': {
      addBox(w, 0.06, d, 0, 0.74, 0, M.wood, g);
      addBox(0.08, 0.72, d * 0.72, -w * 0.36, 0.36, 0, M.woodDark, g);
      addBox(0.08, 0.72, d * 0.72, w * 0.36, 0.36, 0, M.woodDark, g);
      [-w * 0.28, w * 0.28].forEach(dx => {
        addBox(0.40, 0.42, 0.40, dx, 0.22, -d / 2 - 0.24, M.sofa, g);
        addBox(0.40, 0.42, 0.40, dx, 0.22, d / 2 + 0.24, M.sofa, g);
      });
      break;
    }
    case 'kitchen_counter': {
      addBox(w, 0.86, d, 0, 0.43, 0, M.kitchenLower, g);
      addBox(w + 0.03, 0.05, d + 0.03, 0, 0.885, 0, M.countertop, g);
      addBox(w * 0.92, 0.76, d * 0.55, 0, 1.80, -d * 0.2, M.kitchenUpper, g);
      break;
    }
    case 'tv_unit': {
      addBox(w, 0.34, d, 0, 0.34, 0, M.kitchenUpper, g);
      addBox(w * 0.72, 0.80, 0.05, 0, 1.18, -d * 0.3, M.tvScreen, g);
      break;
    }
    case 'wardrobe': {
      addBox(w, 2.28, d, 0, 1.14, 0, M.kitchenUpper, g);
      break;
    }
    case 'desk': {
      addBox(w, 0.05, d, 0, 0.74, 0, M.wood, g);
      addBox(0.06, 0.72, d * 0.85, -w / 2 + 0.06, 0.36, 0, M.metal, g);
      addBox(0.06, 0.72, d * 0.85, w / 2 - 0.06, 0.36, 0, M.metal, g);
      break;
    }
    case 'coffee_table': {
      const r = Math.min(w, d) / 2;
      const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.06, 24), M.countertop);
      top.position.y = 0.36;
      top.castShadow = true;
      g.add(top);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.52, 0.33, 18), M.wood);
      base.position.y = 0.17;
      g.add(base);
      break;
    }
    case 'vanity': {
      addBox(w, 0.44, d, 0, 0.64, 0, M.wood, g);
      addBox(w + 0.02, 0.05, d + 0.02, 0, 0.88, 0, M.countertop, g);
      const sink = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.11, 18), M.ceramic);
      sink.position.y = 0.94;
      g.add(sink);
      break;
    }
    case 'toilet': {
      addBox(0.40, 0.42, 0.56, 0, 0.24, 0, M.ceramic, g);
      break;
    }
    case 'shower': {
      addBox(w, 0.06, d, 0, 0.03, 0, M.countertop, g);
      const shGlass = new THREE.Mesh(new THREE.BoxGeometry(w, 2.05, 0.03), M.glass);
      shGlass.position.set(0, 1.05, d / 2);
      g.add(shGlass);
      break;
    }
    case 'plant': {
      addCustomPlant(0, 0, 1.0, g);
      break;
    }
    default: {
      addBox(w, 0.5, d, 0, 0.25, 0, M.wood, g);
    }
  }

  g.position.set(x, 0, z);
  g.rotation.y = rot;
  parent.add(g);
}

function disposeGroup(group) {
  if (!group) return;
  group.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material && obj.userData.disposeMat) {
      if (obj.material.map) obj.material.map.dispose();
      obj.material.dispose();
    }
  });
  scene.remove(group);
}

function addCustomPlant(x, z, scale, parent) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.12 * scale, 0.30 * scale, 14), M.pot);
  pot.position.y = 0.15 * scale;
  pot.castShadow = true;
  g.add(pot);
  const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24 * scale, 1), M.plant);
  leaf.position.y = 0.56 * scale;
  leaf.castShadow = true;
  g.add(leaf);
  g.position.set(x, 0, z);
  g.userData.category = 'plant';
  parent.add(g);
}

function addCustomBed(x, z, w, l, rotY, parent) {
  const g = new THREE.Group();
  g.userData.category = 'bed';
  addBox(w, 0.24, l, 0, 0.14, 0, M.wood, g);
  addBox(w - 0.10, 0.22, l - 0.12, 0, 0.35, 0.02, M.bedLinen, g);
  addBox(w - 0.06, 0.06, l * 0.4, 0, 0.45, l * 0.22, M.bedThrow, g);
  addBox(w + 0.18, 0.95, 0.09, 0, 0.50, -l / 2 + 0.02, M.wood, g);
  addBox(w * 0.72, 0.13, 0.36, 0, 0.50, -l / 2 + 0.30, M.cushion, g);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
}

function addCustomWallSeg(x1, z1, x2, z2, thickness, isOuter, parent, heightScale = 1.0) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  if (len < 0.14) return;
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const h = FULL_WALL_H * heightScale;
  const geo = new THREE.BoxGeometry(len, h, thickness);
  const mesh = new THREE.Mesh(geo, isOuter ? M.wallOuter : M.wall);
  mesh.position.set(cx, h / 2, cz);
  mesh.rotation.y = -Math.atan2(dz, dx);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.baseHeight = h;
  parent.add(mesh);
  customWallMeshes.push(mesh);
}

/**
 * Cuts door & window openings out of a straight horizontal or vertical wall segment
 */
function buildWallWithOpenings(axis, fixedCoord, start, end, thickness, isOuter, doors, windows, parent) {
  const cuts = [];
  const tol = 0.45;

  for (const d of doors) {
    const dAxis = d.axis || 'x';
    if (dAxis !== axis) continue;
    const dFixed = axis === 'x' ? d.z : d.x;
    const dCenter = axis === 'x' ? d.x : d.z;
    const halfW = Math.min(1.2, Math.max(0.4, (Number(d.width) || 0.9) / 2));
    if (Math.abs(dFixed - fixedCoord) < tol && dCenter + halfW > start && dCenter - halfW < end) {
      cuts.push({ a: Math.max(start, dCenter - halfW), b: Math.min(end, dCenter + halfW), kind: 'door' });
    }
  }
  for (const win of windows) {
    const wAxis = win.axis || 'x';
    if (wAxis !== axis) continue;
    const wFixed = axis === 'x' ? win.z : win.x;
    const wCenter = axis === 'x' ? win.x : win.z;
    const halfW = Math.min(2.2, Math.max(0.45, (Number(win.width) || 1.4) / 2));
    if (Math.abs(wFixed - fixedCoord) < tol && wCenter + halfW > start && wCenter - halfW < end) {
      cuts.push({ a: Math.max(start, wCenter - halfW), b: Math.min(end, wCenter + halfW), kind: 'window' });
    }
  }

  cuts.sort((u, v) => u.a - v.a);
  let cursor = start;
  for (const c of cuts) {
    if (c.a > cursor + 0.12) {
      if (axis === 'x') addCustomWallSeg(cursor, fixedCoord, c.a, fixedCoord, thickness, isOuter, parent);
      else addCustomWallSeg(fixedCoord, cursor, fixedCoord, c.a, thickness, isOuter, parent);
    }
    if (c.kind === 'window' && c.b > c.a + 0.2) {
      if (axis === 'x') {
        addCustomWallSeg(c.a, fixedCoord, c.b, fixedCoord, thickness * 0.85, isOuter, parent, 0.28);
        addCustomGlass(c.a, fixedCoord, c.b, fixedCoord, 2.25, parent);
      } else {
        addCustomWallSeg(fixedCoord, c.a, fixedCoord, c.b, thickness * 0.85, isOuter, parent, 0.28);
        addCustomGlass(fixedCoord, c.a, fixedCoord, c.b, 2.25, parent);
      }
    }
    cursor = Math.max(cursor, c.b);
  }
  if (end > cursor + 0.12) {
    if (axis === 'x') addCustomWallSeg(cursor, fixedCoord, end, fixedCoord, thickness, isOuter, parent);
    else addCustomWallSeg(fixedCoord, cursor, fixedCoord, end, thickness, isOuter, parent);
  }
}

function furnishCustomRoom(r, hasSeparateKitchen, parent) {
  const x1 = r.x;
  const z1 = r.z;
  const rw = r.w;
  const rd = r.d;
  const cx = x1 + rw / 2;
  const cz = z1 + rd / 2;

  if (r.type === 'bathroom') {
    // Vanity + vessel sink + toilet + walk-in glass shower
    const vanW = Math.min(1.0, rw * 0.44);
    addBox(vanW, 0.44, 0.48, x1 + vanW / 2 + 0.18, 0.64, z1 + 0.34, M.wood, parent);
    addBox(vanW + 0.04, 0.05, 0.50, x1 + vanW / 2 + 0.18, 0.88, z1 + 0.34, M.countertop, parent);
    const sink = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.11, 18), M.ceramic);
    sink.position.set(x1 + vanW / 2 + 0.18, 0.94, z1 + 0.34);
    parent.add(sink);

    // Wall-hung toilet
    addBox(0.40, 0.42, 0.56, cx, 0.24, z1 + 0.40, M.ceramic, parent);

    // Walk-in glass shower on right side if room wide enough
    if (rw >= 1.9) {
      const shW = Math.min(0.95, rw * 0.34);
      const shD = Math.min(1.45, rd * 0.72);
      addBox(shW, 0.06, shD, x1 + rw - shW / 2 - 0.12, 0.03, z1 + shD / 2 + 0.14, M.countertop, parent);
      addCustomGlass(x1 + rw - shW - 0.12, z1 + 0.14, x1 + rw - shW - 0.12, z1 + shD * 0.82, 2.1, parent);
    }
    return;
  }

  if (r.type === 'balcony') {
    if (rw * rd >= 6.0) {
      // Outdoor lounge sofa + low table + 2 potted trees
      const sLen = Math.min(1.85, rw * 0.52);
      addBox(sLen, 0.34, 0.76, cx, 0.18, z1 + rd - 0.56, M.sofa, parent);
      addBox(sLen, 0.62, 0.14, cx, 0.40, z1 + rd - 0.22, M.wood, parent);
      addBox(Math.min(0.85, rw * 0.25), 0.30, 0.50, cx, 0.16, cz - 0.15, M.wood, parent);
      addCustomPlant(x1 + 0.42, z1 + rd - 0.42, 1.15, parent);
      addCustomPlant(x1 + rw - 0.42, z1 + rd - 0.42, 0.95, parent);
    } else {
      // Bistro table + 2 chairs + plant
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.04, 18), M.wood);
      t.position.set(cx, 0.70, cz);
      parent.add(t);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.70, 8), M.metal);
      leg.position.set(cx, 0.35, cz);
      parent.add(leg);
      if (rw > 1.5) {
        addBox(0.42, 0.42, 0.42, cx - 0.60, 0.22, cz, M.wood, parent);
        addBox(0.42, 0.42, 0.42, cx + 0.60, 0.22, cz, M.wood, parent);
      }
      addCustomPlant(x1 + rw - 0.35, z1 + 0.38, 0.85, parent);
    }
    return;
  }

  if (r.type === 'kitchen') {
    const runLen = Math.min(2.8, rd - 0.6);
    addBox(0.62, 0.86, runLen, x1 + rw - 0.42, 0.43, cz, M.kitchenLower, parent);
    addBox(0.66, 0.05, runLen + 0.04, x1 + rw - 0.42, 0.885, cz, M.countertop, parent);
    addBox(0.38, 0.80, runLen * 0.82, x1 + rw - 0.28, 1.82, cz, M.kitchenUpper, parent);
    addBox(0.42, 0.02, 0.52, x1 + rw - 0.44, 0.915, cz - runLen * 0.22, M.metal, parent);
    addBox(0.44, 0.02, 0.58, x1 + rw - 0.44, 0.915, cz + runLen * 0.22, M.tvScreen, parent);
    return;
  }

  if (r.type === 'living') {
    const includeKitchen = r.hasKitchen || !hasSeparateKitchen;
    const livingW = includeKitchen && rw > 3.6 ? rw - 1.35 : rw;
    const livCx = x1 + livingW / 2;
    const livCz = z1 + Math.min(rd * 0.44, rd - 1.9);

    // Rug
    addBox(Math.min(2.4, livingW * 0.66), 0.02, Math.min(2.6, rd * 0.44), livCx, 0.012, livCz, M.rug, parent, false, true);

    // Slatted TV feature wall + console + TV on left wall
    const slats = 11;
    const tvZ0 = livCz - 0.75;
    for (let i = 0; i < slats; i++) {
      addBox(0.03, 2.15, 0.06, x1 + 0.14, 1.10, tvZ0 + i * 0.15, M.wood, parent);
    }
    addBox(0.36, 0.32, 1.9, x1 + 0.32, 0.36, livCz, M.kitchenUpper, parent);
    addBox(0.05, 0.82, 1.4, x1 + 0.19, 1.22, livCz, M.tvScreen, parent);

    // Modular Sofa facing TV
    const sofaLen = Math.min(2.4, rd * 0.40);
    const sofaX = Math.min(x1 + livingW - 0.62, livCx + 0.72);
    addBox(0.92, 0.34, sofaLen, sofaX, 0.19, livCz, M.sofa, parent);
    addBox(0.20, 0.70, sofaLen, sofaX + 0.36, 0.38, livCz, M.sofa, parent);
    addBox(0.92, 0.54, 0.18, sofaX, 0.29, livCz - sofaLen / 2 + 0.09, M.sofa, parent);
    addBox(0.92, 0.54, 0.18, sofaX, 0.29, livCz + sofaLen / 2 - 0.09, M.sofa, parent);
    addBox(0.15, 0.32, 0.42, sofaX + 0.18, 0.50, livCz - sofaLen * 0.25, M.cushion, parent);
    addBox(0.15, 0.32, 0.42, sofaX + 0.18, 0.50, livCz + sofaLen * 0.25, M.cushion, parent);

    // Round Coffee Table
    const ct = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.06, 24), M.countertop);
    ct.position.set(livCx - 0.12, 0.36, livCz);
    ct.castShadow = true;
    parent.add(ct);
    const ctBase = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.21, 0.33, 18), M.wood);
    ctBase.position.set(livCx - 0.12, 0.17, livCz);
    parent.add(ctBase);

    // Dining Table + 6 Chairs near bottom of living room
    if (rd >= 4.2) {
      const dinZ = z1 + rd - 0.95;
      const tW = Math.min(1.75, livingW * 0.52);
      addBox(tW, 0.06, 0.88, livCx, 0.74, dinZ, M.wood, parent);
      addBox(0.08, 0.72, 0.68, livCx - tW * 0.36, 0.36, dinZ, M.woodDark, parent);
      addBox(0.08, 0.72, 0.68, livCx + tW * 0.36, 0.36, dinZ, M.woodDark, parent);
      [-tW * 0.30, 0, tW * 0.30].forEach(dx => {
        addBox(0.40, 0.44, 0.40, livCx + dx, 0.23, dinZ - 0.58, M.sofa, parent);
        addBox(0.40, 0.44, 0.40, livCx + dx, 0.23, dinZ + 0.58, M.sofa, parent);
      });
    }

    // Open-plan Kitchen run along right wall
    if (includeKitchen) {
      const kLen = Math.min(3.1, rd * 0.56);
      const kCz = z1 + rd - kLen / 2 - 0.35;
      addBox(0.62, 0.86, kLen, x1 + rw - 0.40, 0.43, kCz, M.kitchenLower, parent);
      addBox(0.66, 0.05, kLen + 0.04, x1 + rw - 0.40, 0.885, kCz, M.countertop, parent);
      addBox(0.38, 0.82, kLen * 0.78, x1 + rw - 0.26, 1.84, kCz + 0.15, M.kitchenUpper, parent);
      addBox(0.64, 2.22, 0.66, x1 + rw - 0.40, 1.11, kCz - kLen / 2 + 0.34, M.kitchenUpper, parent);
      addBox(0.42, 0.02, 0.54, x1 + rw - 0.42, 0.915, kCz, M.metal, parent);
      addBox(0.44, 0.02, 0.58, x1 + rw - 0.42, 0.915, kCz + kLen * 0.28, M.tvScreen, parent);
    }

    addCustomPlant(x1 + 0.44, z1 + rd - 0.45, 1.15, parent);
    return;
  }

  if (r.type === 'bedroom') {
    const area = rw * rd;
    const isDouble = area >= 10.5 && Math.min(rw, rd) >= 2.4;
    const bw = isDouble ? Math.min(1.75, Math.min(rw, rd) * 0.62) : Math.min(1.05, Math.min(rw, rd) * 0.52);
    const bl = Math.min(2.05, Math.max(rw, rd) * 0.52);

    // Orient bed cleanly against left/top wall
    const horiz = rw >= rd;
    const rot = horiz ? Math.PI / 2 : 0;
    const bedX = horiz ? x1 + bl / 2 + 0.22 : cx;
    const bedZ = horiz ? cz : z1 + bl / 2 + 0.25;

    // Plush rug
    addBox(Math.min(rw - 0.5, (horiz ? bl : bw) + 0.7), 0.02, Math.min(rd - 0.5, (horiz ? bw : bl) + 0.7), bedX, 0.012, bedZ, M.rug, parent, false, true);
    addCustomBed(bedX, bedZ, bw, bl, rot, parent);

    // Nightstands + glowing lamps
    if (horiz && rd >= bw + 1.0) {
      addBox(0.42, 0.44, 0.42, x1 + 0.38, 0.22, bedZ - bw / 2 - 0.30, M.wood, parent);
      addBox(0.42, 0.44, 0.42, x1 + 0.38, 0.22, bedZ + bw / 2 + 0.30, M.wood, parent);
      const lamp1 = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.14, 0.20, 14), M.lampGlow);
      lamp1.position.set(x1 + 0.38, 0.58, bedZ - bw / 2 - 0.30);
      parent.add(lamp1);
      const lamp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.14, 0.20, 14), M.lampGlow);
      lamp2.position.set(x1 + 0.38, 0.58, bedZ + bw / 2 + 0.30);
      parent.add(lamp2);
    } else if (!horiz && rw >= bw + 0.95) {
      addBox(0.42, 0.44, 0.42, bedX - bw / 2 - 0.28, 0.22, z1 + 0.38, M.wood, parent);
      addBox(0.42, 0.44, 0.42, bedX + bw / 2 + 0.28, 0.22, z1 + 0.38, M.wood, parent);
    }

    // Built-in floor-to-ceiling wardrobe along free wall
    if (rd >= 3.4) {
      addBox(0.58, 2.28, Math.min(1.85, rd * 0.35), x1 + rw - 0.42, 1.14, z1 + 1.15, M.kitchenUpper, parent);
    } else if (rw >= 3.4) {
      addBox(Math.min(1.85, rw * 0.38), 2.28, 0.58, x1 + rw - 1.15, 1.14, z1 + 0.42, M.kitchenUpper, parent);
    }

    addCustomPlant(x1 + rw - 0.42, z1 + rd - 0.42, 0.95, parent);
    return;
  }

  // Hall / Entry
  if (rw >= 1.6 && rd >= 1.4) {
    addBox(Math.min(1.3, rw * 0.55), 2.25, 0.52, cx, 1.125, z1 + 0.38, M.kitchenUpper, parent);
  }
}

function buildCustomApartment(parsed, fileName) {
  disposeGroup(customAptGroup);
  customWallMeshes = [];
  customBlueprintMesh = null;

  customAptGroup = new THREE.Group();
  scene.add(customAptGroup);

  // Normalize rooms safely
  const rooms = (parsed.rooms || [])
    .map(r => ({
      name: r.name || 'Комната',
      type: r.type || 'bedroom',
      x: Number(r.x) || 0,
      z: Number(r.z) || 0,
      w: Math.max(0.8, Number(r.w) || 2.5),
      d: Math.max(0.8, Number(r.d) || 2.5),
      area: Number(r.area) || 0,
      hasKitchen: Boolean(r.hasKitchen)
    }));

  // Compute exact bounding box of all rooms
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
  for (const r of rooms) {
    if (r.x < minX) minX = r.x;
    if (r.z < minZ) minZ = r.z;
    if (r.x + r.w > maxX) maxX = r.x + r.w;
    if (r.z + r.d > maxZ) maxZ = r.z + r.d;
  }
  if (!isFinite(minX)) { minX = 0; minZ = 0; maxX = parsed.width || 12; maxZ = parsed.depth || 9; }
  const W = maxX - minX;
  const D = maxZ - minZ;

  // Shift rooms so top-left is (0, 0)
  for (const r of rooms) {
    r.x -= minX;
    r.z -= minZ;
  }
  const doors = (parsed.doors || []).map(d => ({ ...d, x: (Number(d.x) || 0) - minX, z: (Number(d.z) || 0) - minZ }));
  const windows = (parsed.windows || []).map(w => ({ ...w, x: (Number(w.x) || 0) - minX, z: (Number(w.z) || 0) - minZ }));

  // Semi-transparent blueprint underlay (toggleable)
  if (parsed.blueprintDataUrl) {
    const bpTex = new THREE.TextureLoader().load(parsed.blueprintDataUrl);
    bpTex.colorSpace = THREE.SRGBColorSpace;
    const bpMat = new THREE.MeshBasicMaterial({
      map: bpTex,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    customBlueprintMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, D), bpMat);
    customBlueprintMesh.rotation.x = -Math.PI / 2;
    customBlueprintMesh.position.set(W / 2, 0.02, D / 2);
    customBlueprintMesh.userData.disposeMat = true;
    customBlueprintMesh.visible = false;
    customAptGroup.add(customBlueprintMesh);
  }

  // Helper: find which room owns a sample point (px, pz)
  const roomAt = (px, pz, ignoreIdx = -1) => {
    for (let i = 0; i < rooms.length; i++) {
      if (i === ignoreIdx) continue;
      const r = rooms[i];
      if (px >= r.x - 0.08 && px <= r.x + r.w + 0.08 && pz >= r.z - 0.08 && pz <= r.z + r.d + 0.08) {
        return r;
      }
    }
    return null;
  };

  const hasSeparateKitchen = rooms.some(r => r.type === 'kitchen');
  const dynamicLabels = [];
  const builtEdges = new Set();

  // Build exact room slabs, floors, perimeter/shared walls with doors/windows, AND rich furniture!
  rooms.forEach((r, idx) => {
    const cx = r.x + r.w / 2;
    const cz = r.z + r.d / 2;

    // Exact room base slab (hugs room shape — no giant empty rectangle!)
    addBox(r.w + 0.16, 0.14, r.d + 0.16, cx, -0.11, cz, M.wallOuter, customAptGroup, false, true);

    // Room floor finish
    const floorMat =
      (r.type === 'bathroom' || r.type === 'kitchen') ? M.floorTile :
        (r.type === 'balcony') ? M.floorDeck : M.floorWood;
    const floorY = r.type === 'balcony' ? -0.05 : -0.03;
    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(r.w, 0.06, r.d), floorMat);
    floorMesh.position.set(cx, floorY, cz);
    floorMesh.receiveShadow = true;
    customAptGroup.add(floorMesh);

    // Label
    const areaTxt = r.area ? `${r.area} м²` : `~${Math.round(r.w * r.d * 10) / 10} м²`;
    dynamicLabels.push({ name: r.name, area: areaTxt, pos: new THREE.Vector3(cx, 1.25, cz) });

    // Check all 4 edges of this room (subdivide into ~0.6m checks to detect adjacent rooms cleanly)
    const edges = [
      { axis: 'x', fixed: r.z, start: r.x, end: r.x + r.w, nx: 0, nz: -0.25 },
      { axis: 'x', fixed: r.z + r.d, start: r.x, end: r.x + r.w, nx: 0, nz: 0.25 },
      { axis: 'z', fixed: r.x, start: r.z, end: r.z + r.d, nx: -0.25, nz: 0 },
      { axis: 'z', fixed: r.x + r.w, start: r.z, end: r.z + r.d, nx: 0.25, nz: 0 }
    ];

    for (const e of edges) {
      const key = `${e.axis}:${Math.round(e.fixed * 4)}:${Math.round(e.start * 4)}:${Math.round(e.end * 4)}`;
      if (builtEdges.has(key)) continue;
      builtEdges.add(key);

      const mid = (e.start + e.end) / 2;
      const sampleX = (e.axis === 'x' ? mid : e.fixed) + e.nx;
      const sampleZ = (e.axis === 'x' ? e.fixed : mid) + e.nz;
      const neighbor = roomAt(sampleX, sampleZ, idx);

      if (r.type === 'balcony') {
        if (!neighbor) {
          // Outer balcony edge -> frameless glass railing
          if (e.axis === 'x') addCustomGlass(e.start, e.fixed, e.end, e.fixed, 1.05, customAptGroup);
          else addCustomGlass(e.fixed, e.start, e.fixed, e.end, 1.05, customAptGroup);
        } else {
          // Indoor <-> Balcony edge -> floor-to-ceiling sliding glass wall
          if (e.axis === 'x') addCustomGlass(e.start, e.fixed, e.end, e.fixed, 2.30, customAptGroup);
          else addCustomGlass(e.fixed, e.start, e.fixed, e.end, 2.30, customAptGroup);
        }
      } else if (neighbor && neighbor.type === 'balcony') {
        // Indoor <-> Balcony -> glass sliding doors
        if (e.axis === 'x') addCustomGlass(e.start, e.fixed, e.end, e.fixed, 2.30, customAptGroup);
        else addCustomGlass(e.fixed, e.start, e.fixed, e.end, 2.30, customAptGroup);
      } else if (neighbor && ((r.type === 'living' && neighbor.type === 'hall') || (r.type === 'hall' && neighbor.type === 'living'))) {
        // Open-plan connection between living & entry hall -> keep open!
      } else {
        const isOuter = !neighbor;
        const thick = isOuter ? 0.22 : 0.12;
        buildWallWithOpenings(e.axis, e.fixed, e.start, e.end, thick, isOuter, doors, windows, customAptGroup);
      }
    }

    // Furnish room with Photo-1-grade detail!
    furnishCustomRoom(r, hasSeparateKitchen, customAptGroup);
  });

  // Toggle visibility & UI
  isCustomMode = true;
  aptGroup.visible = false;
  customAptGroup.visible = true;
  applyWallHeight();
  setRoomLabels(dynamicLabels);

  document.getElementById('project-title').textContent = fileName.replace(/\.[^.]+$/, '');
  document.getElementById('project-subtitle').textContent =
    `🤖 Gemini AI • ${parsed.totalArea} м² • ${rooms.length} комн.`;
  document.getElementById('btn-reset-plan').classList.remove('hidden');
  document.getElementById('btn-ai-render').classList.remove('hidden');
  const bpBtn = document.getElementById('btn-blueprint');
  bpBtn.classList.remove('hidden');
  bpBtn.classList.remove('active');

  // Fly camera cleanly to center of uploaded apartment
  const maxSpan = Math.max(W, D, 8);
  camAnim = {
    startPos: camera.position.clone(),
    endPos: new THREE.Vector3(W / 2 + maxSpan * 0.78, maxSpan * 0.92, D / 2 + maxSpan * 0.92),
    startTarget: controls.target.clone(),
    endTarget: new THREE.Vector3(W / 2, 0.5, D / 2),
    t: 0
  };
}

function resetToDefaultApartment() {
  isCustomMode = false;
  if (customAptGroup) customAptGroup.visible = false;
  aptGroup.visible = true;
  setRoomLabels(ROOMS);
  document.getElementById('project-title').textContent = 'Проект ремонта и мебели';
  document.getElementById('project-subtitle').textContent = '106.8 м² • 3 спальни • 2 санузла • 2 балкона';
  document.getElementById('btn-reset-plan').classList.add('hidden');
  document.getElementById('btn-ai-render').classList.add('hidden');
  document.getElementById('btn-blueprint').classList.add('hidden');
  flyTo('iso');
}

// Upload Modal Wiring
const uploadModal = document.getElementById('upload-modal');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('plan-file-input');
const dropEmpty = document.getElementById('dropzone-empty');
const dropPreview = document.getElementById('dropzone-preview');
const previewImg = document.getElementById('preview-img');
const previewName = document.getElementById('preview-name');
const btnGen3d = document.getElementById('btn-generate-3d');
const uploadForm = document.getElementById('upload-form');
const uploadProc = document.getElementById('upload-processing');
const procBar = document.getElementById('proc-bar');
const procTitle = document.getElementById('proc-title');
const inputArea = document.getElementById('input-area');

inputArea.addEventListener('input', () => {
  document.getElementById('area-val').textContent = `${inputArea.value} м²`;
});

function handleSelectedFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    previewImg.src = reader.result;
    previewName.textContent = file.name;
    dropEmpty.classList.add('hidden');
    dropPreview.classList.remove('hidden');
    btnGen3d.disabled = false;
  };
  reader.readAsDataURL(file);
}

document.getElementById('btn-upload').addEventListener('click', () => {
  uploadForm.classList.remove('hidden');
  uploadProc.classList.add('hidden');
  uploadModal.classList.remove('hidden');
});
document.getElementById('upload-close').addEventListener('click', () => {
  uploadModal.classList.add('hidden');
});
uploadModal.querySelector('.modal-backdrop').addEventListener('click', () => {
  if (uploadProc.classList.contains('hidden')) uploadModal.classList.add('hidden');
});

dropzone.addEventListener('click', e => {
  if (e.target.id !== 'btn-change-file') fileInput.click();
});
document.getElementById('btn-change-file').addEventListener('click', e => {
  e.stopPropagation();
  fileInput.click();
});
fileInput.addEventListener('change', () => {
  if (fileInput.files?.[0]) handleSelectedFile(fileInput.files[0]);
});
dropzone.addEventListener('dragover', e => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files?.[0]) handleSelectedFile(e.dataTransfer.files[0]);
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

btnGen3d.addEventListener('click', async () => {
  if (!selectedFile) return;
  uploadForm.classList.add('hidden');
  uploadProc.classList.remove('hidden');

  const steps = Array.from(document.querySelectorAll('#proc-steps li'));
  steps.forEach(s => s.classList.remove('active', 'done'));

  const setStep = (idx, pct, title) => {
    procBar.style.width = `${pct}%`;
    procTitle.textContent = title;
    steps.forEach((s, i) => {
      s.classList.toggle('done', i < idx);
      s.classList.toggle('active', i === idx);
    });
  };

  try {
    setStep(0, 18, 'Подготавливаем чертёж для Gemini AI...');
    const { img } = await loadImageFile(selectedFile);
    const resized = imageToResizedBase64(img, 1400);
    lastUploadedPayload = {
      imageBase64: resized.imageBase64,
      mimeType: resized.mimeType,
      blueprintDataUrl: resized.dataUrl
    };

    setStep(1, 45, 'Gemini AI анализирует стены, окна и двери...');
    const apiRes = await fetch('/api/analyze-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: resized.imageBase64,
        mimeType: resized.mimeType,
        targetAreaM2: Number(inputArea.value)
      })
    });

    const data = await apiRes.json();
    if (!apiRes.ok) {
      throw new Error(data.message || data.error || 'Ошибка Gemini API');
    }

    setStep(2, 80, 'Строим комнаты, проёмы и расставляем мебель...');
    data.blueprintDataUrl = resized.dataUrl;
    await sleep(300);

    setStep(3, 100, 'Собираем готовую 3D-модель...');
    buildCustomApartment(data, selectedFile.name);
    await sleep(350);

    steps.forEach(s => { s.classList.remove('active'); s.classList.add('done'); });
    uploadModal.classList.add('hidden');
  } catch (err) {
    alert(`Ошибка Gemini AI: ${err.message}\n\nПроверьте, что ключ GEMINI_API_KEY добавлен в файл .env (локально) или в Environment Variables на Vercel.`);
    uploadForm.classList.remove('hidden');
    uploadProc.classList.add('hidden');
  }
});

// AI Photorealistic 3D Render for uploaded floor plan in active style
const btnAiRender = document.getElementById('btn-ai-render');
btnAiRender.addEventListener('click', async () => {
  if (!lastUploadedPayload) return;
  const origHtml = btnAiRender.innerHTML;
  btnAiRender.disabled = true;
  btnAiRender.innerHTML = '<span>⏳</span> Gemini рендерит...';
  try {
    const res = await fetch('/api/render-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: lastUploadedPayload.imageBase64,
        mimeType: lastUploadedPayload.mimeType,
        styleKey: currentVariantKey
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Ошибка рендера');
    lightboxImg.src = data.imageDataUrl;
    lightbox.classList.remove('hidden');
  } catch (err) {
    alert(`Не удалось сгенерировать AI-рендер: ${err.message}`);
  } finally {
    btnAiRender.disabled = false;
    btnAiRender.innerHTML = origHtml;
  }
});

document.getElementById('btn-reset-plan').addEventListener('click', resetToDefaultApartment);
document.getElementById('btn-blueprint').addEventListener('click', e => {
  if (!customBlueprintMesh) return;
  customBlueprintMesh.visible = !customBlueprintMesh.visible;
  e.currentTarget.classList.toggle('active', customBlueprintMesh.visible);
});

let lastCustomRooms = [];
function getActiveRoomsForAI() {
  if (isCustomMode && lastCustomRooms.length) return lastCustomRooms;
  return [
    { name: 'Гостиная + Кухня', type: 'living', x: 3.05, z: 0.25, w: 5.1, d: 6.4, cx: 5.3, cz: 4.3 },
    { name: 'Мастер-спальня', type: 'bedroom', x: 0.25, z: 2.1, w: 2.7, d: 7.1, cx: 1.6, cz: 4.9 },
    { name: 'Спальня 3', type: 'bedroom', x: 10.75, z: 0.65, w: 2.7, d: 5.5, cx: 12.1, cz: 3.6 },
    { name: 'Спальня 2', type: 'bedroom', x: 8.25, z: 3.15, w: 2.4, d: 4.4, cx: 9.45, cz: 5.4 },
    { name: 'Большой балкон', type: 'balcony', x: 3.05, z: 6.65, w: 3.8, d: 2.55, cx: 4.95, cz: 8.0 },
    { name: 'Санузел 1', type: 'bathroom', x: 0.25, z: 0.25, w: 2.7, d: 1.8, cx: 1.6, cz: 1.15 },
    { name: 'Санузел 2', type: 'bathroom', x: 7.85, z: 0.25, w: 2.8, d: 1.5, cx: 9.2, cz: 1.0 },
    { name: 'Балкон 2', type: 'balcony', x: 10.75, z: 6.15, w: 2.7, d: 1.4, cx: 12.1, cz: 6.9 }
  ];
}

// Store custom rooms for AI chat context
const origBuildCustomApt = buildCustomApartment;
buildCustomApartment = function (parsed, fileName) {
  origBuildCustomApt(parsed, fileName);
  lastCustomRooms = (parsed.rooms || []).map(r => {
    const x = Number(r.x) || 0;
    const z = Number(r.z) || 0;
    const w = Math.max(0.8, Number(r.w) || 2.5);
    const d = Math.max(0.8, Number(r.d) || 2.5);
    return { name: r.name, type: r.type, x, z, w, d, cx: x + w / 2, cz: z + d / 2 };
  });
};

// ============================================================
// 13. GEMINI AI CHAT WIDGET -> LIVE 3D SCENE MANIPULATION
// ============================================================
const aiObjectsGroup = new THREE.Group();
scene.add(aiObjectsGroup);
let aiAddedItems = [];
let aiItemSeq = 1;
const chatHistory = [];

function spawnChatItem(action) {
  const itemType = action.itemType || 'plant';
  const x = Number(action.x) || 5.0;
  const z = Number(action.z) || 4.0;
  const customMat = action.color
    ? new THREE.MeshStandardMaterial({ color: action.color, roughness: 0.72 })
    : null;

  const g = new THREE.Group();
  const id = `item-${aiItemSeq++}`;

  switch (itemType) {
    case 'plant': {
      addCustomPlant(0, 0, 1.25, g);
      break;
    }
    case 'armchair': {
      const m = customMat || M.sofa;
      addBox(0.82, 0.36, 0.80, 0, 0.20, 0, m, g);
      addBox(0.82, 0.68, 0.18, 0, 0.42, -0.32, m, g);
      addBox(0.14, 0.50, 0.80, -0.35, 0.30, 0, m, g);
      addBox(0.14, 0.50, 0.80, 0.35, 0.30, 0, m, g);
      break;
    }
    case 'sofa': {
      const m = customMat || M.sofa;
      addBox(2.0, 0.34, 0.90, 0, 0.19, 0, m, g);
      addBox(2.0, 0.70, 0.20, 0, 0.38, -0.36, m, g);
      addBox(0.18, 0.54, 0.90, -0.92, 0.30, 0, m, g);
      addBox(0.18, 0.54, 0.90, 0.92, 0.30, 0, m, g);
      break;
    }
    case 'desk': {
      const m = customMat || M.wood;
      addBox(1.35, 0.05, 0.65, 0, 0.74, 0, m, g);
      addBox(0.06, 0.72, 0.58, -0.60, 0.36, 0, M.metal, g);
      addBox(0.06, 0.72, 0.58, 0.60, 0.36, 0, M.metal, g);
      break;
    }
    case 'bed': {
      addCustomBed(0, 0, 1.60, 2.00, 0, g);
      break;
    }
    case 'lamp': {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.55, 10), M.metal);
      pole.position.y = 0.78;
      g.add(pole);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 0.04, 18), M.metal);
      base.position.y = 0.02;
      g.add(base);
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.28, 18), M.lampGlow);
      shade.position.y = 1.58;
      g.add(shade);
      break;
    }
    case 'coffee_table': {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.06, 24), customMat || M.countertop);
      top.position.y = 0.38;
      top.castShadow = true;
      g.add(top);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.35, 18), M.wood);
      leg.position.y = 0.18;
      g.add(leg);
      break;
    }
    case 'wardrobe': {
      addBox(1.50, 2.25, 0.58, 0, 1.125, 0, customMat || M.kitchenUpper, g);
      break;
    }
    case 'dining_table': {
      addBox(1.65, 0.06, 0.88, 0, 0.74, 0, customMat || M.wood, g);
      addBox(0.08, 0.72, 0.68, -0.62, 0.36, 0, M.woodDark, g);
      addBox(0.08, 0.72, 0.68, 0.62, 0.36, 0, M.woodDark, g);
      break;
    }
    case 'rug': {
      addBox(2.2, 0.02, 1.6, 0, 0.015, 0, customMat || M.rug, g, false, true);
      break;
    }
    default: {
      addCustomPlant(0, 0, 1.1, g);
    }
  }

  g.position.set(x, 0, z);
  aiObjectsGroup.add(g);
  aiAddedItems.push({ id, itemType, room: action.room || '', x, z, mesh: g });
}

function setCategoryVisibilityInScene(category, visible) {
  const groups = [aptGroup, customAptGroup].filter(Boolean);
  for (const root of groups) {
    root.traverse(obj => {
      if (obj.userData?.category === category) {
        obj.visible = visible;
      } else if (category === 'rug' && obj.material === M.rug) {
        obj.visible = visible;
      } else if (category === 'tv_wall' && obj.material === M.tvScreen) {
        obj.visible = visible;
      }
    });
  }
}

function removeChatItem(target) {
  if (target === 'last') {
    const last = aiAddedItems.pop();
    if (last) aiObjectsGroup.remove(last.mesh);
    return;
  }
  if (target === 'all_added') {
    for (const it of aiAddedItems) aiObjectsGroup.remove(it.mesh);
    aiAddedItems = [];
    return;
  }

  // Normalize aliases (e.g. "plants" -> "plant", "flowers" -> "plant", "beds" -> "bed")
  const norm = String(target || '').toLowerCase().replace(/s$/, '');
  const cat = norm === 'flower' ? 'plant' : norm;

  // 1. Remove ALL matching AI-added items
  aiAddedItems = aiAddedItems.filter(it => {
    if (it.itemType === cat || it.id === target) {
      aiObjectsGroup.remove(it.mesh);
      return false;
    }
    return true;
  });

  // 2. Also hide ALL matching existing items in the 3D apartment!
  setCategoryVisibilityInScene(cat, false);
}

function executeChatActions(actions) {
  if (!Array.isArray(actions)) return;
  for (const a of actions) {
    if (!a || !a.type) continue;
    switch (a.type) {
      case 'set_style':
        if (VARIANTS[a.variant]) applyVariant(a.variant);
        break;
      case 'set_color':
        if (M[a.target] && a.hex) {
          M[a.target].color.set(a.hex);
          M[a.target].needsUpdate = true;
        }
        break;
      case 'set_lighting':
        isNight = a.mode === 'night';
        applyLighting();
        break;
      case 'set_walls':
        isCutaway = Boolean(a.cutaway);
        applyWallHeight();
        break;
      case 'set_labels':
        showLabels = Boolean(a.visible);
        document.getElementById('btn-labels').classList.toggle('active', showLabels);
        break;
      case 'set_camera':
        if (CAM_PRESETS[a.preset]) flyTo(a.preset);
        break;
      case 'add_item':
        spawnChatItem(a);
        break;
      case 'remove_item':
        removeChatItem(a.target);
        break;
      case 'show_item':
        setCategoryVisibilityInScene(String(a.target || '').toLowerCase().replace(/s$/, ''), true);
        break;
      case 'restore_default_furniture':
        ['plant', 'bed', 'lamp', 'sofa', 'tv_wall', 'rug'].forEach(c => setCategoryVisibilityInScene(c, true));
        applyVariant(currentVariantKey);
        break;
    }
  }
}

// Chat UI Events
const chatFab = document.getElementById('chat-fab');
const chatDrawer = document.getElementById('chat-drawer');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

chatFab.addEventListener('click', () => {
  chatDrawer.classList.toggle('hidden');
  if (!chatDrawer.classList.contains('hidden')) chatInput.focus();
});
document.getElementById('chat-close').addEventListener('click', () => {
  chatDrawer.classList.add('hidden');
});

function appendChatBubble(role, text, extraClass = '') {
  const div = document.createElement('div');
  div.className = `chat-msg ${role} ${extraClass}`.trim();
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

async function sendChatMessage(text) {
  const msg = text.trim();
  if (!msg) return;
  appendChatBubble('user', msg);
  chatInput.value = '';
  chatSend.disabled = true;
  const loader = appendChatBubble('assistant', 'Gemini думает и меняет 3D-сцену...', 'loading');

  try {
    const sceneState = {
      activeVariant: currentVariantKey,
      isNight,
      isCutaway,
      isCustomMode,
      rooms: getActiveRoomsForAI(),
      addedItems: aiAddedItems.map(({ id, itemType, room, x, z }) => ({ id, itemType, room, x, z }))
    };

    const res = await fetch('/api/chat-architect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, history: chatHistory, sceneState })
    });
    const data = await res.json();
    loader.remove();

    if (!res.ok) throw new Error(data.message || data.error || 'Ошибка чата');

    executeChatActions(data.actions);
    appendChatBubble('assistant', data.reply || 'Готово!');
    chatHistory.push({ role: 'user', text: msg }, { role: 'assistant', text: data.reply || 'Готово!' });
  } catch (err) {
    loader.remove();
    appendChatBubble('assistant', `Ошибка: ${err.message}`);
  } finally {
    chatSend.disabled = false;
    chatInput.focus();
  }
}

chatForm.addEventListener('submit', e => {
  e.preventDefault();
  sendChatMessage(chatInput.value);
});

document.getElementById('chat-chips').addEventListener('click', e => {
  const btn = e.target.closest('button[data-prompt]');
  if (btn) sendChatMessage(btn.dataset.prompt);
});

// Initialize
applyVariant('light');
applyWallHeight();
applyLighting();

// Render loop
function animate() {
  requestAnimationFrame(animate);

  if (camAnim) {
    camAnim.t = Math.min(1, camAnim.t + 0.045);
    const ease = 1 - Math.pow(1 - camAnim.t, 3);
    camera.position.lerpVectors(camAnim.startPos, camAnim.endPos, ease);
    controls.target.lerpVectors(camAnim.startTarget, camAnim.endTarget, ease);
    if (camAnim.t >= 1) camAnim = null;
  }

  controls.update();
  renderer.render(scene, camera);
  updateLabels();
}
animate();
