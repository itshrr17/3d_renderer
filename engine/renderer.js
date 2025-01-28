import {
    Vector,
    Matrix4x4,
    Triangle,
    IdentityMatrix4x4,
    ProjectionMatrix,
    RotationMatrixX,
    RotationMatrixY,
    Object3d,
} from './ds.js'
import utils from './utils.js'

class Renderer {
    /**
     * @type {CanvasRenderingContext2D | null} ctx
     * @type {HTMLCanvasElement | null} canvas
     */
    
    ctx;
    canvas;
    req;
    fps = 90;
    /**
     * @type {{
     *  objects: Object3d[],
     *  light: {
     *      position: Vector
     *  },
     *  camera: {
     *      up: Vector,
     *      position: Vector,
     *      target: Vector,
     *      rotation: Vector,
     *  }
     * }} scene
     */
    scene = {
        objects: [],
        light: {
            position: new Vector(0, 2, -1),
        },
        camera: {
            up: new Vector(0, 1, 0),
            position: new Vector(0, 2, -10),
            rotation: new Vector(0, 0, 0),
            target: new Vector(0, 0, 0),
        },
    }
    worldMatrix = new IdentityMatrix4x4();
    lastTime = 0;
    deltaTime = 0;

    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.width = config.width || canvas.width;
        this.height = config.height || canvas.height;
        this.znear = config.znear || 0.1;
        this.zfar = config.zfar || 1000;
        this.fov = config.fov || 45;
        
        this.aspectRatio = this.height / this.width;
        this.fovRad = utils.toRad(this.fov);

        this.projectionMatrix = new ProjectionMatrix(this.fovRad, this.aspectRatio, this.znear, this.zfar);
        window.scene = this.scene
    }

    hasObject(object) {
        return this.scene.objects.includes(object)
    }

    addObject(object) {
        this.scene.objects.push(object);
    }

    removeObject(object) {
        this.scene.objects = this.scene.objects.filter(obj => obj != object);
    }

    /**
     * @param {Triangle} tri 
     */
    drawPolygon(tri, options = {
        fillColor: "rgb(20, 20, 20)",
        strokeColor: "rgb(0, 0, 0)"
    }) {
        // draw lines
        this.ctx.beginPath();
        this.ctx.lineTo(tri[0].x, tri[0].y);
        this.ctx.lineTo(tri[1].x, tri[1].y);
        this.ctx.lineTo(tri[2].x, tri[2].y);
        this.ctx.closePath();

        // color
        this.ctx.fillStyle = options.fillColor;
        this.ctx.fill();
        this.ctx.strokeStyle = options.strokeColor;
        this.ctx.stroke();
    }
    
    /**
     * 
     * @param {Vector} position 
     * @param {Vector} target 
     * @param {Vector} up 
     * @returns {Matrix4x4}
     */
    pointAt(position, target, up) {
        // forward vector
        const forward = target.subtract(position).normalize();

        // calculate new up
        const a = forward.multiply(up.dot(forward));
        const newUp = up.subtract(a).normalize();

        const newRight = newUp.cross(forward);

        // right vector
        // const right = up.cross(forward);
        // const newUp = forward.cross(right).normalize();
        
        // const newRight = newUp.cross(forward);

        const mat = new Matrix4x4();

        mat.m = [
            [newRight.x, newRight.y, newRight.z, 0],
            [newUp.x,    newUp.y,    newUp.z,    0],
            [forward.x,  forward.y,  forward.z,  0],
            [position.x, position.y, position.z, 1]
        ]

        return mat;
    }

    render(timeElapsed) {
        this.deltaTime = (timeElapsed - this.lastTime) / 1000;
        this.lastTime = timeElapsed;

        // clear screen
        this.ctx.clearRect(0, 0, this.width, this.height);

        // calculate camera matrix
        const camera = this.scene.camera;
        
        // Calculate forward vector (direction from camera to target)
        const forward = camera.target.subtract(camera.position).normalize();
        
        // Apply camera rotation to the forward vector
        const cameraRotX = new RotationMatrixX(camera.rotation.x);
        const cameraRotY = new RotationMatrixY(camera.rotation.y);
        
        // Rotate the forward vector using the rotation matrices
        const rotatedForward = cameraRotX
                                .multiply(cameraRotY)
                                .multiplyVector(forward);
        
        // Calculate the new target point the camera is looking at
        const target = camera.position.add(rotatedForward);
        
        // Compute the camera matrix using a proper pointAt function (position, target, up vector)
        const cameraMatrix = this.pointAt(camera.position, target, camera.up);
        
        // Invert the camera matrix to get the view matrix (quick_inverse is used for performance)
        const viewMatrix = cameraMatrix.quick_inverse();

        let polygons = [];

        this.scene.objects.forEach(obj => {
            obj.faces.forEach(face_config => {
                // mapping and applying transformations
                const face = face_config.map(idx => {
                    const vtx = obj.vertices[idx];
                    return this.worldMatrix
                        .multiply(obj.rotationMatrix.x)
                        .multiply(obj.rotationMatrix.y)
                        .multiply(obj.rotationMatrix.z)
                        .multiply(obj.translationMatrix)
                        .multiplyVector(vtx);
                })
    
                const lineA = face[1].subtract(face[0]);
                const lineB = face[2].subtract(face[0]);
    
                const face_normal = lineA.cross(lineB).normalize();
    
                const cameraRay = face[0].subtract(camera.position);
                // if camera ray is aligned with normal, triangle is visible
                if(face_normal.dot(cameraRay) < 0) {
                    // convert world space to view space
                    const projected_face = face.map(v => {
                        v = viewMatrix.multiplyVector(v) // world space to view space
                        v = this.projectionMatrix.multiplyVector(v);
                        v = v.divide(v.w) // scaling into view
                        v = v.multiplyVector(new Vector(-1, -1, -1)) // x and y are inverted, invert again
                        v = v.add(new Vector(1, 1, 0)) // to visible normalised screen space
                        v = v.multiplyVector(new Vector(0.5 * this.width, 0.5 * this.height, 1, 1));
                        return v;
                    })
    
                    // setting light intensity
                    const light_direction = this.scene.light.position.normalize();
                    // measure alignment of face normal and light direction
                    const alignment = light_direction.dot(face_normal);
                    face.light_intensity = ((alignment + 1) / 2) * 230;
                    // set light intensity for this face
                    projected_face.light_intensity = ((alignment + 1) / 2) * 230; 
    
                    polygons.push(projected_face);
                }
            })
        })

        // sort faces from back to front
        polygons = polygons.sort((f1, f2) => {
            const z1 = (f1[0].z + f1[1].z + f1[2].z) / 3;
            const z2 = (f2[0].z + f2[1].z + f2[2].z) / 3;
            return z1 - z2
        })

        // time to draw
        polygons.forEach(face => {
            this.drawPolygon(face, {
                fillColor: `rgb(${face.light_intensity}, ${face.light_intensity}, ${face.light_intensity})`,
                strokeColor: `rgb(${face.light_intensity}, ${face.light_intensity}, ${face.light_intensity})`
            })
        })
    }

    renderLoop = (timeElapsed) => {
        this.render(timeElapsed);

        setTimeout(() => {
            this.req = requestAnimationFrame(this.renderLoop);
        }, 1000 / this.fps);
    };

    start() {
        if(!this.req) this.renderLoop();
    }

    stop() {
        if(this.req) cancelAnimationFrame(this.req);
    }
}

export default Renderer;