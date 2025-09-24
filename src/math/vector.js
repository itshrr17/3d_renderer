// ===============================
// Vector: 3D Math Building Block
// ===============================
// A vector is a direction and magnitude in 3D space. Used for positions, directions, and more.

class Vector {
	/**
	 * Create a new 3D vector.
	 * @param {number} x - X coordinate
	 * @param {number} y - Y coordinate
	 * @param {number} z - Z coordinate
	 * @param {number} w - Homogeneous coordinate (default 1, used for matrix math)
	 */
	constructor(x = 0, y = 0, z = 0, w = 1) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}

	/**
	 * Get the length (magnitude) of the vector from the origin.
	 * Formula: sqrt(x^2 + y^2 + z^2)
	 * @returns {number}
	 */
	length() {
		return Math.sqrt(
			this.x * this.x +
			this.y * this.y +
			this.z * this.z
		);
	}

	/**
	 * Normalize the vector (make its length 1, keep its direction).
	 * Useful for directions and lighting.
	 * @returns {Vector}
	 */
	normalize() {
		const l = this.length();
		return new Vector(
			this.x / l,
			this.y / l,
			this.z / l,
		)
	}

	/**
	 * Add another vector to this one.
	 * @param {Vector} v
	 * @returns {Vector}
	 */
	add(v) {
		return new Vector(
			this.x + v.x,
			this.y + v.y,
			this.z + v.z,
		)
	}

	/**
	 * Subtract another vector from this one.
	 * @param {Vector} v
	 * @returns {Vector}
	 */
	subtract(v) {
		return new Vector(
			this.x - v.x,
			this.y - v.y,
			this.z - v.z,
		)
	}

	/**
	 * Multiply this vector by a scalar (number).
	 * @param {number} k
	 * @returns {Vector}
	 */
	multiply(k) {
		return new Vector(
			this.x * k,
			this.y * k,
			this.z * k,
		)
	}

	/**
	 * Multiply this vector by another vector (component-wise).
	 * @param {Vector} v
	 * @returns {Vector}
	 */
	multiplyVector(v) {
		return new Vector(
			this.x * v.x,
			this.y * v.y,
			this.z * v.z,
		)
	}

	/**
	 * Divide this vector by a scalar (number).
	 * @param {number} k
	 * @returns {Vector}
	 */
	divide(k) {
		return new Vector(
			this.x / k,
			this.y / k,
			this.z / k,
		)
	}

	/**
	 * Scale each component by a different value (default 1 if not provided).
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @returns {Vector}
	 */
	scale(x, y, z) {
		return new Vector(
			this.x * (x ?? 1),
			this.y * (y ?? 1),
			this.z * (z ?? 1),
		)
	}

	/**
	 * Dot product: how much two vectors point in the same direction.
	 * Formula: x1*x2 + y1*y2 + z1*z2
	 * Used for lighting and angles.
	 * @param {Vector} v
	 * @returns {number}
	 */
	dot(v) {
		return (
			this.x * v.x +
			this.y * v.y +
			this.z * v.z
		)
	}

	/**
	 * Cross product: returns a vector perpendicular to both inputs.
	 * Used for normals (face directions).
	 * @param {Vector} v
	 * @returns {Vector}
	 */
	cross(v) {
		return new Vector(
			this.y * v.z - this.z * v.y,
			this.z * v.x - this.x * v.z,
			this.x * v.y - this.y * v.x
		)
	}

	/**
	 * Convert to array [x, y, z].
	 * @returns {Array<number>}
	 */
	toArray() {
		return [this.x, this.y, this.z];
	}

	/**
	 * Negate the vector (reverse direction).
	 * @returns {Vector}
	 */
	negate() {
		return new Vector(
			-this.y,
			-this.z,
			-this.x
		)
	}
}

export default Vector;