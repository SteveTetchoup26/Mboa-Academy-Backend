/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';

import { CustomRequest } from '../core/types';
import { i18next } from '../core/i18n';
import Institution from '../models/institution/institution.model';
import InstitutionTypeModel from '../models/institution/institutionType.model';
import InstitutionStatusModel from '../models/institution/institutionStatus.model';
import InstitutionAdmin from '../models/institution/institutionAdmin.model';
import User from '../models/authentication/user.model';
import UserStatus from '../models/authentication/userStatus.model';
import Role from '../models/authentication/role.model';
import UserRole from '../models/authentication/userRole.model';
import Course from '../models/course/course.model';
import Enrollment from '../models/enrollment/enrollment.model';
import Certificate from '../models/course/certificate.model';


/**
 * Controller for institution
 *
 * @class
 */
class InstitutionController {

    /**
     * create()
     *
     * Create a new institution — accessible without authentication.
     * If the creator doesn't have an account yet, one is created automatically
     * with the "Institution" role and "Active" status.
     * If the creator already has an account, they are linked as admin.
     * The institution default status is 'Pending' until a Super Admin validates it.
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async create(req: CustomRequest | any, res: Response): Promise<any> {
        const { name, slug, description, address, city, country, phone, email, website, brand_color, type, creator_name, creator_email, creator_password, creator_phone } = req.body;
        const fileType = req.body.fileType;

        const transaction = await Institution.sequelize?.transaction();

        try {
            // ── 1. Résoudre le créateur (nouveau ou existant) ──
            let creatorUser: User | null = null;

            if (creator_email) {
                creatorUser = await User.findOne({ where: { email: creator_email } });
            }

            if (!creatorUser) {
                // Créer un nouvel utilisateur
                if (!creator_name || !creator_email || !creator_password) {
                    return res.status(400).json({ message: 'Les informations du créateur (nom, email, mot de passe) sont requises' });
                }

                const activeStatus: UserStatus | null = await UserStatus.findOne({ where: { title: 'Active' } });
                if (!activeStatus) {
                    return res.status(500).json({ message: 'Statut Active introuvable' });
                }

                const hashedPassword = await bcrypt.hash(creator_password, 10);

                creatorUser = await User.create({
                    name: creator_name,
                    email: creator_email,
                    password: hashedPassword,
                    status_id: activeStatus.id,
                    phone_number: creator_phone || '',
                }, { transaction });

                // Assigner le rôle Institution
                const institutionRole: Role | null = await Role.findOne({ where: { title: 'Institution' } });
                if (institutionRole) {
                    await UserRole.create({
                        user_id: creatorUser.id,
                        role_id: institutionRole.id,
                    }, { transaction });
                }
            }

            if (!creatorUser) {
                return res.status(500).json({ message: "Impossible de résoudre l'utilisateur créateur" });
            }

            // ── 2. Créer l'institution ──
            const typeModel: InstitutionTypeModel | null = await InstitutionTypeModel.findOne({ where: { title: type } });
            if (!typeModel) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'InstitutionType' }) });
            }

            const pendingStatus: InstitutionStatusModel | null = await InstitutionStatusModel.findOne({ where: { title: 'Pending' } });
            if (!pendingStatus) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'InstitutionStatus' }) });
            }

            let logoUrl = '';

            // If a file was uploaded, use it for the logo
            if (req.files && 'logo' in req.files) {
                const logoFile = (req.files as any).logo[0];
                logoUrl = `uploads/institutions_logo/${logoFile.filename}`;
            }

            const institution = await Institution.create({
                name,
                slug,
                description,
                address,
                city,
                country,
                phone,
                email,
                website,
                logo_url: logoUrl,
                brand_color,
                type_id: typeModel.id,
                status_id: pendingStatus.id,
            }, { transaction });

            // ── 3. Lier le créateur comme admin de l'institution ──
            await InstitutionAdmin.create({
                institution_id: institution.id,
                user_id: creatorUser.id,
                role: 'admin',
            }, { transaction });

            await transaction?.commit();

            return res.status(201).json({
                message: i18next.t('institution.created'),
                institution,
                user: {
                    id: creatorUser.id,
                    name: creatorUser.name,
                    email: creatorUser.email,
                    message: 'Compte créé. Vous pouvez maintenant vous connecter.'
                }
            });
        } catch (err) {
            await transaction?.rollback();
            console.log(err);
            return res.status(500).json({ message: i18next.t('internal.error') });
        }
    }

    /**
     * all()
     *
     * Get all institutions
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async all(req: CustomRequest | any, res: Response): Promise<any> {
        try {
            const institutions: Array<Institution> = await Institution.findAll({
                include: [
                    { model: InstitutionTypeModel, attributes: ['id', 'title'] },
                    { model: InstitutionStatusModel, attributes: ['id', 'title'] },
                ]
            });

            return res.status(200).json({ institutions });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    /**
     * one()
     *
     * Get an institution by ID
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async one(req: Request, res: Response): Promise<any> {
        try {
            const institution: Institution | null = await Institution.findByPk(req.params.id, {
                include: [
                    { model: InstitutionTypeModel, attributes: ['id', 'title'] },
                    { model: InstitutionStatusModel, attributes: ['id', 'title'] },
                    { model: InstitutionAdmin, include: [{ model: User, attributes: ['id', 'name', 'email'] }] },
                ]
            });

            if (!institution) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Institution' }) });
            }

            return res.status(200).json({ institution });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    /**
     * update()
     *
     * Update an institution — institution admin or Super Admin only
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async update(req: CustomRequest | any, res: Response): Promise<any> {
        const id: number = req.params.id;
        const data: any = req.body;

        try {
            const institution: Institution | null = await Institution.findByPk(id);
            if (!institution) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Institution' }) });
            }

            const isAuthorized = await InstitutionController.isSuperAdminOrInstitutionAdmin(req.userId, id);
            if (!isAuthorized) {
                return res.status(403).json({ message: i18next.t('unauthorized') });
            }

            // If type is provided, resolve the id
            if (data.type) {
                const typeModel: InstitutionTypeModel | null = await InstitutionTypeModel.findOne({ where: { title: data.type } });
                if (typeModel) {
                    data.type_id = typeModel.id;
                }
                delete data.type;
            }

            // If a file was uploaded, use it for the logo
            if (req.files && 'logo' in req.files) {
                const logoFile = (req.files as any).logo[0];
                data.logo_url = `uploads/institutions_logo/${logoFile.filename}`;
            }

            // Prevent institution admin from changing their own status
            if (data.status_id || data.status) {
                const isSuperAdmin = await InstitutionController.isSuperAdmin(req.userId);
                if (!isSuperAdmin) {
                    delete data.status_id;
                    delete data.status;
                }
            }

            await Institution.update(data, { where: { id } });
            const updated: Institution | null = await Institution.findByPk(id, {
                include: [
                    { model: InstitutionTypeModel, attributes: ['id', 'title'] },
                    { model: InstitutionStatusModel, attributes: ['id', 'title'] },
                ]
            });

            return res.status(200).json({ message: i18next.t('model.saved', { model: 'Institution' }), institution: updated });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    /**
     * destroy()
     *
     * Delete an institution — Super Admin only
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async destroy(req: CustomRequest | any, res: Response): Promise<any> {
        const id: number = req.params.id;

        try {
            const isSuperAdmin = await InstitutionController.isSuperAdmin(req.userId);
            if (!isSuperAdmin) {
                return res.status(403).json({ message: i18next.t('unauthorized') });
            }

            const institution: Institution | null = await Institution.findByPk(id);
            if (!institution) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Institution' }) });
            }

            await Institution.destroy({ where: { id } });

            return res.status(200).json({ message: i18next.t('model.deleted', { model: 'Institution' }) });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    /**
     * validate()
     *
     * Approve or reject an institution — Super Admin only
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async validate(req: CustomRequest | any, res: Response): Promise<any> {
        const id: number = req.params.id;
        const { action } = req.body; // 'approve' or 'reject'

        try {
            const isSuperAdmin = await InstitutionController.isSuperAdmin(req.userId);
            if (!isSuperAdmin) {
                return res.status(403).json({ message: i18next.t('unauthorized') });
            }

            const institution: Institution | null = await Institution.findByPk(id);
            if (!institution) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Institution' }) });
            }

            let statusTitle: string;
            if (action === 'approve') {
                statusTitle = 'Active';
            } else if (action === 'reject') {
                statusTitle = 'Rejected';
            } else {
                return res.status(400).json({ message: 'Action must be "approve" or "reject"' });
            }

            const statusModel: InstitutionStatusModel | null = await InstitutionStatusModel.findOne({ where: { title: statusTitle } });
            if (!statusModel) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'InstitutionStatus' }) });
            }

            await Institution.update({ status_id: statusModel.id }, { where: { id } });

            const updated: Institution | null = await Institution.findByPk(id, {
                include: [
                    { model: InstitutionTypeModel, attributes: ['id', 'title'] },
                    { model: InstitutionStatusModel, attributes: ['id', 'title'] },
                ]
            });

            return res.status(200).json({
                message: i18next.t(action === 'approve' ? 'institution.approved' : 'institution.rejected'),
                institution: updated
            });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    /**
     * addAdmin()
     *
     * Add a user as admin/instructor of an institution
     * — Institution admin or Super Admin can do this
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async addAdmin(req: CustomRequest | any, res: Response): Promise<any> {
        const institutionId: number = req.params.id;
        const { user_id, role } = req.body;

        try {
            const isAuthorized = await InstitutionController.isSuperAdminOrInstitutionAdmin(req.userId, institutionId);
            if (!isAuthorized) {
                return res.status(403).json({ message: i18next.t('unauthorized') });
            }

            const institution: Institution | null = await Institution.findByPk(institutionId);
            if (!institution) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Institution' }) });
            }

            const user: User | null = await User.findByPk(user_id);
            if (!user) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'User' }) });
            }

            const existing: InstitutionAdmin | null = await InstitutionAdmin.findOne({
                where: { institution_id: institutionId, user_id }
            });
            if (existing) {
                return res.status(400).json({ message: i18next.t('institution.admin.exists') });
            }

            const validRoles = ['admin', 'instructor'];
            const assignedRole = validRoles.includes(role) ? role : 'instructor';

            const institutionAdmin = await InstitutionAdmin.create({
                institution_id: institutionId,
                user_id,
                role: assignedRole,
            });

            return res.status(201).json({ message: i18next.t('institution.admin.added'), admin: institutionAdmin });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: i18next.t('internal.error') });
        }
    }

    /**
     * removeAdmin()
     *
     * Remove an admin from an institution
     * — Institution admin or Super Admin can do this
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async removeAdmin(req: CustomRequest | any, res: Response): Promise<any> {
        const institutionId: number = req.params.id;
        const userId: number = req.params.userId;

        try {
            const isAuthorized = await InstitutionController.isSuperAdminOrInstitutionAdmin(req.userId, institutionId);
            if (!isAuthorized) {
                return res.status(403).json({ message: i18next.t('unauthorized') });
            }

            // Prevent removing yourself
            if (Number(req.userId) === Number(userId)) {
                return res.status(400).json({ message: i18next.t('institution.admin.cannot.remove.self') });
            }

            const institutionAdmin: InstitutionAdmin | null = await InstitutionAdmin.findOne({
                where: { institution_id: institutionId, user_id: userId }
            });

            if (!institutionAdmin) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'InstitutionAdmin' }) });
            }

            await institutionAdmin.destroy();

            return res.status(200).json({ message: i18next.t('institution.admin.removed') });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: i18next.t('internal.error') });
        }
    }

    /**
     * myInstitution()
     *
     * Get the institution(s) the current user is admin of
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async myInstitution(req: CustomRequest | any, res: Response): Promise<any> {
        try {
            const memberships: Array<InstitutionAdmin> = await InstitutionAdmin.findAll({
                where: { user_id: req.userId },
                include: [{
                    model: Institution,
                    include: [
                        { model: InstitutionTypeModel, attributes: ['id', 'title'] },
                        { model: InstitutionStatusModel, attributes: ['id', 'title'] },
                    ]
                }]
            });

            const institutions = memberships.map(m => m.institution);

            return res.status(200).json({ institutions });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    /**
     * courses()
     *
     * Get all courses of an institution
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async courses(req: Request, res: Response): Promise<any> {
        try {
            const institution: Institution | null = await Institution.findByPk(req.params.id);
            if (!institution) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Institution' }) });
            }

            const courses: Array<Course> = await Course.findAll({
                where: { institution_id: req.params.id },
                include: [{ model: Institution, attributes: ['id', 'name'] }],
            });

            return res.status(200).json({ courses });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    /**
     * stats()
     *
     * Get dashboard statistics for an institution
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async stats(req: Request, res: Response): Promise<any> {
        try {
            const institution: Institution | null = await Institution.findByPk(req.params.id);
            if (!institution) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Institution' }) });
            }

            const totalCourses: number = await Course.count({ where: { institution_id: req.params.id } });
            const totalEnrollments: number = await Enrollment.count({
                include: [{
                    model: Course,
                    where: { institution_id: req.params.id },
                }]
            });
            const totalCertificates: number = await Certificate.count({ where: { institution_id: req.params.id } });
            const totalAdmins: number = await InstitutionAdmin.count({ where: { institution_id: req.params.id } });

            return res.status(200).json({
                stats: {
                    totalCourses,
                    totalEnrollments,
                    totalCertificates,
                    totalAdmins,
                }
            });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    // ───────── Helpers ─────────

    /**
     * Check if user is Super Admin
     */
    private static async isSuperAdmin(userId: number): Promise<boolean> {
        const superAdminRole: Role | null = await Role.findOne({ where: { title: 'Super Admin' } });
        if (!superAdminRole) return false;

        const userRole: UserRole | null = await UserRole.findOne({
            where: { user_id: userId, role_id: superAdminRole.id }
        });
        return !!userRole;
    }

    /**
     * Check if user is Super Admin or an admin of the given institution
     */
    private static async isSuperAdminOrInstitutionAdmin(userId: number, institutionId: number): Promise<boolean> {
        if (await InstitutionController.isSuperAdmin(userId)) return true;

        const institutionAdmin: InstitutionAdmin | null = await InstitutionAdmin.findOne({
            where: { institution_id: institutionId, user_id: userId, role: 'admin' }
        });
        return !!institutionAdmin;
    }
}

export { InstitutionController };
