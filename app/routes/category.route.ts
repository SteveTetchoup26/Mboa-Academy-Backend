import { Router } from 'express';

import { API_BASE } from '../core/config';

import { CategoryController } from '../controllers/category.controller';


/**
 * Router configuration for user
 *
 * @class
 */
class CategoryRoute {
	public router: Router;

	constructor() {
		this.router = Router();
		this.routes();
	}

	routes(): void {
		const prefix: string = `${API_BASE}/categories`;

        this.router.post(`${prefix}/create`, CategoryController.create);

		this.router.get(`${prefix}`, CategoryController.all);

		this.router.get(`${prefix}/:id`, CategoryController.one);

		this.router.put(`${prefix}/update/:id`, CategoryController.update);

		this.router.delete(`${prefix}/delete/:id`, CategoryController.destroy);
	}
}

export { CategoryRoute };
