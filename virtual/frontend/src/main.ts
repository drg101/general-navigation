import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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

function getRandomCrate(): THREE.Mesh<any, any> {
    const crateNum = Math.round(Math.random() * 10);
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

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);


{
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load(createPathStrings("miramar"));
    scene.background = texture;
}

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

{
    for (let i = 0; i < 100; i++) {
        const crate = getRandomCrate();
        scene.add(crate);
    }
}

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

{
    const color = 0xabada8;
    const near = 10;
    const far = 160;
    scene.fog = new THREE.Fog(color, near, far);
}


const clock = new THREE.Clock();
const controls = new OrbitControls(camera, renderer.domElement);
controls.domElement = renderer.domElement;
camera.position.set(0, 5, 0)

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