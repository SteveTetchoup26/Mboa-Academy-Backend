import { Router } from 'express';

import { API_BASE } from '../core/config';

import { InstitutionController } from '../controllers/institution.controller';
import { uploadFiles } from '../utils/upload-handler';


/**
 * Router configuration for institution
 *
 * @class
 */
class InstitutionRoute {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    routes(): void {
        const prefix: string = `${API_BASE}/institutions`;

        // ───────── Public / Authenticated ─────────

        // Create institution (any authenticated user)
        this.router.post(`${prefix}/create`, uploadFiles.fields([{ name: 'logo', maxCount: 1 }]), InstitutionController.create);

        // List all institutions (any authenticated user)
        this.router.get(`${prefix}`, InstitutionController.all);

        // Get current user's institution(s)
        this.router.get(`${prefix}/my-institution`, InstitutionController.myInstitution);

        // Get one institution
        this.router.get(`${prefix}/:id`, InstitutionController.one);

        // Get courses of an institution
        this.router.get(`${prefix}/:id/courses`, InstitutionController.courses);

        // Get dashboard stats of an institution
        this.router.get(`${prefix}/:id/stats`, InstitutionController.stats);

        // ───────── Institution Admin / Super Admin ─────────

        // Update institution
        this.router.put(`${prefix}/update/:id`, uploadFiles.fields([{ name: 'logo', maxCount: 1 }]), InstitutionController.update);

        // Manage admins
        this.router.post(`${prefix}/:id/admins`, InstitutionController.addAdmin);
        this.router.delete(`${prefix}/:id/admins/:userId`, InstitutionController.removeAdmin);

        // ───────── Super Admin only ─────────

        // Validate (approve/reject) an institution
        this.router.post(`${prefix}/validate/:id`, InstitutionController.validate);

        // Delete an institution
        this.router.delete(`${prefix}/delete/:id`, InstitutionController.destroy);
    }
}

export { InstitutionRoute };
