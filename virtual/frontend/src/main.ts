import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import '@tensorflow/tfjs-backend-cpu';

import * as tf from '@tensorflow/tfjs-core';
// Import @tensorflow/tfjs-tflite.
import * as tflite from '@tensorflow/tfjs-tflite';


const tfliteModel = await tflite.loadTFLiteModel('./src/assets/d1.tflite');

console.log(tfliteModel)



function createPathStrings(filename: string) {
    const basePath = "./src/assets/";
    const baseFilename = basePath + filename;
    const fileType = ".png";
    const sides = ["ft", "bk", "up", "dn", "rt", "lf"];
    const pathStings = sides.map(side => {
        return baseFilename + "_" + side + fileType;
    });
    return pathStings;
}

const views = [];

const canvas1 = document.getElementById('canvas1') as HTMLCanvasElement;
const canvas2 = document.getElementById('canvas2') as HTMLCanvasElement;
const canvas3 = document.getElementById('canvas3') as HTMLCanvasElement;


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, canvas1.offsetWidth / canvas1.offsetHeight, 0.1, 1000);
const camera2 = new THREE.PerspectiveCamera(75, canvas2.offsetWidth / canvas2.offsetHeight, 0.1, 1000);


const renderer = new THREE.WebGLRenderer({
    canvas: canvas1
});
renderer.setPixelRatio(devicePixelRatio)
renderer.setSize(canvas1.offsetWidth, canvas1.offsetHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const renderer2 = new THREE.WebGLRenderer({
    canvas: canvas2
});
renderer2.setPixelRatio(devicePixelRatio)
renderer2.setSize(canvas2.offsetWidth, canvas2.offsetHeight);
renderer2.shadowMap.enabled = true;
renderer2.shadowMap.type = THREE.PCFSoftShadowMap;

// skybox
{
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load(createPathStrings("miramar"));
    scene.background = texture;
}

// lighting
{
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    const light = new THREE.DirectionalLight(0xFFFFFF, 0.9);
    light.castShadow = true;
    light.position.set(20, 30, 20)
    light.target.position.set(0, 0, 0);
    let directionalLightHelper = new THREE.DirectionalLightHelper(light, 5);
    light.add(directionalLightHelper)
    light.shadow.mapSize.width = 5120 // default
    light.shadow.mapSize.height = 5120 // default
    light.shadow.camera.near = 0.1 // default
    light.shadow.camera.far = 2000 // default
    light.shadow.camera.top = -200 // default
    light.shadow.camera.right = 200 // default
    light.shadow.camera.left = -200 // default
    light.shadow.camera.bottom = 200 // default
    scene.add(light, ambientLight);
}

// add crates
{
    function getRandomCrate(): THREE.Mesh<any, any> {
        const crateNum = Math.round(Math.random() * 9) + 1;

        const crateTexture = new THREE.TextureLoader().load(`./src/assets/crates/${crateNum}.jpg`);
        const createTextureNormalMap = new THREE.TextureLoader().load(`./src/assets/crates/${crateNum}_N.png`);

        const crateSize = 5 * Math.random() + 2.5;
        const crate = new THREE.Mesh(
            new THREE.BoxGeometry(crateSize, crateSize, crateSize),
            new THREE.MeshStandardMaterial({ map: crateTexture, normalMap: createTextureNormalMap })
        );

        crate.castShadow = true;
        crate.position.set(Math.random() * 250 - 125, crateSize / 2, Math.random() * 250 - 125);
        return crate;
    }
    for (let i = 0; i < 100; i++) {
        const crate = getRandomCrate();
        scene.add(crate);
    }
}

// add base
{
    const planeGeometry = new THREE.PlaneGeometry(250, 250, 32, 32);
    planeGeometry.rotateX(-Math.PI / 2);
    const pavement = new THREE.TextureLoader().load('./src/assets/pavement.jpg');
    pavement.wrapS = THREE.RepeatWrapping;
    pavement.wrapT = THREE.RepeatWrapping;
    pavement.repeat.set(20, 20)
    const planeMaterial = new THREE.MeshStandardMaterial({ map: pavement })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;
    scene.add(plane);
}

// fog
{
    const color = 0xabada8;
    const near = 10;
    const far = 160;
    scene.fog = new THREE.Fog(color, near, far);
}

const bob = new THREE.SphereGeometry();
const bobject = new THREE.Mesh(bob, new THREE.MeshStandardMaterial({ color: 0xff0000 }));
scene.add(camera2);
camera2.add(bobject);
camera2.position.set(0, 2, 0);

const clock = new THREE.Clock();
const controls = new OrbitControls(camera, renderer.domElement);
controls.domElement = renderer.domElement;
camera.position.set(0, 5, 0)

const MOVE_SPEED = 3;
const ROT_SPEED = 1;

let FW = 0;
let ROT = 0;

document.addEventListener("keydown", (e) => {
    const key = e.key;
    if (key === 'w') {
        FW = 1;
    }
    if (key === 'a') {
        ROT = 1;
    }
    if (key === 'd') {
        ROT = -1;
    }
}, false);

document.addEventListener("keyup", (e) => {
    const key = e.key;
    if (key === 'w') {
        FW = 0;
    }
    if (key === 'a') {
        ROT = 0;
    }
    if (key === 'd') {
        ROT = 0;
    }
}, false);


function animate() {
    const delta = clock.getDelta();
    controls.update();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    renderer2.render(scene, camera2);

    let direction = new THREE.Vector3();
    camera2.getWorldDirection(direction);
    camera2.position.add(direction.multiplyScalar(delta * FW * MOVE_SPEED));
    camera2.rotateY(ROT * delta * ROT_SPEED);

    // capture
    const wc = canvas2.offsetWidth;
    const wh = canvas2.offsetHeight;
    canvas3.width = wc;
    canvas3.height = wh;


    function getPixels(x: number, y: number, width: number, height: number) {
        const length = width * height * 4;
        const row = width * 4;
        const end = (height - 1) * row;
        const arr = new Uint8Array(length);
        const pixels = new Uint8Array(length);

        renderer2.getContext().readPixels(x, y, width, height, WebGL2RenderingContext.RGBA, WebGL2RenderingContext.UNSIGNED_BYTE, arr);

        for (let i = 0; i < length; i += row) {
            pixels.set(arr.subarray(i, i + row), end - i);
        }

        return pixels;
    }
    const pixels = getPixels(0,0,wc,wh);


    const ctx3 = canvas3.getContext('2d');
    const d3 = ctx3?.createImageData(wc, wh) as ImageData;
    d3.data.set(pixels);
    ctx3?.putImageData(d3, 0, 0);

    let img = tf.browser.fromPixels(canvas3, 3);
    img = tf.div(img, 255);
    img = tf.image.resizeBilinear(img, [256,256]);
    // @ts-ignore
    img = tf.reshape(img, [-1]);
    let outputTensor = tfliteModel.predict(img) as tf.Tensor;
    console.log(outputTensor.dataSync());





    // const input = tf.browser.fromPixels(canvas2);
    // console.log(input)
    // let outputTensor = tfliteModel.predict(input) as tf.Tensor;
    // console.log(outputTensor.dataSync());
    // console.log(camera.position);
    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;
}
animate();