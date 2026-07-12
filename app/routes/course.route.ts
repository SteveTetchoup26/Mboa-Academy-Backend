import { Router } from 'express';

import { API_BASE } from '../core/config';

import { CourseController } from '../controllers/course.controller';
import { uploadFiles } from '../utils/upload-handler';


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
		const prefix: string = `${API_BASE}/courses`;

        this.router.post(`${prefix}/create`, uploadFiles.fields([
			{ name: "cover_image", maxCount: 1 }, 
    		{ name: "videos", maxCount: 20 }
		]) ,CourseController.create);

		this.router.get(`${prefix}`, CourseController.all);

		this.router.get(`${prefix}/admin/all`, CourseController.adminAll);

		this.router.put(`${prefix}/validate/:id`, CourseController.validateCourse);

		this.router.get(`${prefix}/instructor-courses`, CourseController.allCoursesByIntructor);

		this.router.get(`${prefix}/enrolled`, CourseController.allCoursesEnrolled);

		this.router.get(`${prefix}/:id`, CourseController.one);

		this.router.put(`${prefix}/update/:id`, CourseController.update);

		this.router.delete(`${prefix}/delete/:id`, CourseController.destroy);

	}
}

export { CourseRoute };
