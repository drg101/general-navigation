import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}

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


const canvas1 = document.getElementById('canvas1') as HTMLCanvasElement;
const canvas2 = document.getElementById('canvas2') as HTMLCanvasElement;


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
    const colorArray = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
        '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
        '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
        '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
        '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
        '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
        '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
        '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
        '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
        '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
    function getRandomCrate(): THREE.Mesh<any, any> {
        const geometry = new THREE.CylinderGeometry(5, 5, 20, 32);
        const randColor = colorArray[Math.floor(Math.random() * colorArray.length)];
        const material = new THREE.MeshStandardMaterial({ color: randColor });
        const cylinder = new THREE.Mesh(geometry, material);
        scene.add(cylinder);

        cylinder.castShadow = true;
        cylinder.position.set(Math.random() * 250 - 125, 1, Math.random() * 250 - 125);
        return cylinder;
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

let gdflag = false;

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
    if (key === 'u') {
        gdflag = true;
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

const goal = new THREE.Vector2(Math.random() * 250 - 125, Math.random() * 250 - 125);
{ // add goal
    const geometry = new THREE.CylinderGeometry(1, 1, 150, 32);
    const material = new THREE.MeshStandardMaterial({ color: "#FF0000" });
    const cylinder = new THREE.Mesh(geometry, material);
    scene.add(cylinder);

    cylinder.castShadow = true;
    cylinder.position.set(goal.x, 0, goal.y);
}

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

    if (gdflag) {
        gdflag = false;
        const angleToGoal = (Math.atan2(goal.y - camera2.position.z, goal.x - camera2.position.x) + Math.PI) / 2 / Math.PI * 360;
        const cameraAngle = camera2.rotation;
        let ang = cameraAngle.y;
        if(cameraAngle.z !== 0) {
            console.log(cameraAngle.y);
            if(cameraAngle.y < 0) {
                ang = -((Math.PI / 2) + cameraAngle.y) - (Math.PI / 2)
            }
            else {
                ang = (Math.PI / 2) + ((Math.PI / 2) - cameraAngle.y)
            }
        }
        ang = ((ang + Math.PI) / 2) / Math.PI * 360;
        const diff = (angleToGoal - ang);
        console.log({angleToGoal, ang, diff})
        canvas2.toBlob(function (blob) {
            if (!blob) {
                return;
            }
            const formdata = new FormData();
            formdata.append('direction', '123');
            formdata.append("files", blob, `ang0.jpeg`);
            var requestOptions: RequestInit = {
                method: "POST",
                body: formdata,
                redirect: "follow",
            };
            fetch("http://localhost:5000/run", requestOptions)
                .then((response) => response.text())
                .then((result) => console.log(result))
                .catch((error) => console.log("error", error));
        }, 'image/jpeg');
    }
}
animate();