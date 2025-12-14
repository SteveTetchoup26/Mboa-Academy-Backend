/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from 'express';

import { AuthController } from '../../controllers/auth.controller';
import { API_BASE } from '../../core/config';

// const { user }: any = Validator.methods;

/**
 * Router configuration for authentication
 *
 * @class
 */
class AdminRoute {
	public router: Router;

	constructor() {
		this.router = Router();
		this.routes();
	}

	routes(): void {
		const prefix: string = `${API_BASE}/auth`;

		this.router.post(`${prefix}/admin/login`, AuthController.login);
	}
}

export { AdminRoute };
