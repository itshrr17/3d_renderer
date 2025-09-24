
// ===============================
// 3D Renderer: Main Engine Class
// ===============================
// This class is responsible for drawing 3D objects onto a 2D canvas using basic math and matrix operations.
// It handles the camera, projection, lighting, and the main render loop.

import Vector from '../math/vector.js';
import { Matrix4x4, IdentityMatrix4x4, ProjectionMatrix, RotationMatrixX, RotationMatrixY } from '../math/matrix.js';
import utils from '../utils/utils.js';

class Renderer {
    // The 2D drawing context for the canvas
    ctx;
    // The HTML canvas element
    canvas;
    // Animation frame request ID
    req;
    // Target frames per second for rendering
    fps = 90;

    // The scene contains all objects, the camera, and the light
    scene = {
        objects: [], // Array of 3D objects to render
        light: {
            position: new Vector(0, 2, -1), // Simple directional light
        },
        camera: {
            up: new Vector(0, 1, 0), // Which way is 'up' for the camera
            position: new Vector(0, 2, -10), // Camera position in 3D space
            rotation: new Vector(0, 0, 0), // Camera rotation (Euler angles)
            target: new Vector(0, 0, 0), // What the camera is looking at
        },
    }

    // The world matrix is used for global transformations (not used much here)
    worldMatrix = new IdentityMatrix4x4();
    lastTime = 0; // For animation timing
    deltaTime = 0; // Time between frames

    /**
     * Create a new Renderer.
     * @param {HTMLCanvasElement} canvas - The canvas to draw on.
     * @param {Object} config - Optional configuration (width, height, fov, etc).
     */
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.width = config.width || canvas.width;
        this.height = config.height || canvas.height;
        this.znear = config.znear || 0.1; // Near clipping plane
        this.zfar = config.zfar || 1000; // Far clipping plane
        this.fov = config.fov || 45; // Field of view (degrees)
        this.aspectRatio = this.height / this.width;
        this.fovRad = utils.toRad(this.fov); // Convert FOV to radians
        // The projection matrix transforms 3D points into 2D screen space
        this.projectionMatrix = new ProjectionMatrix(this.fovRad, this.aspectRatio, this.znear, this.zfar);
        window.scene = this.scene; // For debugging in browser
    }

    /**
     * Check if an object is already in the scene.
     * @param {Object3d} object
     * @returns {boolean}
     */
    hasObject(object) {
        return this.scene.objects.includes(object);
    }

    /**
     * Add a 3D object to the scene.
     * @param {Object3d} object
     */
    addObject(object) {
        this.scene.objects.push(object);
    }

    /**
     * Remove a 3D object from the scene.
     * @param {Object3d} object
     */
    removeObject(object) {
        this.scene.objects = this.scene.objects.filter(obj => obj != object);
    }

    /**
     * Draw a single triangle (polygon) on the canvas.
     * @param {Array<Vector>} tri - Array of 3 vertices (screen space)
     * @param {Object} options - Fill and stroke color
     */
    drawPolygon(tri, options = {
        fillColor: "rgb(20, 20, 20)",
        strokeColor: "rgb(0, 0, 0)"
    }) {
        // Move to the first vertex, then draw lines to the next two, and close the path
        this.ctx.beginPath();
        this.ctx.lineTo(tri[0].x, tri[0].y);
        this.ctx.lineTo(tri[1].x, tri[1].y);
        this.ctx.lineTo(tri[2].x, tri[2].y);
        this.ctx.closePath();
        // Fill and stroke the triangle
        this.ctx.fillStyle = options.fillColor;
        this.ctx.fill();
        this.ctx.strokeStyle = options.strokeColor;
        this.ctx.stroke();
    }

    /**
     * Build a camera "look at" matrix.
     * This creates a matrix that orients the camera to look from 'position' to 'target', with 'up' as the up direction.
     * @param {Vector} position - Camera position
     * @param {Vector} target - Point to look at
     * @param {Vector} up - Up direction
     * @returns {Matrix4x4}
     */
    pointAt(position, target, up) {
        // Calculate the forward direction (from position to target)
        const forward = target.subtract(position).normalize();
        // Remove any component of 'up' that is in the direction of 'forward'
        const a = forward.multiply(up.dot(forward));
        const newUp = up.subtract(a).normalize();
        // The right vector is perpendicular to up and forward
        const newRight = newUp.cross(forward);
        // Build the matrix
        const mat = new Matrix4x4();
        mat.m = [
            [newRight.x, newRight.y, newRight.z, 0],
            [newUp.x,    newUp.y,    newUp.z,    0],
            [forward.x,  forward.y,  forward.z,  0],
            [position.x, position.y, position.z, 1]
        ];
        return mat;
    }

    /**
     * Main render function. Projects all 3D objects in the scene to 2D and draws them.
     * @param {number} timeElapsed - Current time (for animation)
     */
    render(timeElapsed) {
        // Calculate time since last frame (for smooth animation)
        this.deltaTime = (timeElapsed - this.lastTime) / 1000;
        this.lastTime = timeElapsed;
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // === CAMERA SETUP ===
        // Get the camera from the scene
        const camera = this.scene.camera;
        // Calculate the direction the camera is looking (target - position)
        const forward = camera.target.subtract(camera.position).normalize();
        // Apply camera rotation (Euler angles)
        const cameraRotX = new RotationMatrixX(camera.rotation.x);
        const cameraRotY = new RotationMatrixY(camera.rotation.y);
        // Rotate the forward vector
        const rotatedForward = cameraRotX.multiply(cameraRotY).multiplyVector(forward);
        // The new target point after rotation
        const target = camera.position.add(rotatedForward);
        // Build the camera matrix (look-at)
        const cameraMatrix = this.pointAt(camera.position, target, camera.up);
        // Invert the camera matrix to get the view matrix (moves world so camera is at origin)
        const viewMatrix = cameraMatrix.quick_inverse();

        // === RENDER ALL OBJECTS ===
        let polygons = [];
        // For each object in the scene
        this.scene.objects.forEach(obj => {
            // For each face (triangle) of the object
            obj.faces.forEach(face_config => {
                // Transform each vertex of the face from object space to world space
                const face = face_config.map(idx => {
                    const vtx = obj.vertices[idx];
                    // Apply world, rotation, and translation matrices
                    return this.worldMatrix
                        .multiply(obj.rotationMatrix.x)
                        .multiply(obj.rotationMatrix.y)
                        .multiply(obj.rotationMatrix.z)
                        .multiply(obj.translationMatrix)
                        .multiplyVector(vtx);
                });
                // Calculate the normal vector of the face (for backface culling and lighting)
                const lineA = face[1].subtract(face[0]);
                const lineB = face[2].subtract(face[0]);
                const face_normal = lineA.cross(lineB).normalize();
                // Vector from camera to the face
                const cameraRay = face[0].subtract(camera.position);
                // Only draw faces that are facing the camera (backface culling)
                if(face_normal.dot(cameraRay) < 0) {
                    // === PROJECT TO 2D ===
                    const projected_face = face.map(v => {
                        // Transform from world to camera (view) space
                        v = viewMatrix.multiplyVector(v);
                        // Project from 3D to 2D using the projection matrix
                        v = this.projectionMatrix.multiplyVector(v);
                        // Perspective divide (normalize by w)
                        v = v.divide(v.w);
                        // Flip x and y (screen space adjustment)
                        v = v.multiplyVector(new Vector(-1, -1, -1));
                        // Move to normalized screen space (0 to 1)
                        v = v.add(new Vector(1, 1, 0));
                        // Scale to actual canvas size
                        v = v.multiplyVector(new Vector(0.5 * this.width, 0.5 * this.height, 1, 1));
                        return v;
                    });
                    // === LIGHTING ===
                    // Simple directional lighting: brightness depends on angle between face and light
                    const light_direction = this.scene.light.position.normalize();
                    const alignment = light_direction.dot(face_normal);
                    face.light_intensity = ((alignment + 1) / 2) * 230; // 0-230 brightness
                    projected_face.light_intensity = ((alignment + 1) / 2) * 230;
                    polygons.push(projected_face);
                }
            });
        });

        // Sort faces from back to front (painter's algorithm)
        polygons = polygons.sort((f1, f2) => {
            const z1 = (f1[0].z + f1[1].z + f1[2].z) / 3;
            const z2 = (f2[0].z + f2[1].z + f2[2].z) / 3;
            return z1 - z2;
        });

        // Draw all faces
        polygons.forEach(face => {
            this.drawPolygon(face, {
                fillColor: `rgb(${face.light_intensity}, ${face.light_intensity}, ${face.light_intensity})`,
                strokeColor: `rgb(${face.light_intensity}, ${face.light_intensity}, ${face.light_intensity})`
            });
        });
    }

    /**
     * The main animation loop. Calls render() repeatedly.
     * @param {number} timeElapsed
     */
    renderLoop = (timeElapsed) => {
        this.render(timeElapsed);
        setTimeout(() => {
            this.req = requestAnimationFrame(this.renderLoop);
        }, 1000 / this.fps);
    };

    /**
     * Start the render loop.
     */
    start() {
        if(!this.req) this.renderLoop();
    }

    /**
     * Stop the render loop.
     */
    stop() {
        if(this.req) cancelAnimationFrame(this.req);
    }
}

export default Renderer;
