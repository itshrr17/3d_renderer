// ===============================
// Object3d: 3D Model Representation
// ===============================
// This class represents a 3D object, including its geometry, position, and rotation.
// It can load geometry from a .obj file and provides transformation helpers.

import Vector from '../math/vector.js';
import { TranslationMatrix, RotationMatrixX, RotationMatrixY, RotationMatrixZ } from '../math/matrix.js';

class Object3d {
    name; // Name of the object (usually the filename)
    vertices = []; // Array of Vector objects (3D points)
    faces = [];    // Array of faces (each is an array of 3 indices into vertices)
    scaling = 1;   // Uniform scale (not used in this renderer)

    // Position and transformation matrices
    position = new Vector();
    translationMatrix = new TranslationMatrix(0, 0, 0);
    rotation = new Vector();
    rotationMatrix = {
        x: new RotationMatrixX(0),
        y: new RotationMatrixY(0),
        z: new RotationMatrixZ(0),
    };

    /**
     * Create a new 3D object.
     * @param {Array<Vector>} vertices - List of 3D points
     * @param {Array<Array<number>>} faces - List of faces (each is 3 indices)
     */
    constructor(vertices, faces) {
        this.vertices = vertices;
        this.faces = faces;
    }

    /**
     * Set the position of the object in 3D space.
     * Updates the translation matrix.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setPosition(x = undefined, y = undefined, z = undefined) {
        this.position.x = x ?? this.position.x;
        this.position.y = y ?? this.position.y;
        this.position.z = z ?? this.position.z;
        this.translationMatrix = new TranslationMatrix(
            x ?? this.position.x,
            y ?? this.position.y,
            z ?? this.position.z
        );
    }

    /**
     * Set the rotation of the object (in degrees).
     * Updates the rotation matrices for X, Y, Z axes.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setRotation(x = undefined, y = undefined, z = undefined) {
        this.rotation.x = x ?? this.rotation.x;
        this.rotation.y = y ?? this.rotation.y;
        this.rotation.z = z ?? this.rotation.z;
        if(x != undefined) this.rotationMatrix.x = new RotationMatrixX(x);
        if(y != undefined) this.rotationMatrix.y = new RotationMatrixY(y);
        if(z != undefined) this.rotationMatrix.z = new RotationMatrixZ(z);
    }

    /**
     * Set the scaling factor (not used in this renderer).
     * @param {number} s
     */
    setScaling(s) {
        if(typeof s == 'number') this.scaling = s;
    }

    /**
     * Parse the contents of a .obj file (very simple format: lines starting with 'v' for vertices, 'f' for faces).
     * @param {string} content
     * @returns {{vertices: Array<Vector>, faces: Array<Array<number>>}}
     */
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
                faces.push([
                    Number(line_chunks[1] - 1), // .obj indices start at 1, arrays at 0
                    Number(line_chunks[2] - 1),
                    Number(line_chunks[3] - 1)
                ]);
            }
        }
        return { vertices, faces };
    }

    /**
     * Load geometry from a .obj file (asynchronously, using fetch).
     * @param {string} path - Path to the .obj file
     */
    async loadFromObjFile(path) {
        try {
            const res = await fetch(path);
            const file = await res.text();
            const data = this.parseContent(file);
            this.vertices = data.vertices;
            this.faces = data.faces;
            const arr = path.split('/');
            this.name = arr[arr.length - 1];
        } catch(err) {
            console.log(err);
        }
    }
}

export default Object3d;
