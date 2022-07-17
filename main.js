import './style.css'
import * as THREE from 'three';

import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

let camera, scene, renderer, composer, stats, corBloom, corPointLight, corPointLight2, controls, hslColor;

const color = {
  hue: Math.round(Math.random()*361),
  sat: 32,
  light: 25,  
  alpha: 1
}

const params = {
  exposure: 2,
  bloomStrength: 3,
  bloomThreshold: 0.521,
  bloomRadius: 0.47
};
init();
animate();

function init() {
  
  // PERFORMANCE INFO
  //  stats = new Stats();

  const container = document.createElement( 'div' );
  document.body.appendChild( container );
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild( renderer.domElement );
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.set( 10, 0, 0 );
  // console.log('camera.position', camera)
  const environment = new RoomEnvironment();
  const pmremGenerator = new THREE.PMREMGenerator( renderer );
  scene = new THREE.Scene();
  scene.background = new THREE.Color( '#111');

  // POST-PROCESSING
  const renderScene = new RenderPass( scene, camera );
  const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
  bloomPass.threshold = params.bloomThreshold;
  bloomPass.strength = params.bloomStrength;
  bloomPass.radius = params.bloomRadius;

  composer = new EffectComposer( renderer );
  composer.addPass( renderScene );
  composer.addPass( bloomPass );

  // CONTROLS
  controls = new OrbitControls( camera, renderer.domElement );
  controls.minDistance = 5;
  controls.maxDistance = 10;
  controls.autoRotate = true
  controls.enablePan = false
  controls.enableDamping = true
  controls.update();

  const loader = new GLTFLoader();
  loader.load( 'monocromatica-uv.glb', function ( gltf ) {
    // console.log('gltf', gltf)
    corPointLight = gltf.scene.children[0].color
    corPointLight2 = gltf.scene.children[1].color
    corBloom = gltf.scene.children[2].children[1].material.emissive
    gltf.scene.children[2].children[1].material.emissiveIntensity = 10
    updateColor()
    scene.add( gltf.scene );
    const gui = new GUI();
    var conf = { color : hslToHex(color.hue, color.sat, color.light) };
    
    // DEBUG & BLOOM CONFIGURATION   
    gui.hide()
    .addColor(conf, "color")
    
    .onChange(function(colorValue) {
        corPointLight.setStyle(colorValue)
        corPointLight2.setStyle(colorValue)
        corBloom.setStyle(colorValue)
        scene.background.setStyle(colorValue)
      });
      
      // DEBUG GUI
      gui.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {
        renderer.toneMappingExposure = Math.pow( value, 4.0 );
      } );
      
      gui.add( params, 'bloomThreshold', 0.0, 1.0 ).onChange( function ( value ) {
        bloomPass.threshold = Number( value );
      } );
      
      gui.add( params, 'bloomStrength', 0.0, 6.0 ).onChange( function ( value ) {
        bloomPass.strength = Number( value );
      } );
      
      gui.add( params, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {
        bloomPass.radius = Number( value );
      } );
      // console.log('gui', gui)
      
  } );
  
  window.addEventListener( 'resize', onWindowResize );
  
}
function onWindowResize() {
  
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize( width, height );
  composer.setSize( width, height );

}

function animate() {

  requestAnimationFrame( animate );
  
  // PERFORMANCE GRAPH
  // stats.update();

  controls.update()
  composer.render();

}

function updateColor() {
  hslColor = getHSL()
  document.getElementById('navMenu').style.background = hslColor
  corBloom.setStyle(hslColor)
  corPointLight.setStyle(hslColor)
  corPointLight2.setStyle(hslColor)
  scene.background.setStyle(hslColor)
  // console.log(color.hue)
  document.querySelector('.monocromaticaHue').children[0].innerHTML = '#' + color.hue
}


 
const main = () => {
const hueInput = document.querySelector('input[name=hue]')
hueInput.addEventListener('input', () => {
    color.hue = hueInput.value
    updateColor()
    })
}

const getHSL = () => {
  return `hsla(${color.hue}, ${color.sat}%, ${color.light}%, ${color.alpha})`
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

document.addEventListener('DOMContentLoaded', main)

// console.log(document.querySelector('.hue'))

// let spanHue, hueSpan
// for (let h = 0; h < 360; h++) {
//   hueSpan = document.createElement("span")
//   document.querySelector('.hue').appendChild(hueSpan)
//   spanHue = document.querySelector('.hue').children[h]
//   spanHue.style.width = '3px'
//   spanHue.style.height = '120px'
//   spanHue.style.display = 'block'
//   spanHue.style.position = 'absolute'
//   spanHue.style.left = '50%'
//   spanHue.style.top = '50%'
//   spanHue.style.transformOrigin = 'center top'
//   spanHue.style.transform = 'rotateZ(' + h + 'deg)'
//   spanHue.style.background = 'hsl(' + h + ', 100%, 50%)'
  
// }

// console.log(spanHue)