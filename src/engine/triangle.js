// ===============================
// Triangle: 3D Primitive
// ===============================
// A triangle is the simplest polygon in 3D graphics. All 3D models are made of triangles.

class Triangle {
    /**
     * Create a triangle from 3 vertices.
     * @param {Vector} v1
     * @param {Vector} v2
     * @param {Vector} v3
     */
    constructor(v1, v2, v3) {
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
    }
}

export default Triangle;
