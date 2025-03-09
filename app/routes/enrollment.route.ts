import { Router } from 'express';

import { API_BASE } from '../core/config';

import { EnrollmentController } from '../controllers/enrollment.controller';


/**
 * Router configuration for enrollment
 *
 * @class
 */
class EnrollmentRoute {
	public router: Router;

	constructor() {
		this.router = Router();
		this.routes();
	}

	routes(): void {
		const prefix: string = `${API_BASE}/enrollments`;

        // this.router.post(`${prefix}/create`, EnrollmentController.create);

		this.router.get(`${prefix}`, EnrollmentController.all);

		this.router.get(`${prefix}/:id`, EnrollmentController.one);

		this.router.put(`${prefix}/update/:id`, EnrollmentController.update);

		// this.router.delete(`${prefix}/delete/:id`, EnrollmentController.destroy);

		this.router.post(`${prefix}/init-progress-lesson`, EnrollmentController.initProgressLesson);
		this.router.put(`${prefix}/update-progress-lesson`, EnrollmentController.updateProgressLesson);
	}
}

export { EnrollmentRoute };
