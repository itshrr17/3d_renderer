import utils from "./utils.js";

class Vector {
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w
    }

    length() {
        return Math.sqrt(
            this.x * this.x +
            this.y * this.y +
            this.z * this.z
        );
    }

    normalize() {
        const l = this.length();
        return new Vector(
            this.x / l,
            this.y / l,
            this.z / l,
        )
    }

    /**
     * Add vector
     * @param {Vector} v 
     */
    add(v) {
        return new Vector(
            this.x + v.x,
            this.y + v.y,
            this.z + v.z,
        )
    }

    /**
     * Subtract vector
     * @param {Vector} v 
     */
    subtract(v) {
        return new Vector(
            this.x - v.x,
            this.y - v.y,
            this.z - v.z,
        )
    }

    /**
     * Multiply vector
     * @param {number} k
     */
    multiply(k) {
        return new Vector(
            this.x * k,
            this.y * k,
            this.z * k,
        )
    }

    /**
     * Multiply vector
     * @param {Vector} k
     */
    multiplyVector(v) {
        return new Vector(
            this.x * v.x,
            this.y * v.y,
            this.z * v.z,
        )
    }

    /**
     * Divide vector
     * @param {number} k
     */
    divide(k) {
        return new Vector(
            this.x / k,
            this.y / k,
            this.z / k,
        )
    }
    
    /**
     * Scale vector
     * @param {Vector} v 
     */
    scale(x, y, z) {
        return new Vector(
            this.x * (x ?? 1),
            this.y * (y ?? 1),
            this.z * (z ?? 1),
        )
    }

    /**
     * Dot Product
     * @param {Vector} v 
     */
    dot(v) {
        return (
            this.x * v.x +
            this.y * v.y +
            this.z * v.z
        )
    }

    /**
     * Cross Product
     * @param {Vector} v 
     */
    cross(v) {
        return new Vector(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        )
    }

    toArray() {
        return [this.x, this.y, this.z];
    }

    negate() {
        return new Vector(
            -this.y,
            -this.z,
            -this.x
        )
    }
}

class Triangle {
    constructor(v1, v2, v3) {
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
    }
}

class Matrix4x4 {
    constructor() {
        this.m = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];
    }

    /**
     * @param {Vector} v 
     */
    multiplyVector(v) {
        return new Vector(
            v.x * this.m[0][0] + v.y * this.m[1][0] + v.z * this.m[2][0] + v.w * this.m[3][0],
            v.x * this.m[0][1] + v.y * this.m[1][1] + v.z * this.m[2][1] + v.w * this.m[3][1],
            v.x * this.m[0][2] + v.y * this.m[1][2] + v.z * this.m[2][2] + v.w * this.m[3][2],
            v.x * this.m[0][3] + v.y * this.m[1][3] + v.z * this.m[2][3] + v.w * this.m[3][3]
        )
    }

    /**
     * @param {Matrix4x4} m 
     */
    multiply(m) {
        const new_m = new Matrix4x4();

        // for (int c = 0; c < 4; c++)
		// 	for (int r = 0; r < 4; r++)
		// 		matrix.m[r][c] = m1.m[r][0] * m2.m[0][c] +
        //                       m1.m[r][1] * m2.m[1][c] +
        //                       m1.m[r][2] * m2.m[2][c] +
        //                       m1.m[r][3] * m2.m[3][c];
		// return matrix;

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                new_m.m[j][i] = (
                    this.m[j][0] * m.m[0][i] +
                    this.m[j][1] * m.m[1][i] +
                    this.m[j][2] * m.m[2][i] +
                    this.m[j][3] * m.m[3][i]
                );
            }
        }

        return new_m;
    }

    /**
     * Only for Rotation/Translation Matrices
     */
    quick_inverse() {
        const newMat = new Matrix4x4();

        newMat.m[0][0] = this.m[0][0]; newMat.m[0][1] = this.m[1][0]; newMat.m[0][2] = this.m[2][0]; newMat.m[0][3] = 0;
		newMat.m[1][0] = this.m[0][1]; newMat.m[1][1] = this.m[1][1]; newMat.m[1][2] = this.m[2][1]; newMat.m[1][3] = 0;
		newMat.m[2][0] = this.m[0][2]; newMat.m[2][1] = this.m[1][2]; newMat.m[2][2] = this.m[2][2]; newMat.m[2][3] = 0;
		newMat.m[3][0] = -(this.m[3][0] * newMat.m[0][0] + this.m[3][1] * newMat.m[1][0] + this.m[3][2] * newMat.m[2][0]);
		newMat.m[3][1] = -(this.m[3][0] * newMat.m[0][1] + this.m[3][1] * newMat.m[1][1] + this.m[3][2] * newMat.m[2][1]);
		newMat.m[3][2] = -(this.m[3][0] * newMat.m[0][2] + this.m[3][1] * newMat.m[1][2] + this.m[3][2] * newMat.m[2][2]);
		newMat.m[3][3] = 1;

        return newMat;
    }
}

class IdentityMatrix4x4 extends Matrix4x4 {
    constructor() {
        super();
        this.m[0][0] = 1;
        this.m[1][1] = 1;
        this.m[2][2] = 1;
        this.m[3][3] = 1;
    }
}

class RotationMatrixX extends Matrix4x4 {
    constructor(deg) {
        const rad = utils.toRad(deg);
        super();
        this.m = [
            [1, 0, 0, 0],
            [0, Math.cos(rad), -Math.sin(rad), 0],
            [0, Math.sin(rad), Math.cos(rad), 0],
            [0, 0, 0, 1]
        ]
    }
}


class RotationMatrixY extends Matrix4x4 {
    constructor(deg) {
        super();
        const rad = utils.toRad(deg);
        this.m = [
            [Math.cos(rad), 0, Math.sin(rad), 0],
            [0, 1, 0, 0],
            [-Math.sin(rad), 0, Math.cos(rad), 0],
            [0, 0, 0, 1]
        ]
    }
}

class RotationMatrixZ extends Matrix4x4 {
    constructor(deg) {
        super();
        const rad = utils.toRad(deg);
        this.m = [
            [Math.cos(rad), -Math.sin(rad), 0, 0],
            [Math.sin(rad), Math.cos(rad), 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ]
    }
}

class TranslationMatrix extends Matrix4x4 {
    constructor(x, y, z) {
        super();
		this.m[0][0] = 1;
		this.m[1][1] = 1;
		this.m[2][2] = 1;
		this.m[3][3] = 1;
		this.m[3][0] = x;
		this.m[3][1] = y;
		this.m[3][2] = z;
    }
}

class ProjectionMatrix extends Matrix4x4 {
    constructor(
        fovRad,
        aspectRatio,
        near,
        far
    ) {
        super();
        const f = 1 / Math.tan(fovRad / 2);
        this.m[0][0] = aspectRatio * f;
		this.m[1][1] = f;
		this.m[2][2] = far / (far - near);
		this.m[3][2] = (-far * near) / (far - near);
		this.m[2][3] = 1;
		this.m[3][3] = 0;
    }
}

class Object3d {
    name;
    /** @type {Vector[]} vertices */
    vertices = [];
    /** @type {[number[]]} faces */
    faces = [];
    scaling = 1;

    position = new Vector();
    translationMatrix = new TranslationMatrix(0, 0, 0);

    rotation = new Vector();
    rotationMatrix = {
        x: new RotationMatrixX(0),
        y: new RotationMatrixY(0),
        z: new RotationMatrixZ(0),
    };

    constructor(vertices, faces) {
        this.vertices = vertices;
        this.faces = faces;
    }

    setPosition(x = undefined, y = undefined, z = undefined) {
        this.position.x = x ?? this.position.x,
        this.position.y = y ?? this.position.y,
        this.position.z = z ?? this.position.z

        this.translationMatrix = new TranslationMatrix(
            x ?? this.position.x,
            y ?? this.position.y,
            z ?? this.position.z
        )
    }

    setRotation(x = undefined, y = undefined, z = undefined) {
        this.rotation.x = x ?? this.rotation.x,
        this.rotation.y = y ?? this.rotation.y,
        this.rotation.z = z ?? this.rotation.z

        if(x != undefined) this.rotationMatrix.x = new RotationMatrixX(x);
        if(y != undefined) this.rotationMatrix.y = new RotationMatrixY(y);
        if(z != undefined) this.rotationMatrix.z = new RotationMatrixZ(z);
    }

    setScaling(s) {
        if(typeof s == 'number') this.scaling = s;
    }
    
    parseContent(content) {
        const lines = content.split('\n');

        const vertices = [];
        const faces = [];

        for(const line of lines) {
            const line_chunks = line.split(' ');
            const v = new Vector(Number(line_chunks[1]), Number(line_chunks[2]), Number(line_chunks[3]));

            if(line_chunks[0] == 'v') {
                vertices.push(v);
            } else if(line_chunks[0] == 'f') {
                faces.push(
                    [
                        Number(line_chunks[1] - 1), // reducing once becauce vertices starts from 0 index
                        Number(line_chunks[2] - 1),
                        Number(line_chunks[3] - 1)
                    ]
                );
            }
        }

        return {
            vertices,
            faces
        }
    }

    async loadFromObjFile(path) {
        try {
            const res = await fetch(path);
            const file = await res.text();
            const data = this.parseContent(file);
            this.vertices = data.vertices;
            this.faces = data.faces;
            const arr = path.split('/');
            this.name = arr[arr.length - 1]
        } catch(err) {
            console.log(err);
        }
    }
}

export {
    Vector,
    Triangle,
    Matrix4x4,
    IdentityMatrix4x4,
    RotationMatrixX,
    RotationMatrixY,
    RotationMatrixZ,
    TranslationMatrix,
    ProjectionMatrix,
    Object3d,
}