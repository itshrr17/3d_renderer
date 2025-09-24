// ===============================
// Matrix4x4: 3D Transformations
// ===============================
// 4x4 matrices are used for all 3D transformations: translation, rotation, scaling, and projection.
// This file provides classes for general matrices and specific transformation matrices.

import utils from '../utils/utils.js';
import Vector from './vector.js';

// General 4x4 matrix class
class Matrix4x4 {
	/**
	 * Create a new 4x4 matrix (all zeros by default).
	 */
	constructor() {
		this.m = [
			[0, 0, 0, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0]
		];
	}

	/**
	 * Multiply this matrix by a vector (transform the vector).
	 * Used to move, rotate, or project a point in 3D space.
	 * @param {Vector} v
	 * @returns {Vector}
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
	 * Multiply this matrix by another matrix (combine transformations).
	 * @param {Matrix4x4} m
	 * @returns {Matrix4x4}
	 */
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

	/**
	 * Quickly invert a matrix that only has rotation/translation (no scaling/skew).
	 * Used to get the view matrix from the camera's transformation.
	 * @returns {Matrix4x4}
	 */
	quick_inverse() {
		const newMat = new Matrix4x4();
		// Transpose the rotation part (top-left 3x3)
		newMat.m[0][0] = this.m[0][0]; newMat.m[0][1] = this.m[1][0]; newMat.m[0][2] = this.m[2][0]; newMat.m[0][3] = 0;
		newMat.m[1][0] = this.m[0][1]; newMat.m[1][1] = this.m[1][1]; newMat.m[1][2] = this.m[2][1]; newMat.m[1][3] = 0;
		newMat.m[2][0] = this.m[0][2]; newMat.m[2][1] = this.m[1][2]; newMat.m[2][2] = this.m[2][2]; newMat.m[2][3] = 0;
		// Invert the translation
		newMat.m[3][0] = -(this.m[3][0] * newMat.m[0][0] + this.m[3][1] * newMat.m[1][0] + this.m[3][2] * newMat.m[2][0]);
		newMat.m[3][1] = -(this.m[3][0] * newMat.m[0][1] + this.m[3][1] * newMat.m[1][1] + this.m[3][2] * newMat.m[2][1]);
		newMat.m[3][2] = -(this.m[3][0] * newMat.m[0][2] + this.m[3][1] * newMat.m[1][2] + this.m[3][2] * newMat.m[2][2]);
		newMat.m[3][3] = 1;
		return newMat;
	}
}

// Identity matrix: does nothing when applied (used as a starting point)
class IdentityMatrix4x4 extends Matrix4x4 {
	constructor() {
		super();
		this.m[0][0] = 1;
		this.m[1][1] = 1;
		this.m[2][2] = 1;
		this.m[3][3] = 1;
	}
}

// Rotation matrix for rotating around the X axis
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

// Rotation matrix for rotating around the Y axis
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

// Rotation matrix for rotating around the Z axis
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

// Translation matrix: moves a point by (x, y, z)
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

// Projection matrix: projects 3D points onto a 2D screen (perspective)
class ProjectionMatrix extends Matrix4x4 {
	/**
	 * Create a perspective projection matrix.
	 * @param {number} fovRad - Field of view in radians
	 * @param {number} aspectRatio - Width/height of the screen
	 * @param {number} near - Near clipping plane
	 * @param {number} far - Far clipping plane
	 */
	constructor(fovRad, aspectRatio, near, far) {
		super();
		const f = 1 / Math.tan(fovRad / 2); // Focal length
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