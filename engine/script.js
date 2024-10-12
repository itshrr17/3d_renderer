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

// const teapot = new Object3d();
// teapot.loadFromObjFile('../teapot.obj')
//     .then(() => {
//         renderer.addObject(teapot);
//         renderer.start();
//     })

const cube = new Object3d();
cube.loadFromObjFile('./cube.obj')
    .then(() => {
        renderer.addObject(cube);
        renderer.start();

        // setInterval(() => {
        //     cube.rotation.x += 1;
        //     cube.rotation.y += 0.7;
        // }, 1000 / 60)
    })

    
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
        case 'a':
            renderer.scene.camera.rotation.y -= 2;
            break;
        case 'd':
            renderer.scene.camera.rotation.y += 2;
            break;
        case 'w':
            renderer.scene.camera.position = renderer.scene.camera.position.add(vForward);
            break;
        case 's':
            renderer.scene.camera.position = renderer.scene.camera.position.subtract(vForward);
            break;
    }
})