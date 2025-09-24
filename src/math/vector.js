// Vector class from ds.js
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

	add(v) {
		return new Vector(
			this.x + v.x,
			this.y + v.y,
			this.z + v.z,
		)
	}

	subtract(v) {
		return new Vector(
			this.x - v.x,
			this.y - v.y,
			this.z - v.z,
		)
	}

	multiply(k) {
		return new Vector(
			this.x * k,
			this.y * k,
			this.z * k,
		)
	}

	multiplyVector(v) {
		return new Vector(
			this.x * v.x,
			this.y * v.y,
			this.z * v.z,
		)
	}

	divide(k) {
		return new Vector(
			this.x / k,
			this.y / k,
			this.z / k,
		)
	}
    
	scale(x, y, z) {
		return new Vector(
			this.x * (x ?? 1),
			this.y * (y ?? 1),
			this.z * (z ?? 1),
		)
	}

	dot(v) {
		return (
			this.x * v.x +
			this.y * v.y +
			this.z * v.z
		)
	}

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

export default Vector;