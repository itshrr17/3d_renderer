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

// Orbit control variables - these maintain the orbital state
const ORBIT_TARGET = new Vector(0, 0, 0); // Fixed center point - NEVER changes
let orbitDistance = null; // Fixed distance - calculated once, never changes
let currentTheta = 0;     // Current horizontal angle - can accumulate infinitely
let currentPhi = 0;       // Current vertical angle - clamped to prevent flipping

// Initialize orbit system once at startup
function initializeOrbitSystem() {
    const camera = renderer.scene.camera;
    
    // Calculate initial distance and angles from current camera position
    const offset = camera.position.subtract(ORBIT_TARGET);
    orbitDistance = offset.length();
    
    // Calculate initial angles - these become our starting point
    currentTheta = Math.atan2(offset.x, offset.z);
    currentPhi = Math.asin(offset.y / orbitDistance);
    
    console.log(`Orbit initialized - Distance: ${orbitDistance.toFixed(3)}, Theta: ${currentTheta.toFixed(3)}, Phi: ${currentPhi.toFixed(3)}`);
}

// Call this once when your app starts (after camera is set up)
// You can call this after the renderer is created
setTimeout(() => initializeOrbitSystem(), 100);

document.addEventListener('mousedown', (e) => {
    mousedown = true;
    // Don't reinitialize - just start dragging from current position
})

document.addEventListener('mousemove', (e) => {
    if (!mousedown) return;

    const sensitivity = 0.005;
    
    // Directly modify the angles - no limits on horizontal rotation
    currentTheta -= e.movementX * sensitivity; // Horizontal - can go to any value
    currentPhi += e.movementY * sensitivity;   // Vertical - will be clamped
    
    // Only clamp vertical angle to prevent camera flipping
    const maxVerticalAngle = Math.PI / 2 - 0.1; // ~85 degrees
    currentPhi = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, currentPhi));
    
    // Calculate new camera position using spherical coordinates
    // Using the EXACT SAME formula every time with FIXED distance
    const newX = ORBIT_TARGET.x + orbitDistance * Math.sin(currentTheta) * Math.cos(currentPhi);
    const newY = ORBIT_TARGET.y + orbitDistance * Math.sin(currentPhi);
    const newZ = ORBIT_TARGET.z + orbitDistance * Math.cos(currentTheta) * Math.cos(currentPhi);
    
    // Update camera position
    const camera = renderer.scene.camera;
    camera.position.x = newX;
    camera.position.y = newY;
    camera.position.z = newZ;
    
    // Always look at the fixed target
    camera.target = ORBIT_TARGET;
    
    // Verify distance hasn't changed (debugging)
    const actualDistance = camera.position.subtract(ORBIT_TARGET).length();
    if (Math.abs(actualDistance - orbitDistance) > 0.001) {
        console.warn(`Distance drift detected! Expected: ${orbitDistance.toFixed(3)}, Actual: ${actualDistance.toFixed(3)}`);
    }
})
function updateOrbitDistance() {
    const camera = renderer.scene.camera;
    const newDistance = camera.position.subtract(ORBIT_TARGET).length();
    
    if (Math.abs(newDistance - orbitDistance) > 0.1) { // Only update if significant change
        orbitDistance = newDistance;
        console.log(`Orbit distance updated to: ${orbitDistance.toFixed(3)}`);
    }
}

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
            setTimeout(() => {
                updateOrbitDistance();
            }, 10);
            break;
        case 's':
            renderer.scene.camera.position = renderer.scene.camera.position.subtract(vForward);
            setTimeout(() => {
                updateOrbitDistance();
            }, 10);
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
// Add mouse wheel zoom functionality with smooth zooming
let targetZoomDistance = null; // Target distance for smooth interpolation
let isZooming = false;
let zoomAnimationId = null;

// Initialize target zoom distance
function initializeZoomSystem() {
    if (orbitDistance !== null) {
        targetZoomDistance = orbitDistance;
    }
}

// Smooth zoom interpolation function
function smoothZoomUpdate() {
    if (!isZooming || targetZoomDistance === null || orbitDistance === null) {
        return;
    }
    
    const camera = renderer.scene.camera;
    const zoomLerpSpeed = 0.15; // How fast to interpolate (0.1 = slow, 0.3 = fast)
    const threshold = 0.01; // When to stop animating
    
    // Calculate difference between current and target distance
    const distanceDiff = targetZoomDistance - orbitDistance;
    
    if (Math.abs(distanceDiff) < threshold) {
        // Close enough - stop zooming
        orbitDistance = targetZoomDistance;
        isZooming = false;
        console.log(`Smooth zoom complete - Distance: ${orbitDistance.toFixed(3)}`);
        return;
    }
    
    // Interpolate towards target distance
    orbitDistance += distanceDiff * zoomLerpSpeed;
    
    // Calculate current camera direction from target
    const currentDirection = camera.position.subtract(ORBIT_TARGET).normalize();
    
    // Set camera position at new interpolated distance
    const newPosition = ORBIT_TARGET.add(currentDirection.multiply(orbitDistance));
    camera.position = newPosition;
    
    // Continue animation
    zoomAnimationId = requestAnimationFrame(smoothZoomUpdate);
}

document.addEventListener('wheel', (e) => {
    e.preventDefault(); // Prevent page scrolling
    
    // Initialize zoom system if needed
    if (targetZoomDistance === null) {
        initializeZoomSystem();
    }
    
    const zoomSpeed = 0.8; // Base zoom speed
    const zoomAcceleration = 0.05; // Additional speed based on wheel delta
    
    // Calculate zoom amount with acceleration for faster scrolling
    const wheelDelta = Math.abs(e.deltaY);
    const acceleratedSpeed = zoomSpeed + (wheelDelta * zoomAcceleration);
    
    let zoomAmount;
    if (e.deltaY < 0) {
        // Scroll up - zoom in (decrease distance)
        zoomAmount = -acceleratedSpeed;
    } else {
        // Scroll down - zoom out (increase distance)
        zoomAmount = acceleratedSpeed;
    }
    
    // Update target distance
    targetZoomDistance += zoomAmount;
    
    // Apply zoom limits to target distance
    const minDistance = 0.01  // Minimum zoom distance
    const maxDistance = 50.0; // Maximum zoom distance
    targetZoomDistance = Math.max(minDistance, Math.min(maxDistance, targetZoomDistance));
    
    // Start smooth zoom animation if not already running
    if (!isZooming) {
        isZooming = true;
        smoothZoomUpdate();
    }
    
    console.log(`Wheel zoom target: ${targetZoomDistance.toFixed(3)}`);
}, { passive: false }); // passive: false allows preventDefault to work