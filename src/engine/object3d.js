// Object3d class from ds.js
import Vector from '../math/vector.js';
import { TranslationMatrix, RotationMatrixX, RotationMatrixY, RotationMatrixZ } from '../math/matrix.js';

class Object3d {
    name;
    vertices = [];
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
                faces.push([
                    Number(line_chunks[1] - 1),
                    Number(line_chunks[2] - 1),
                    Number(line_chunks[3] - 1)
                ]);
            }
        }
        return { vertices, faces };
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

export default Object3d;
