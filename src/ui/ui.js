
// UI and system setup logic from index.js
import Renderer from '../engine/renderer.js';
import Object3d from '../engine/object3d.js';
import Vector from '../math/vector.js';

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

function ui_toggle_object(object, ele, e, renderer) {
	if(renderer.hasObject(object)) {
		renderer.removeObject(object);
		ele.checked = false;
	} else {
		renderer.addObject(object);
		ele.checked = true;
	}
}

function ui_add_object(object, renderer, checked = true) {
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
	div.onclick = (e) => ui_toggle_object(object, checkbox, e, renderer);
}

// Orbit/zoom/camera event handlers and variables
const ORBIT_TARGET = new Vector(0, 0, 0);
let orbitDistance = null;
let currentTheta = 0;
let currentPhi = 0;

function initializeOrbitSystem(renderer) {
	const camera = renderer.scene.camera;
	const offset = camera.position.subtract(ORBIT_TARGET);
	orbitDistance = offset.length();
	currentTheta = Math.atan2(offset.x, offset.z);
	currentPhi = Math.asin(offset.y / orbitDistance);
	console.log(`Orbit initialized - Distance: ${orbitDistance.toFixed(3)}, Theta: ${currentTheta.toFixed(3)}, Phi: ${currentPhi.toFixed(3)}`);
}

function updateOrbitDistance(renderer) {
	const camera = renderer.scene.camera;
	const newDistance = camera.position.subtract(ORBIT_TARGET).length();
	if (Math.abs(newDistance - orbitDistance) > 0.1) {
		orbitDistance = newDistance;
		console.log(`Orbit distance updated to: ${orbitDistance.toFixed(3)}`);
	}
}

let lastTime = 0;
let mousedown = false;

function setupEventHandlers(renderer) {

	document.addEventListener('mousedown', (e) => {
		mousedown = true;
	});

	document.addEventListener('mouseup', (e) => {
		mousedown = false;
	});

	document.addEventListener('mousemove', (e) => {
		if (!mousedown) return;
		const sensitivity = 0.005;
		currentTheta -= e.movementX * sensitivity;
		currentPhi += e.movementY * sensitivity;
		const maxVerticalAngle = Math.PI / 2 - 0.1;
		currentPhi = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, currentPhi));
		const newX = ORBIT_TARGET.x + orbitDistance * Math.sin(currentTheta) * Math.cos(currentPhi);
		const newY = ORBIT_TARGET.y + orbitDistance * Math.sin(currentPhi);
		const newZ = ORBIT_TARGET.z + orbitDistance * Math.cos(currentTheta) * Math.cos(currentPhi);
		const camera = renderer.scene.camera;
		camera.position.x = newX;
		camera.position.y = newY;
		camera.position.z = newZ;
		camera.target = ORBIT_TARGET;
		const actualDistance = camera.position.subtract(ORBIT_TARGET).length();
		if (Math.abs(actualDistance - orbitDistance) > 0.001) {
			console.warn(`Distance drift detected! Expected: ${orbitDistance.toFixed(3)}, Actual: ${actualDistance.toFixed(3)}`);
		}
	});

	document.addEventListener('keyup', (e, k) => {
		lastTime = 0;
	});

	document.addEventListener('keydown', (e) => {
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
				break;
			case 'ArrowRight':
				renderer.scene.camera.position = renderer.scene.camera.position.add(vRight);
				renderer.scene.camera.target = renderer.scene.camera.target.add(vRight);
				break;
			case 'w':
				renderer.scene.camera.position = renderer.scene.camera.position.add(vForward);
				setTimeout(() => { updateOrbitDistance(renderer); }, 10);
				break;
			case 's':
				renderer.scene.camera.position = renderer.scene.camera.position.subtract(vForward);
				setTimeout(() => { updateOrbitDistance(renderer); }, 10);
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
	});
}

// Zoom system
let targetZoomDistance = null;
let isZooming = false;
let zoomAnimationId = null;

function initializeZoomSystem() {
	if (orbitDistance !== null) {
		targetZoomDistance = orbitDistance;
	}
}

function smoothZoomUpdate(renderer) {
	if (!isZooming || targetZoomDistance === null || orbitDistance === null) {
		return;
	}
	const camera = renderer.scene.camera;
	const zoomLerpSpeed = 0.15;
	const threshold = 0.01;
	const distanceDiff = targetZoomDistance - orbitDistance;

	if (Math.abs(distanceDiff) < threshold) {
		orbitDistance = targetZoomDistance;
		isZooming = false;
		console.log(`Smooth zoom complete - Distance: ${orbitDistance.toFixed(3)}`);
		return;
	}

	orbitDistance += distanceDiff * zoomLerpSpeed;
	const currentDirection = camera.position.subtract(ORBIT_TARGET).normalize();
	const newPosition = ORBIT_TARGET.add(currentDirection.multiply(orbitDistance));
	camera.position = newPosition;
	zoomAnimationId = requestAnimationFrame(() => smoothZoomUpdate(renderer));
}

function setupZoomHandler(renderer) {

	document.addEventListener('wheel', (e) => {
		e.preventDefault();
		if (targetZoomDistance === null) {
			initializeZoomSystem();
		}
		const zoomSpeed = 0.8;
		const zoomAcceleration = 0.05;
		const wheelDelta = Math.abs(e.deltaY);
		const acceleratedSpeed = zoomSpeed + (wheelDelta * zoomAcceleration);
		let zoomAmount;
		if (e.deltaY < 0) {
			zoomAmount = -acceleratedSpeed;
		} else {
			zoomAmount = acceleratedSpeed;
		}
		targetZoomDistance += zoomAmount;
		const minDistance = 0.01;
		const maxDistance = 50.0;
		targetZoomDistance = Math.max(minDistance, Math.min(maxDistance, targetZoomDistance));
		if (!isZooming) {
			isZooming = true;
			smoothZoomUpdate(renderer);
		}
		console.log(`Wheel zoom target: ${targetZoomDistance.toFixed(3)}`);
	});

}

export {
	isLocalHost,
	urls,
	setupCanvas,
	ui_toggle_object,
	ui_add_object,
	initializeOrbitSystem,
	updateOrbitDistance,
	setupEventHandlers,
	setupZoomHandler
};
