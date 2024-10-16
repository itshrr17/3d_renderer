import Renderer from "./renderer.js";
import { Object3d, Vector } from "./ds.js";

function setupCanvas(width = window.innerWidth, height = window.innerHeight) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    document.body.append(canvas);
    return canvas;
}

const canvas = setupCanvas();
const renderer = new Renderer(canvas);

const teapot = new Object3d();
teapot.loadFromObjFile('../teapot.obj')
    .then(() => {    
        renderer.addObject(teapot);
        renderer.start();

        setInterval(() => {
            // teapot.setRotation(teapot.rotation.x + 0.3, teapot.rotation.y + 1, undefined)
            // teapot.setPosition(undefined, undefined, teapot.position.z + 1)
        }, 1000 / 280)
    })

// const cube = new Object3d();
// cube.loadFromObjFile('./cube.obj')
//     .then(() => {
//         renderer.addObject(cube);
//         renderer.start();

//         setInterval(() => {
//             // cube.setRotation(cube.rotation.x + 1, cube.rotation.y + 0.7, undefined)
//         }, 1000 / 60)
//     })

    
// const axis_x = new Object3d();
// axis_x.loadFromObjFile('./axis_x.obj')
// .then(() => {
//     renderer.addObject(axis_x);
//     renderer.start();
// })

// const axis_y = new Object3d();
// axis_y.loadFromObjFile('./axis_y.obj')
// .then(() => {
//     renderer.addObject(axis_y);
//     renderer.start();
// })

// const axis_z = new Object3d();
// axis_z.loadFromObjFile('./axis_z.obj')
// .then(() => {
//     renderer.addObject(axis_z);
//     renderer.start();
// })

let mousedown = false;



document.addEventListener('mousedown', (e) => {
    console.log(e.button)
    mousedown = true;
})

document.addEventListener('mouseup', (e) => {
    console.log(e)
    mousedown = false;
})


let sensitivity = 0.05;
let pitchVelocity = 0;
const dampingFactor = 0.9;
const maxPitch = Math.PI / 2;  // 90 degrees in radians
const minPitch = -Math.PI / 2; // -90 degrees in radians

document.addEventListener('mousemove', (e) =>  {
    if(!mousedown) return
    renderer.scene.camera.rotation.x -= Math.max(minPitch, Math.min(maxPitch, e.movementY * sensitivity));
    renderer.scene.camera.rotation.y += Math.max(minPitch, Math.min(maxPitch, e.movementX * sensitivity));
})


document.addEventListener('keydown', (e) => {
    const vForward = renderer.scene.camera.lookAt.multiply(0.5);

    switch(e.key) {
        case 'ArrowUp':
            renderer.scene.camera.position.y += 0.1;
            break;
        case 'ArrowDown':
            renderer.scene.camera.position.y -= 0.1;
            break;
        case 'ArrowLeft':
            renderer.scene.camera.position.x += 0.1;
            break;
        case 'ArrowRight':
            renderer.scene.camera.position.x -= 0.1;
            break;
        case 'w':
            renderer.scene.camera.position = renderer.scene.camera.position.add(vForward);
            break;
        case 's':
            renderer.scene.camera.position = renderer.scene.camera.position.subtract(vForward);
            break;
        case 'a':
            renderer.scene.camera.rotation.y -= 2;
            break;
        case 'd':
            renderer.scene.camera.rotation.y += 2;
            break;
        case 'q':
            renderer.scene.camera.rotation.x -= 2;
            break;
        case 'e':
            renderer.scene.camera.rotation.x += 2;
            break;
    }
})