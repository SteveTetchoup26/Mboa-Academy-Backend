import { Router } from 'express';

import { API_BASE } from '../core/config';

import { CourseController } from '../controllers/course.controller';


/**
 * Router configuration for user
 *
 * @class
 */
class CourseRoute {
	public router: Router;

	constructor() {
		this.router = Router();
		this.routes();
	}

	routes(): void {
		const prefix: string = `${API_BASE}courses`;

        this.router.post(`${prefix}/create`, CourseController.create);

		this.router.get(`${prefix}`, CourseController.all);

		this.router.get(`${prefix}/:id`, CourseController.one);

		this.router.put(`${prefix}/update/:id`, CourseController.update);

		this.router.delete(`${prefix}/delete/:id`, CourseController.destroy);
	}
}

export { CourseRoute };
