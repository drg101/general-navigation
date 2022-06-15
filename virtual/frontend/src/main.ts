import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function createPathStrings(filename: string) {
    const basePath = "./src/assets/";
    const baseFilename = basePath + filename;
    const fileType = ".tga";
    const sides = ["ft", "bk", "up", "dn", "rt", "lf"];
    const pathStings = sides.map(side => {
        return baseFilename + "_" + side + fileType;
    });
    return pathStings;
}

let skyboxImage = "miramar";
function createMaterialArray(filename: string) {
    const skyboxImagepaths = createPathStrings(filename);
    const materialArray = skyboxImagepaths.map(image => {
        let texture = new THREE.TextureLoader().load(image);
        return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });;
    });
    return materialArray;
}

const materialArray = createMaterialArray(skyboxImage);
const skyboxGeo = new THREE.BoxGeometry(10000, 10000, 10000);
const skybox = new THREE.Mesh(skyboxGeo, materialArray);

const scene = new THREE.Scene();
scene.add(skybox);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const base = new THREE.Mesh(new THREE.BoxGeometry(250, 1, 250), new THREE.MeshStandardMaterial({ color: 0x00FF00 }));
base.position.set(0, 0, 0);
scene.add(base);

const ambientLight = new THREE.AmbientLight(0xFFFFFF);
const pointLight = new THREE.PointLight(0xFFFFFF);
pointLight.position.set(0, 200, 0);
scene.add(pointLight);
const controls = new OrbitControls(camera, renderer.domElement);
controls.domElement = renderer.domElement;
const clock = new THREE.Clock();
camera.position.set(0, 5, 0)

for (let i = 0; i < 100; i++) {
    const base2 = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.MeshStandardMaterial({ color: 0xFF0000 }));
    base2.position.set(Math.random() * 250 - 125, 1, Math.random() * 250 - 125);
    scene.add(base2);
}



function animate() {
    const delta = clock.getDelta();
    controls.update();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    // console.log(camera.position);
    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;
}
animate();