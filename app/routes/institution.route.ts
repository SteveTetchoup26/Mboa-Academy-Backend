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

        // User search (institution admins) — MUST be before /:id to avoid route conflict
        this.router.get(`${prefix}/search-users`, InstitutionController.searchUsers);

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

        // ───────── Institution Course Management ─────────

        // Create course for institution
        this.router.post(`${prefix}/:id/courses/create`, uploadFiles.fields([
            { name: 'cover_image', maxCount: 1 },
            { name: 'videos', maxCount: 100 },
        ]), InstitutionController.createCourse);

        // Update course
        this.router.put(`${prefix}/:id/courses/:courseId`, InstitutionController.updateCourse);

        // Delete course
        this.router.delete(`${prefix}/:id/courses/:courseId`, InstitutionController.deleteCourse);

        // Generate/regenerate access code
        this.router.post(`${prefix}/:id/courses/:courseId/generate-code`, InstitutionController.generateCourseAccessCode);

        // Publish a course
        this.router.post(`${prefix}/:id/courses/:courseId/publish`, InstitutionController.publishCourse);

        // ───────── Student Enrollment ─────────

        // List enrolled students for a course
        this.router.get(`${prefix}/:id/courses/:courseId/students`, InstitutionController.listCourseStudents);

        // Enroll students by email (bulk)
        this.router.post(`${prefix}/:id/courses/:courseId/students`, InstitutionController.enrollCourseStudents);

        // Remove a student from a course
        this.router.delete(`${prefix}/:id/courses/:courseId/students/:studentId`, InstitutionController.removeCourseStudent);

        // ───────── Super Admin only ─────────

        // Validate (approve/reject) an institution
        this.router.post(`${prefix}/validate/:id`, InstitutionController.validate);

        // Delete an institution
        this.router.delete(`${prefix}/delete/:id`, InstitutionController.destroy);
    }
}

export { InstitutionRoute };
