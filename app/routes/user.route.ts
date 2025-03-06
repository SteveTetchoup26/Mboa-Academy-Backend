import { Router } from 'express';

import { API_BASE } from '../core/config';

import { UserController } from '../controllers/user.controller';


/**
 * Router configuration for user
 *
 * @class
 */
class UserRoute {
	public router: Router;

	constructor() {
		this.router = Router();
		this.routes();
	}

	routes(): void {
		const prefix: string = `${API_BASE}/users`;

		this.router.get(`${prefix}/me`, UserController.me);

		this.router.get(`${prefix}`, UserController.all);

		this.router.get(`${prefix}/:id`, UserController.one);

		this.router.put(`${prefix}/profile/update`, UserController.update);

		this.router.delete(`${prefix}/:id`, UserController.destroy);

		this.router.post(`${prefix}/become-instructor`, UserController.becomeInstructor);
	}
}

export { UserRoute };
