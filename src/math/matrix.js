import utils from '../utils/utils.js';
import Vector from './vector.js';

class Matrix4x4 {
	constructor() {
		this.m = [
			[0, 0, 0, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0]
		];
	}

	multiplyVector(v) {
		return new Vector(
			v.x * this.m[0][0] + v.y * this.m[1][0] + v.z * this.m[2][0] + v.w * this.m[3][0],
			v.x * this.m[0][1] + v.y * this.m[1][1] + v.z * this.m[2][1] + v.w * this.m[3][1],
			v.x * this.m[0][2] + v.y * this.m[1][2] + v.z * this.m[2][2] + v.w * this.m[3][2],
			v.x * this.m[0][3] + v.y * this.m[1][3] + v.z * this.m[2][3] + v.w * this.m[3][3]
		)
	}

	multiply(m) {
		const new_m = new Matrix4x4();

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
	constructor(fovRad, aspectRatio, near, far) {
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

export {
	Matrix4x4,
	IdentityMatrix4x4,
	RotationMatrixX,
	RotationMatrixY,
	RotationMatrixZ,
	TranslationMatrix,
	ProjectionMatrix
};