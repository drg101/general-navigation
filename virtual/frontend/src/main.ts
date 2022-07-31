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
const camera = new THREE.PerspectiveCamera(120, canvas1.offsetWidth / canvas1.offsetHeight, 0.1, 1000);
const camera2 = new THREE.PerspectiveCamera(90, canvas2.offsetWidth / canvas2.offsetHeight, 0.1, 1000);


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

        const crateSize = 20 * Math.random() + 2.5;
        const crate = new THREE.Mesh(
            new THREE.BoxGeometry(crateSize, crateSize, crateSize),
            new THREE.MeshStandardMaterial({ map: crateTexture, normalMap: createTextureNormalMap })
        );

        crate.castShadow = true;
        crate.position.set(Math.random() * 250 - 125, crateSize / 2, Math.random() * 250 - 125);
        return crate;
    }
    for (let i = 0; i < 75; i++) {
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

const bob = new THREE.ConeGeometry(1, 2.5, 15);
bob.rotateX(-Math.PI / 2);
const bobject = new THREE.Mesh(bob, new THREE.MeshStandardMaterial({ color: 0xff0000 }));
scene.add(camera2);
camera2.add(bobject);
camera2.position.set(0, 2, 0);

const clock = new THREE.Clock();
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

function shortestAngle(angle1: number, angle2: number) {
    let diff = (angle2 - angle1 + 180) % 360 - 180;
    return diff < -180 ? diff + 360 : diff;
}

async function sleep(time: number) {
    return new Promise<void>(resolve => {
        setTimeout(() => {
            resolve();
        }, time)
    });
}

async function getCanvasAsBlob() {
    renderer.render(scene, camera);
    renderer2.render(scene, camera2);
    return new Promise<Blob | undefined>(resolve => {
        canvas2.toBlob(function (blob) {
            if (!blob) {
                resolve(undefined);
                return;
            }

            resolve(blob);
        }, 'image/jpeg');
    });
}

let mostRecentUpdate = 0;
let updating = false;
let timeUntil = 1000;
// let pauseRendering = false;

function animate() {
    if (!updating) {
        const delta = clock.getDelta();
        renderer.render(scene, camera);
        renderer2.render(scene, camera2);
        let direction = new THREE.Vector3();
        camera2.getWorldDirection(direction);
        camera2.position.add(direction.multiplyScalar(1 / 60 * FW * MOVE_SPEED));
        camera2.rotateY(ROT * delta * ROT_SPEED);


        // console.log(Date.now() - mostRecentUpdate);
        if (Date.now() - mostRecentUpdate > timeUntil) {
            updating = true;
            const cameraAngle = camera2.quaternion;
            const copied = cameraAngle.clone();
            const worldDirection = camera2.getWorldDirection(new THREE.Vector3());
            const oldRot = Math.atan2(worldDirection.x, worldDirection.z) / (Math.PI * 2) * 360 + 180;

            camera2.lookAt(new THREE.Vector3(goal.x, 0, goal.y));
            const newWorldDirection = camera2.getWorldDirection(new THREE.Vector3());
            const newRot = Math.atan2(newWorldDirection.x, newWorldDirection.z) / (Math.PI * 2) * 360 + 180;

            const angleTo = Math.floor(shortestAngle(oldRot, newRot));

            camera2.setRotationFromQuaternion(copied);

            (async () => {
                let passThrough = true;
                console.log("minit" + Math.abs(angleTo))
                if (Math.abs(angleTo) < 20) {
                    passThrough = false;
                    const formdata = new FormData();
                    formdata.append('direction', `${angleTo}`);
                    const blob = await getCanvasAsBlob();
                    if (!blob) {
                        console.error("Horrible thing has happened");
                    }
                    else {
                        formdata.append("files", blob, `ang_0.jpeg`);
                    }
                    var requestOptions: RequestInit = {
                        method: "POST",
                        body: formdata,
                        redirect: "follow",
                    };
                    let res = await fetch("http://localhost:5000/try_fw", requestOptions);
                    let resText = await res.text();
                    console.log({resText})
                    if(Number(resText) > 60) {
                        passThrough = true;
                    }
                    else {
                        timeUntil = 2500 - (Number(resText) * 25)
                    }
                }

                if(passThrough) {
                    const formdata = new FormData();
                    formdata.append('direction', `${angleTo}`);
                    let rots = [];
                    let originalRot = camera2.quaternion.clone();
                    for (let i = 0; i < 360; i += Math.floor(Math.random() * 45) + 10) {
                        let rotRad = i / 360 * Math.PI * 2;
                        rots.push(rotRad);
                        camera2.rotateY(rotRad);
                        const blob = await getCanvasAsBlob();
                        if (!blob) {
                            console.error("Horrible thing has happened");
                            continue;
                        }
                        formdata.append("files", blob, `ang_${i}.jpeg`);
                        await sleep(10);
                        camera2.setRotationFromQuaternion(originalRot);
                    }
                    renderer.render(scene, camera);
                    var requestOptions: RequestInit = {
                        method: "POST",
                        body: formdata,
                        redirect: "follow",
                    };
                    let res = await fetch("http://localhost:5000/run", requestOptions);
                    let resText = await res.text();
                    console.log("Got response");
                    console.log(resText, rots)
                    const ind = resText.split(",")[0];
                    const score = resText.split(",")[1];
                    camera2.rotateY(rots[Number(ind)]);
                    timeUntil = 750;
                }
                mostRecentUpdate = Date.now();
                FW = 1;
                console.log("setting to false");
                updating = false;
            })();
        }
        const dir = new THREE.Vector3();
        dir.subVectors(camera2.position, new THREE.Vector3(goal.x, 0, goal.y)).normalize();
        camera.position.set(camera2.position.x + dir.x * 10, 5, camera2.position.z + dir.z * 10);
        camera.lookAt(new THREE.Vector3(goal.x, 0, goal.y));
    }
    requestAnimationFrame(animate);
}
animate();