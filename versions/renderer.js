const Renderer = {
    rendering: false,
    scene: {
        camera: {
            position: [0, 0, 0],
        },
        light: {
            position: [0, 0, -2],
        },
        objects: [],
        addObject(obj) {
            this.objects.push(obj)
        },
        removeObject() {
            // tbd
        }
    }
};

Renderer.init = function init(canvas, config = {
    width: null,
    height: null,
    znear: 1,
    zfar: 1000,
    fov: 90 // degree
}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = config.width || canvas.width;
    this.height = config.height || canvas.height;
    this.znear = config.znear;
    this.zfar = config.zfar;
    this.fov = config.fov;

    this._aspectRatio = this.height / this.width;
    this._fovRad = (this.fov / 180) * Math.PI; // radians
    this._f = 1 / Math.tan(this._fovRad / 2);
    this._q = this.zfar / (this.zfar - this.znear);
}

/**
 * @param {[[]]} vector 
 * @param {[[]]} matrix 
 * @returns [[]]
 */
Renderer._multiplyMatrix = function multiplyMatrix(vector, matrix) {
    const output = [0, 0, 0, 0]

    output[0] = vector[0] * matrix[0][0] + vector[1] * matrix[1][0] + vector[2] * matrix[2][0] + matrix[3][0]
    output[1] = vector[0] * matrix[0][1] + vector[1] * matrix[1][1] + vector[2] * matrix[2][1] + matrix[3][1]
    output[2] = vector[0] * matrix[0][2] + vector[1] * matrix[1][2] + vector[2] * matrix[2][2] + matrix[3][2]

    const w = (vector[0] * matrix[0][3]) + (vector[1] * matrix[1][3]) + vector[2] * matrix[2][3] + matrix[3][3];

    if(w != 0) { // from 4D to 3D by dividing x and y by w, w is original z btw
        output[0] = output[0] / w;
        output[1] = output[1] / w;
        output[2] = output[2] / w;
    }

    return output;
}

Renderer._translate = function (vtx, position) {
    // taken camera position into account
    return [
        vtx[0] + position[0],// - this.scene.camera.position[0],
        vtx[1] + position[1],// - this.scene.camera.position[1],
        vtx[2] + position[2] // - this.scene.camera.position[2]
    ];
}

Renderer._rotateX = function rotateX(vtx, angle) {
    if(angle == 0) return vtx;

    const rad = (angle / 180) * Math.PI;
    const rotMatrixX = [
        [1, 0, 0, 0],
        [0, Math.cos(rad), -Math.sin(rad), 0],
        [0, Math.sin(rad), Math.cos(rad), 0],
        [0, 0, 0, 1]
    ]

    return this._multiplyMatrix(vtx, rotMatrixX);
}

Renderer._rotateY = function rotateY(vtx, angle) {
    if(angle == 0) return vtx;

    const rad = (angle / 180) * Math.PI;
    const rotMatrixX = [
        [Math.cos(rad), 0, Math.sin(rad), 0],
        [0, 1, 0, 0],
        [-Math.sin(rad), 0, Math.cos(rad), 0],
        [0, 0, 0, 1]
    ]

    return this._multiplyMatrix(vtx, rotMatrixX);
}

Renderer._rotateZ = function rotateZ(vtx, angle) {
    if(angle == 0) return vtx;

    const rad = (angle / 180) * Math.PI;
    const rotMatrixX = [
        [Math.cos(rad), -Math.sin(rad), 0, 0],
        [Math.sin(rad), Math.cos(rad), 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ]

    return this._multiplyMatrix(vtx, rotMatrixX);
}

Renderer._scaleVertex = function scaleVertex(vtx) {
    vtx[0] += 1;
    vtx[1] += 1;

    vtx[0] *= 0.5 * this.width;
    vtx[1] *= 0.5 * this.height;
    return vtx
}

Renderer._computeProjectionMatrix = function computeProjectionMatrix() {
    const a = this._aspectRatio * this._f;
    const b = this._f;
    const c = this._q
    const d = -this.znear * this._q;

    const projectionMatrix = [
        [a, 0, 0, 0],
        [0, b, 0, 0],
        [0, 0, c, 1],
        [0, 0, d, 0]
    ]

    return projectionMatrix;
}

Renderer._drawPolygon = function drawPolygon(vertices, options = {
    fillStyle: "rgb(20, 20, 20)",
    strokeStyle: "rgb(0, 0, 0)"
}) {
    this.ctx.beginPath();
    for(const [x, y] of vertices) this.ctx.lineTo(x, y);
    this.ctx.closePath();
    this.ctx.fillStyle = options.fillStyle;
    this.ctx.fill()
    this.ctx.strokeStyle = options.strokeStyle;
    this.ctx.stroke();
}

Renderer._dotProduct = function dotProduct(vtx1, vtx2) {
    return (
        vtx1[0] * vtx2[0] +
        vtx1[1] * vtx2[1] +
        vtx1[2] * vtx2[2]
    )
}

Renderer.render = function render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    projectionMatrix = this._computeProjectionMatrix();

    this.scene.objects.forEach(obj => {
        const transformedVertices = obj.vertices.map(vtx => {
            vtx = this._rotateX(vtx, obj.rotation[0]);
            vtx = this._rotateY(vtx, obj.rotation[1]);
            vtx = this._rotateZ(vtx, obj.rotation[2]);
            vtx = this._translate(vtx, obj.position);
            return vtx;
        })

        let faces_to_draw = [];

        obj.faces.forEach(face => {
            const f = face.map(idx => transformedVertices[idx])

            // let's find normals of each face,
            // if normal's z < 0, we render the face otherwise not
            
            const lineA = [
                f[1][0] - f[0][0], 
                f[1][1] - f[0][1], 
                f[1][2] - f[0][2]
            ];

            const lineB = [
                f[2][0] - f[0][0], 
                f[2][1] - f[0][1], 
                f[2][2] - f[0][2]
            ];

            // cross product
            const x = lineA[1] * lineB[2] - lineA[2] * lineB[1];
            const y = lineA[2] * lineB[0] - lineA[0] * lineB[2];
            const z = lineA[0] * lineB[1] - lineA[1] * lineB[0];

            // normalize normal
            const length = Math.sqrt(x * x + y * y + z * z);
            const normal = [x / length, y / length, z / length];

            // debug normal
            // const face_center = [
            //     (f[0][0] + f[1][0] + f[2][0]) / 3,
            //     (f[0][1] + f[1][1] + f[2][1]) / 3,
            //     (f[0][2] + f[1][2] + f[2][2]) / 3
            // ];
            
            // const normal_end = [
            //     face_center[0] + normal[0] * 0.1,  // 0.1 is just to scale the normal
            //     face_center[1] + normal[1] * 0.1,
            //     face_center[2] + normal[2] * 0.1
            // ];

            // const scaled_center = this._scaleVertex(this._multiplyMatrix(face_center, projectionMatrix));
            // const scaled_normal_end = this._scaleVertex(this._multiplyMatrix(normal_end, projectionMatrix));

            // this.ctx.beginPath();
            // this.ctx.moveTo(scaled_center[0], scaled_center[1]);
            // this.ctx.lineTo(scaled_normal_end[0], scaled_normal_end[1]);
            // this.ctx.strokeStyle = "red"; // To differentiate from face color
            // this.ctx.stroke();

            if(this._dotProduct(normal, f[0]) < 0) {
                const light_length = Math.sqrt(
                    this.scene.light.position[0] * this.scene.light.position[0] +
                    this.scene.light.position[1] * this.scene.light.position[1] +
                    this.scene.light.position[2] * this.scene.light.position[2]
                )

                const light_normalized = [
                    this.scene.light.position[0] / light_length,
                    this.scene.light.position[1] / light_length,
                    this.scene.light.position[2] / light_length,
                ]

                const dp = this._dotProduct(normal, light_normalized)
                const color_intensity = ((dp + 1) / 2) * 230;

                f.color_intensity = color_intensity;

                const pface = f.map(v => {
                    const temp = this._multiplyMatrix(v, projectionMatrix)
                    return this._scaleVertex(temp);
                })

                pface.color_intensity = color_intensity;
                faces_to_draw.push(pface);
            }
        })

        // sort faces from back to front
        faces_to_draw = faces_to_draw.sort((f1, f2) => {
            const az = (f1[0][2] + f1[1][2] + f1[2][2]) / 3;
            const bz = (f2[0][2] + f2[1][2] + f2[2][2]) / 3;
            return bz - az
        })

        // draw
        faces_to_draw.forEach(face => {
            this._drawPolygon(face, {
                fillStyle: `rgb(${face.color_intensity}, ${face.color_intensity}, ${face.color_intensity})`,
                strokeStyle: `rgb(${face.color_intensity}, ${face.color_intensity}, ${face.color_intensity})`
            });
        })
    })
}

Renderer.start = function start() {
    this.rendering = true;

    setInterval(() => {
        this.render();
    }, 1000 / 60)
};

Renderer.stop = function stop() {
    this.rendering = false;
};