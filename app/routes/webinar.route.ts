import { Router } from 'express';
import { API_BASE } from '../core/config';
import { WebinarController } from '../controllers/webinar.controller';

/**
 * Router configuration for webinars
 *
 * @class
 */
class WebinarRoute {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    routes(): void {
        const prefix: string = `${API_BASE}/webinars`;

        // ───────── CRUD ─────────

        // Create webinar (authenticated — user becomes instructor)
        this.router.post(`${prefix}/create`, WebinarController.create);

        // List all public webinars
        this.router.get(`${prefix}`, WebinarController.all);

        // List webinars by institution
        this.router.get(`${prefix}/institution/:institutionId`, WebinarController.allByInstitution);

        // List webinars by current instructor
        this.router.get(`${prefix}/my-webinars`, WebinarController.allByInstructor);

        // Get one webinar
        this.router.get(`${prefix}/:id`, WebinarController.one);

        // Update webinar
        this.router.put(`${prefix}/:id`, WebinarController.update);

        // Update webinar status
        this.router.patch(`${prefix}/:id/status`, WebinarController.updateStatus);

        // Generate Jitsi room and start webinar
        this.router.post(`${prefix}/:id/room`, WebinarController.generateRoom);

        // Delete webinar
        this.router.delete(`${prefix}/:id`, WebinarController.destroy);

        // ───────── Registrations ─────────

        // Register to a webinar
        this.router.post(`${prefix}/:id/register`, WebinarController.register);

        // Unregister from a webinar
        this.router.delete(`${prefix}/:id/register`, WebinarController.unregister);

        // List registrations for a webinar
        this.router.get(`${prefix}/:id/registrations`, WebinarController.registrations);
    }
}

export { WebinarRoute };
