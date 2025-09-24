
// ===============================
// UI and Controls for 3D Renderer
// ===============================
// This file provides all the UI logic and user controls for interacting with the 3D scene.
// It includes canvas setup, model toggling, camera orbit, zoom, and keyboard navigation.

import Renderer from '../engine/renderer.js';
import Object3d from '../engine/object3d.js';
import Vector from '../math/vector.js';

/**
 * Check if running on localhost (for loading local models).
 * @returns {boolean}
 */
function isLocalHost() {
	return location.hostname === "localhost" || location.hostname === "127.0.0.1";
}

// URLs for loading models (local and GitHub paths)
const urls = {
	local: {
		cube: "../models/cube.obj",
		teapot: "../models/teapot.obj"
	},
	git: {
		cube: "../3d_renderer/models/cube.obj",
		teapot: "../3d_renderer/models/teapot.obj"
	}
};

/**
 * Create and add a canvas to the page.
 * @param {number} width
 * @param {number} height
 * @returns {HTMLCanvasElement}
 */
function setupCanvas(width = window.innerWidth, height = window.innerHeight) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	document.body.append(canvas);
	return canvas;
}

/**
 * Toggle a 3D object on/off in the renderer using a checkbox.
 * @param {Object3d} object
 * @param {HTMLInputElement} ele
 * @param {Event} e
 * @param {Renderer} renderer
 */
function ui_toggle_object(object, ele, e, renderer) {
	if(renderer.hasObject(object)) {
		renderer.removeObject(object);
		ele.checked = false;
	} else {
		renderer.addObject(object);
		ele.checked = true;
	}
}

/**
 * Add a UI checkbox for a 3D object so the user can toggle its visibility.
 * @param {Object3d} object
 * @param {Renderer} renderer
 * @param {boolean} checked
 */
function ui_add_object(object, renderer, checked = true) {
	const name = object.name;
	const list = document.getElementById('models-list');
	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.checked = checked;
	checkbox.name = name;
	const text = document.createElement("span");
	text.innerText = name;
	const div = document.createElement("div");
	div.appendChild(checkbox);
	div.appendChild(text);
	list.appendChild(div);
	div.onclick = (e) => ui_toggle_object(object, checkbox, e, renderer);
}

// ===============================
// Camera Orbit and Controls
// ===============================

// The point the camera orbits around (center of the scene)
const ORBIT_TARGET = new Vector(0, 0, 0);
let orbitDistance = null; // Distance from camera to target
let currentTheta = 0;     // Horizontal angle (azimuth)
let currentPhi = 0;       // Vertical angle (elevation)

/**
 * Initialize the orbit system (calculate initial camera angles and distance).
 * @param {Renderer} renderer
 */
function initializeOrbitSystem(renderer) {
	const camera = renderer.scene.camera;
	const offset = camera.position.subtract(ORBIT_TARGET);
	orbitDistance = offset.length();
	currentTheta = Math.atan2(offset.x, offset.z);
	currentPhi = Math.asin(offset.y / orbitDistance);
	console.log(`Orbit initialized - Distance: ${orbitDistance.toFixed(3)}, Theta: ${currentTheta.toFixed(3)}, Phi: ${currentPhi.toFixed(3)}`);
}

/**
 * Update the orbit distance if the camera moves (for smooth zoom).
 * @param {Renderer} renderer
 */
function updateOrbitDistance(renderer) {
	const camera = renderer.scene.camera;
	const newDistance = camera.position.subtract(ORBIT_TARGET).length();
	if (Math.abs(newDistance - orbitDistance) > 0.1) {
		orbitDistance = newDistance;
		console.log(`Orbit distance updated to: ${orbitDistance.toFixed(3)}`);
	}
}

let lastTime = 0; // For smooth keyboard controls
let mousedown = false; // Track mouse state for orbit

/**
 * Set up all mouse and keyboard event handlers for camera control.
 * @param {Renderer} renderer
 */
function setupEventHandlers(renderer) {
	// Mouse drag to orbit camera
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
		// Clamp vertical angle to prevent flipping
		const maxVerticalAngle = Math.PI / 2 - 0.1;
		currentPhi = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, currentPhi));
		// Spherical coordinates to Cartesian
		const newX = ORBIT_TARGET.x + orbitDistance * Math.sin(currentTheta) * Math.cos(currentPhi);
		const newY = ORBIT_TARGET.y + orbitDistance * Math.sin(currentPhi);
		const newZ = ORBIT_TARGET.z + orbitDistance * Math.cos(currentTheta) * Math.cos(currentPhi);
		const camera = renderer.scene.camera;
		camera.position.x = newX;
		camera.position.y = newY;
		camera.position.z = newZ;
		camera.target = ORBIT_TARGET;
		// Debug: check if distance is preserved
		const actualDistance = camera.position.subtract(ORBIT_TARGET).length();
		if (Math.abs(actualDistance - orbitDistance) > 0.001) {
			console.warn(`Distance drift detected! Expected: ${orbitDistance.toFixed(3)}, Actual: ${actualDistance.toFixed(3)}`);
		}
	});
	// Keyboard controls for camera movement
	document.addEventListener('keyup', (e, k) => {
		lastTime = 0;
	});
	document.addEventListener('keydown', (e) => {
		const t = Date.now();
		if(!lastTime) lastTime = t;
		const deltaTime = ((t - lastTime) / 1000) || 0.2;
		const camera = renderer.scene.camera;
		// Forward/backward direction
		const vForward = camera.target.subtract(camera.position).normalize().multiply(0.5 * deltaTime);
		// Right direction (perpendicular to forward and up)
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

// ===============================
// Smooth Zoom System
// ===============================
let targetZoomDistance = null; // Where the zoom is heading
let isZooming = false;         // Is a zoom animation in progress?
let zoomAnimationId = null;    // Animation frame ID

/**
 * Initialize the zoom system (set target distance).
 */
function initializeZoomSystem() {
	if (orbitDistance !== null) {
		targetZoomDistance = orbitDistance;
	}
}

/**
 * Smoothly interpolate the camera's distance to the target (for mouse wheel zoom).
 * @param {Renderer} renderer
 */
function smoothZoomUpdate(renderer) {
	if (!isZooming || targetZoomDistance === null || orbitDistance === null) {
		return;
	}
	const camera = renderer.scene.camera;
	const zoomLerpSpeed = 0.15; // How fast to interpolate
	const threshold = 0.01;     // When to stop
	const distanceDiff = targetZoomDistance - orbitDistance;
	if (Math.abs(distanceDiff) < threshold) {
		orbitDistance = targetZoomDistance;
		isZooming = false;
		console.log(`Smooth zoom complete - Distance: ${orbitDistance.toFixed(3)}`);
		return;
	}
	orbitDistance += distanceDiff * zoomLerpSpeed;
	// Move camera along its current direction
	const currentDirection = camera.position.subtract(ORBIT_TARGET).normalize();
	const newPosition = ORBIT_TARGET.add(currentDirection.multiply(orbitDistance));
	camera.position = newPosition;
	zoomAnimationId = requestAnimationFrame(() => smoothZoomUpdate(renderer));
}

/**
 * Set up mouse wheel handler for smooth zooming.
 * @param {Renderer} renderer
 */
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
		// Clamp zoom distance
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
