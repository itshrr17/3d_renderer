// Renderer class refactored from engine/renderer.js
import Vector from '../math/vector.js';
import { Matrix4x4, IdentityMatrix4x4, ProjectionMatrix, RotationMatrixX, RotationMatrixY } from '../math/matrix.js';
import utils from '../utils/utils.js';

class Renderer {
    ctx;
    canvas;
    req;
    fps = 90;
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
        window.scene = this.scene;
    }

    hasObject(object) {
        return this.scene.objects.includes(object);
    }

    addObject(object) {
        this.scene.objects.push(object);
    }

    removeObject(object) {
        this.scene.objects = this.scene.objects.filter(obj => obj != object);
    }

    drawPolygon(tri, options = {
        fillColor: "rgb(20, 20, 20)",
        strokeColor: "rgb(0, 0, 0)"
    }) {
        this.ctx.beginPath();
        this.ctx.lineTo(tri[0].x, tri[0].y);
        this.ctx.lineTo(tri[1].x, tri[1].y);
        this.ctx.lineTo(tri[2].x, tri[2].y);
        this.ctx.closePath();
        this.ctx.fillStyle = options.fillColor;
        this.ctx.fill();
        this.ctx.strokeStyle = options.strokeColor;
        this.ctx.stroke();
    }

    pointAt(position, target, up) {
        const forward = target.subtract(position).normalize();
        const a = forward.multiply(up.dot(forward));
        const newUp = up.subtract(a).normalize();
        const newRight = newUp.cross(forward);
        const mat = new Matrix4x4();
        mat.m = [
            [newRight.x, newRight.y, newRight.z, 0],
            [newUp.x,    newUp.y,    newUp.z,    0],
            [forward.x,  forward.y,  forward.z,  0],
            [position.x, position.y, position.z, 1]
        ];
        return mat;
    }

    render(timeElapsed) {
        this.deltaTime = (timeElapsed - this.lastTime) / 1000;
        this.lastTime = timeElapsed;
        this.ctx.clearRect(0, 0, this.width, this.height);
        const camera = this.scene.camera;
        const forward = camera.target.subtract(camera.position).normalize();
        const cameraRotX = new RotationMatrixX(camera.rotation.x);
        const cameraRotY = new RotationMatrixY(camera.rotation.y);
        const rotatedForward = cameraRotX.multiply(cameraRotY).multiplyVector(forward);
        const target = camera.position.add(rotatedForward);
        const cameraMatrix = this.pointAt(camera.position, target, camera.up);
        const viewMatrix = cameraMatrix.quick_inverse();
        let polygons = [];
        this.scene.objects.forEach(obj => {
            obj.faces.forEach(face_config => {
                const face = face_config.map(idx => {
                    const vtx = obj.vertices[idx];
                    return this.worldMatrix
                        .multiply(obj.rotationMatrix.x)
                        .multiply(obj.rotationMatrix.y)
                        .multiply(obj.rotationMatrix.z)
                        .multiply(obj.translationMatrix)
                        .multiplyVector(vtx);
                });
                const lineA = face[1].subtract(face[0]);
                const lineB = face[2].subtract(face[0]);
                const face_normal = lineA.cross(lineB).normalize();
                const cameraRay = face[0].subtract(camera.position);
                if(face_normal.dot(cameraRay) < 0) {
                    const projected_face = face.map(v => {
                        v = viewMatrix.multiplyVector(v);
                        v = this.projectionMatrix.multiplyVector(v);
                        v = v.divide(v.w);
                        v = v.multiplyVector(new Vector(-1, -1, -1));
                        v = v.add(new Vector(1, 1, 0));
                        v = v.multiplyVector(new Vector(0.5 * this.width, 0.5 * this.height, 1, 1));
                        return v;
                    });
                    const light_direction = this.scene.light.position.normalize();
                    const alignment = light_direction.dot(face_normal);
                    face.light_intensity = ((alignment + 1) / 2) * 230;
                    projected_face.light_intensity = ((alignment + 1) / 2) * 230;
                    polygons.push(projected_face);
                }
            });
        });
        polygons = polygons.sort((f1, f2) => {
            const z1 = (f1[0].z + f1[1].z + f1[2].z) / 3;
            const z2 = (f2[0].z + f2[1].z + f2[2].z) / 3;
            return z1 - z2;
        });
        polygons.forEach(face => {
            this.drawPolygon(face, {
                fillColor: `rgb(${face.light_intensity}, ${face.light_intensity}, ${face.light_intensity})`,
                strokeColor: `rgb(${face.light_intensity}, ${face.light_intensity}, ${face.light_intensity})`
            });
        });
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
