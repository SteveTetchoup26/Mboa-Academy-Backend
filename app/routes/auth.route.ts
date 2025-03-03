/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from 'express';

import { API_BASE } from '../core/config';

// import userValidator from '../validator/user.validator';
// import { Validator } from '../validator';

import { AuthController } from '../controllers/auth.controller';

// const { user }: any = Validator.methods;

/**
 * Router configuration for authentication
 *
 * @class
 */
class AuthRoute {
	public router: Router;

	constructor() {
		this.router = Router();
		this.routes();
	}

	routes(): void {
		const prefix: string = `${API_BASE}auth`;

		this.router.post(`${prefix}/register`, AuthController.register);

		this.router.post(`${prefix}/login`, AuthController.login);

		this.router.post(`${prefix}/account/confirm`, AuthController.confirmAccount);

		this.router.post(`${prefix}/password/forgot`, AuthController.forgotPassword);

		this.router.post(`${prefix}/password/reset`, AuthController.resetPassword);
	}
}

export { AuthRoute };
