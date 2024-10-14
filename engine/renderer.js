import {
    Vector,
    Matrix4x4,
    Triangle,
    IdentityMatrix4x4,
    ProjectionMatrix,
    RotationMatrixX,
    RotationMatrixY,
    RotationMatrixZ,
    Object3d,
    TranslationMatrix
} from './ds.js'
import utils from './utils.js'

class Renderer {
    /**
     * @type {CanvasRenderingContext2D | null} ctx
     * @type {HTMLCanvasElement | null} canvas
     */
    
    ctx;
    canvas;
    ref;
    fps = 30;
    /**
     * @type {{
     *  objects: Object3d[],
     *  light: {
     *      position: Vector
     *  },
     *  camera: {
     *      position: Vector,
     *      lookAt: Vector,
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
            position: new Vector(0, 0, -10),
            lookAt: new Vector(0, 0, 1),
            rotation: new Vector(0, 0.8, 0),
        },
    }

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

        // // right vector
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

    render() {
        // clear screen
        this.ctx.clearRect(0, 0, this.width, this.height);

        const camera = this.scene.camera;

        const up = new Vector(0, 1, 0);
        let target = new Vector(0, 0, 1);
        const cameraRotY = new RotationMatrixY(camera.rotation.y);
        camera.lookAt = cameraRotY.multiplyVector(target);
        target = camera.position.add(camera.lookAt);
        const cameraMatrix = this.pointAt(camera.position, target, up); // cameraMatrix

        // viewMatrix
        const viewMatrix = cameraMatrix.quick_inverse();

        this.scene.objects.forEach(obj => {
            const rotXMat = new RotationMatrixX(obj.rotation.x);
            const rotYMat = new RotationMatrixY(obj.rotation.y);
            const rotZMat = new RotationMatrixZ(obj.rotation.z);
            const transMat = new TranslationMatrix(obj.position.x, obj.position.y, obj.position.z);

            const worldMat = new IdentityMatrix4x4()
                                .multiply(rotXMat)
                                .multiply(rotYMat)
                                .multiply(rotZMat)
                                .multiply(transMat);

            let faces_to_draw = [];

            obj.faces.forEach(face_config => {
                const face = face_config.map(idx => {
                    const vtx = obj.vertices[idx];
                    return worldMat.multiplyVector(vtx);
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

                    faces_to_draw.push(projected_face);
                }

                // sort faces from back to front
                faces_to_draw = faces_to_draw.sort((f1, f2) => {
                    const az = (f1[0].z + f1[1].z + f1[2].z) / 3;
                    const bz = (f2[0].z + f2[1].z + f2[2].z) / 3;
                    return bz - az
                })

                // time to draw
                faces_to_draw.forEach(face => {
                    this.drawPolygon(face, {
                        fillColor: `rgb(${face.light_intensity}, ${face.light_intensity}, ${face.light_intensity})`,
                        strokeColor: `rgb(${face.light_intensity}, ${face.light_intensity}, ${face.light_intensity})`
                    })
                })
            })
        })
    }

    start() {
        // this.render()
        const fn = this.render.bind(this);
        this.ref = setInterval(fn, 1000 / this.fps);
    }

    stop() {
        clearInterval(this.ref);
    }
}

export default Renderer;