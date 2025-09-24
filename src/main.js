
import Renderer from './engine/renderer.js';
import Object3d from './engine/object3d.js';
import {
	isLocalHost,
	urls,
	setupCanvas,
	ui_add_object,
	initializeOrbitSystem,
	setupEventHandlers,
	setupZoomHandler
} from './ui/ui.js';

// Setup canvas and renderer
const canvas = setupCanvas();
const renderer = new Renderer(canvas);

// Add models-list container if not present
if (!document.getElementById('models-list')) {
	const modelsList = document.createElement('div');
	modelsList.id = 'models-list';
	document.body.appendChild(modelsList);
}

// Load teapot
const teapot = new Object3d();
teapot.loadFromObjFile(isLocalHost() ? urls.local.teapot : urls.git.teapot)
	.then(() => {
		teapot.setPosition(0, -2, 0);
		renderer.addObject(teapot);
		renderer.start();
		ui_add_object(teapot, renderer);
	});

// Load cube
const cube = new Object3d();
cube.loadFromObjFile(isLocalHost() ? urls.local.cube : urls.git.cube)
	.then(() => {
		ui_add_object(cube, renderer, false);
	});

// Setup orbit and zoom systems
setTimeout(() => initializeOrbitSystem(renderer), 100);
setupEventHandlers(renderer);
setupZoomHandler(renderer);
