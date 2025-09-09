import Renderer from "./engine/renderer.js";
import { Object3d, Vector } from "./engine/ds.js";

function isLocalHost() {
    return location.hostname === "localhost" || location.hostname === "127.0.0.1"
}

const urls = {
    local: {
        cube: "../models/cube.obj",
        teapot: "../models/teapot.obj"
    },
    git: {
        cube: "../3d_renderer/models/cube.obj",
        teapot: "../3d_renderer/models/teapot.obj"
    }
}

function setupCanvas(width = window.innerWidth, height = window.innerHeight) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    document.body.append(canvas);
    return canvas;
}

const canvas = setupCanvas();
const renderer = new Renderer(canvas);

function ui_toggle_object(object, ele, e) {
    if(renderer.hasObject(object)) {
        renderer.removeObject(object);
        ele.checked = false;
    } else {
        renderer.addObject(object);
        ele.checked = true;
    }
}

function ui_add_object(object, checked = true) {
    const name = object.name;
    const list = document.getElementById('models-list');
    
    const checkbox = document.createElement("input")
    checkbox.type = "checkbox";
    checkbox.checked = checked;
    checkbox.name = name;
    const text = document.createElement("span");
    text.innerText = name

    const div = document.createElement("div");
    div.appendChild(checkbox)
    div.appendChild(text);

    list.appendChild(div);
    div.onclick = (e) => ui_toggle_object(object, checkbox, e);
}


const teapot = new Object3d();
teapot.loadFromObjFile(isLocalHost() ? urls.local.teapot : urls.git.teapot)
    .then(() => {    
        teapot.setPosition(0, -2, 0);

        renderer.addObject(teapot);
        renderer.start();

        ui_add_object(teapot);

        // setInterval(() => {
        //     teapot.setRotation(undefined, teapot.rotation.y + 1, undefined)
        // }, 1000 / 280)
    })

const cube = new Object3d();
cube.loadFromObjFile(isLocalHost() ? urls.local.cube : urls.git.cube)
    .then(() => {
        // renderer.addObject(cube);
        // renderer.start();

        ui_add_object(cube, false);

        setInterval(() => {
            // cube.setRotation(cube.rotation.x + 1, cube.rotation.y + 0.7, undefined)
        }, 1000 / 60)
    })

let mousedown = false;

document.addEventListener('mousedown', (e) => {
    mousedown = true;
})

document.addEventListener('mouseup', (e) => {
    mousedown = false;
})

document.addEventListener('mousemove', (e) =>  {
    if(!mousedown) return
    // renderer.scene.camera.rotation.x -= Math.max(minPitch, Math.min(maxPitch, e.movementY * sensitivity));
    // renderer.scene.camera.rotation.y += Math.max(minPitch, Math.min(maxPitch, e.movementX * sensitivity));

    const camera = renderer.scene.camera;
    const sensitivity = 0.01; // Adjust sensitivity to control rotation speed
    
    // Update camera rotation (phi = vertical, theta = horizontal)
    const phi = camera.rotation.x + (e.movementY * sensitivity);
    const theta = camera.rotation.y - (e.movementX * sensitivity);

    // Save updated rotation back to camera object
    camera.rotation.x = phi;
    camera.rotation.y = theta;

    const radius = camera.target.subtract(camera.position).length();
    
    // Calculate the new camera position based on the spherical coordinates
    const updatedCameraPosition = new Vector(
        camera.target.x - radius * Math.cos(camera.rotation.x) * Math.sin(camera.rotation.y),
        camera.target.y + radius * Math.sin(camera.rotation.x),
        camera.target.z - radius * Math.cos(camera.rotation.x) * Math.cos(camera.rotation.y)
    );

    const epsilon = 0.5; // Small threshold for floating-point comparison

    // If phi is within 90 to 270 degrees (or π/2 to 3π/2 radians), camera is upside down
    if (
        (phi > Math.PI / 2 - epsilon && phi < (3 * Math.PI) / 2 + epsilon) ||
        (phi < -Math.PI / 2 + epsilon && phi > -(3 * Math.PI) / 2 - epsilon)
    ) {
        camera.up = new Vector(0, -1, 0); // Invert "up" vector when upside down
    } else {
        camera.up = new Vector(0, 1, 0); // Default "up" vector when right-side up
    }
    
    // Update the camera's position to the new calculated position
    camera.position = updatedCameraPosition;
})

let lastTime = 0;

document.addEventListener('keyup', (e, k) => {
    lastTime = 0;
})

document.addEventListener('keydown', (e) => {
    // for smooth controls, using timeElapsed
    const t = Date.now();
    if(!lastTime) lastTime = t;
    const deltaTime = ((t - lastTime) / 1000) || 0.2;

    const camera = renderer.scene.camera;
    const vForward = camera.target.subtract(camera.position).normalize().multiply(0.5 * deltaTime);

    const vRight = vForward.cross(camera.up).scale(0.5 * deltaTime);

    switch(e.key) {
        case 'ArrowUp':
            renderer.scene.camera.position.y += 0.3 * deltaTime;
            renderer.scene.camera.target.y += 0.3 * deltaTime;
            break;
        case 'ArrowDown':
            renderer.scene.camera.position.y -= 0.3 * deltaTime;
            renderer.scene.camera.target.y -= 0.3 * deltaTime;
            break;
        case 'ArrowLeft':
            renderer.scene.camera.position = renderer.scene.camera.position.subtract(vRight);
            renderer.scene.camera.target = renderer.scene.camera.target.subtract(vRight);

            // renderer.scene.camera.position.x -= 0.1;
            // renderer.scene.camera.target.x -= 0.1;
            break;
        case 'ArrowRight':
            renderer.scene.camera.position = renderer.scene.camera.position.add(vRight);
            renderer.scene.camera.target = renderer.scene.camera.target.add(vRight);

            // renderer.scene.camera.position.x += 0.1;
            // renderer.scene.camera.target.x += 0.1;
            break;
        case 'w':
            renderer.scene.camera.position = renderer.scene.camera.position.add(vForward);
            break;
        case 's':
            renderer.scene.camera.position = renderer.scene.camera.position.subtract(vForward);
            break;
        case 'a':
            renderer.scene.camera.rotation.y -= 2 * deltaTime;
            break;
        case 'd':
            renderer.scene.camera.rotation.y += 2 * deltaTime;
            break;
        case 'q':
            renderer.scene.camera.rotation.x -= 2 * deltaTime;
            break;
        case 'e':
            renderer.scene.camera.rotation.x += 2 * deltaTime;
            break;
    }
})