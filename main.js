import "./style.css";
import { KeyDisplay } from "./utils";
import { CharacterControls } from "./characterControls";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CameraHelper } from "three";
import sq from "./textures/squares.png";
import soldier from "./models/Soldier.glb";

// debug gui
const gui = new dat.GUI();

// Loaders
const loader = new THREE.TextureLoader();

// Canvas
const canvas = document.querySelector("#canvas");

// Textures

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// Geometry  - shapes/skeletons

// Materials - skins

// Mesh - Objects

// Gui setup

// size
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(0, 1, 8);
camera.lookAt(0, 1, 0);
// scene.add(camera);

// renderer
const ren = new THREE.WebGLRenderer({
  canvas: canvas,
  // alpha: false, //makes the bg of the canvas transparent
  antialias: true,
});
ren.setSize(sizes.width, sizes.height);
ren.setPixelRatio(window.devicePixelRatio);
ren.shadowMap.enabled = true;
// ren.setClearColor(new THREE.color(''), 1);

// Orbit Controls
const controls = new OrbitControls(camera, ren.domElement);
controls.enableDamping = true;
controls.minDistance = 5;
controls.maxDistance = 15;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI / 2 - 0.05;

// Lights
lights();
generateFloor();

// MODEL WITH ANIMATIONS
var characterControls
const gLoader = new GLTFLoader();
gLoader.load(soldier, function (gltf) {
  const model = gltf.scene;
  scene.add(model);
  model.traverse(function (object) {
    if (object.isMesh) object.castShadow = true;
  });

  const gltfAnimations = gltf.animations;
  const mixer = new THREE.AnimationMixer(model);
  const animationsMap = new Map();
  gltfAnimations
    .filter((a) => a.name != "Tpose")
    .forEach((a) => {
      animationsMap.set(a.name, mixer.clipAction(a));
    });

  characterControls = new CharacterControls(
    model,
    mixer,
    animationsMap,
    controls,
    camera,
    "Idle"
  );
});


// Event Listeners
// CONTROL KEYS
const keysPressed = {};
const keyDisplayQueue = new KeyDisplay();

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();


  // Update renderer
  ren.setSize(sizes.width, sizes.height);
  keyDisplayQueue.updatePosition();
  ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
window.addEventListener(
  "keydown",
  (event) => {
    keyDisplayQueue.down(event.key);
    if (event.shiftKey && characterControls) {
      characterControls.switchRunToggle();
    } else {
      keysPressed[event.key.toLowerCase()] = true;
    }
  },
  false
);
window.addEventListener(
  "keyup",
  (event) => {
    keyDisplayQueue.up(event.key);
    keysPressed[event.key.toLowerCase()] = false;
  },
  false
);

// animation and interactions
const clock = new THREE.Clock();

const animate = () => {
  
  let mixerUpdateDelta = clock.getDelta();
  if (characterControls) {
    characterControls.update(mixerUpdateDelta, keysPressed);
  }

  // update objects

  // Update Orbital Controls
  controls.update();

  // Render
  ren.render(scene, camera);

  requestAnimationFrame(animate);
};
animate();

function lights() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(-60, 100, -10);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 50;
  dirLight.shadow.camera.bottom = -50;
  dirLight.shadow.camera.left = -50;
  dirLight.shadow.camera.right = 50;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  scene.add(dirLight);
}

function wrapAndRepeatTexture(map) {
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.x = map.repeat.y = 10;
}

function generateFloor() {
  // TEXTURES
  const textureLoader = new THREE.TextureLoader();
  const placeholder = textureLoader.load(sq);
  // const sandBaseColor = textureLoader.load("./textures/Sand 002_COLOR.jpg");
  // const sandNormalMap = textureLoader.load("./textures/Sand 002_NRM.jpg");
  // const sandHeightMap = textureLoader.load("./textures/Sand 002_DISP.jpg");
  // const sandAmbientOcclusion = textureLoader.load(
    // "./textures/Sand 002_OCC.jpg"
  // );

  const WIDTH = 80;
  const LENGTH = 80;

  const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 512, 512);
  const material = new THREE.MeshStandardMaterial({
    map: placeholder,
    // normalMap: sandNormalMap,
    // displacementMap: sandHeightMap,
    // displacementScale: 0.1,
    // aoMap: sandAmbientOcclusion,
  });
  wrapAndRepeatTexture(material.map);
  // wrapAndRepeatTexture(material.normalMap);
  // wrapAndRepeatTexture(material.displacementMap);
  // wrapAndRepeatTexture(material.aoMap);
  // const material = new THREE.MeshPhongMaterial({ map: placeholder})

  const floor = new THREE.Mesh(geometry, material);
  floor.receiveShadow = true;
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
}
