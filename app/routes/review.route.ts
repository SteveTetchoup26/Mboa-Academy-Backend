import { Router } from 'express';

import { API_BASE } from '../core/config';

import { ReviewController } from '../controllers/review.controller';


/**
 * Router configuration for reviews
 *
 * @class
 */
class ReviewRoute {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    routes(): void {
        const prefix: string = `${API_BASE}/reviews`;

        this.router.post(`${prefix}/create`, ReviewController.create);

        this.router.get(`${prefix}/course/:courseId`, ReviewController.byCourse);

        this.router.get(`${prefix}/course/:courseId/mine`, ReviewController.userReview);

        this.router.delete(`${prefix}/delete/:id`, ReviewController.destroy);
    }
}

export { ReviewRoute };
