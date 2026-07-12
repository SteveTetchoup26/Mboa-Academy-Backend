/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';

import { CustomRequest } from '../core/types';
import * as config from '../core/config';
import { i18next } from '../core/i18n';
import mailer from '../core/mailer';
import Institution from '../models/institution/institution.model';
import InstitutionTypeModel from '../models/institution/institutionType.model';
import InstitutionStatusModel from '../models/institution/institutionStatus.model';
import InstitutionAdmin from '../models/institution/institutionAdmin.model';
import User from '../models/authentication/user.model';
import UserStatus from '../models/authentication/userStatus.model';
import Role from '../models/authentication/role.model';
import UserRole from '../models/authentication/userRole.model';
import Course from '../models/course/course.model';
import CourseStatus from '../models/course/courseStatus.model';
import Module from '../models/course/module.model';
import Lesson from '../models/course/lesson.model';
import Objective from '../models/course/objective.model';
import Feature from '../models/course/feature.model';
import LanguageCourse from '../models/course/language.model';
import Category from '../models/course/category.model';
import CourseCategory from '../models/course/courseCategory.model';
import CoverCourse from '../models/course/coverCourse.model';
import VideoLesson from '../models/course/videoLesson.model';
import Enrollment from '../models/enrollment/enrollment.model';
import Certificate from '../models/course/certificate.model';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import * as crypto from 'crypto';


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
     * with the "Institution" role and "Pending" status (email verification required).
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
                creatorUser = await User.findOne({
                    where: { email: creator_email },
                    include: [{ model: Role }]
                });
            }

            // ── Vérifications si l'utilisateur existe déjà ──
            if (creatorUser) {
                const userRoles = creatorUser.roles?.map((r: any) => r.title) || [];

                // Un apprenant ou formateur ne peut pas créer d'institution
                if (userRoles.includes('Student') || userRoles.includes('Instructor')) {
                    return res.status(400).json({
                        message: 'Vous ne pouvez pas créer d\'institution avec un compte apprenant ou formateur. Utilisez un autre email ou créez un nouveau compte.'
                    });
                }

                // Un utilisateur ne peut gérer qu'une seule institution
                const existingAdmin = await InstitutionAdmin.findOne({ where: { user_id: creatorUser.id } });
                if (existingAdmin) {
                    return res.status(400).json({
                        message: 'Vous gérez déjà une institution. Un utilisateur ne peut gérer qu\'une seule institution.'
                    });
                }
            }

            let emailToken = '';

            if (!creatorUser) {
                // Créer un nouvel utilisateur
                if (!creator_name || !creator_email || !creator_password) {
                    return res.status(400).json({ message: 'Les informations du créateur (nom, email, mot de passe) sont requises' });
                }

                const pendingStatus: UserStatus | null = await UserStatus.findOne({ where: { title: 'Pending' } });
                if (!pendingStatus) {
                    return res.status(500).json({ message: 'Statut Pending introuvable' });
                }

                const hashedPassword = await bcrypt.hash(creator_password, 10);
                emailToken = bcrypt.hashSync(creator_email, 8);

                creatorUser = await User.create({
                    name: creator_name,
                    email: creator_email,
                    password: hashedPassword,
                    status_id: pendingStatus.id,
                    phone_number: creator_phone || '',
                    email_token: emailToken,
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

            // ── 4. Envoyer l'email de confirmation si nouveau compte ──
            if (emailToken) {
                try {
                    await mailer.sendMail({
                        to: creatorUser.email,
                        subject: 'mail.subject.confirm.account',
                        template: 'confirm-account-email',
                        context: {
                            url: `${config.WEB_APP_URL}/${config.CONFIRM_ACCOUNT_PATH}?token=${emailToken}`,
                            name: creatorUser.name,
                            email: creatorUser.email,
                        },
                    });
                } catch (emailError) {
                    await transaction?.rollback();
                    console.error("Erreur d'envoi email :", emailError);
                    return res.status(500).json({
                        success: false,
                        message: i18next.t('mail.error.sending')
                    });
                }
            }

            await transaction?.commit();

            const userCreated = !!emailToken;

            return res.status(201).json({
                message: i18next.t('institution.created'),
                institution,
                user: userCreated ? {
                    id: creatorUser.id,
                    name: creatorUser.name,
                    email: creatorUser.email,
                    message: 'Compte créé. Veuillez vérifier votre adresse email avant de vous connecter.'
                } : undefined
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
                attributes: {
                    include: [
                        [
                            Sequelize.literal(`(
                                SELECT COUNT(*) FROM "enrollment" AS "enrollment"
                                WHERE "enrollment"."course_id" = "Course"."id"
                            )`),
                            'enrolledCount'
                        ]
                    ]
                },
                include: [
                    { model: Institution, attributes: ['id', 'name'] },
                    { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] },
                    { model: CourseStatus, attributes: ['id', 'title'] },
                ],
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

    // ───────── Course Management ─────────

    /**
     * createCourse()
     *
     * Create a course for an institution
     * — Institution admin only
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async createCourse(req: CustomRequest | any, res: Response): Promise<any> {
        const institutionId: number = req.params.id;

        // Support both JSON body and FormData (JSON.stringified 'data' field)
        const body = req.body.data ? JSON.parse(req.body.data) : req.body;
        const {
            title, description, price, original_price,
            instructor_id, visibility,
            modules, objectives, features,
            language, categories,
        } = body;

        try {
            const isAuthorized = await InstitutionController.isSuperAdminOrInstitutionAdmin(req.userId, institutionId);
            if (!isAuthorized) {
                return res.status(403).json({ message: i18next.t('unauthorized') });
            }

            const institution: Institution | null = await Institution.findByPk(institutionId);
            if (!institution) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Institution' }) });
            }

            // Statut par défaut : 'Submit' (en attente de validation)
            const submitStatus: CourseStatus | null = await CourseStatus.findOne({ where: { title: 'Submit' } });
            if (!submitStatus) {
                return res.status(500).json({ message: 'Statut Submit introuvable' });
            }

            // Générer un code d'accès si privé
            let accessCode: string | null = null;
            if (visibility === 'private') {
                accessCode = InstitutionController.generateAccessCode();
            }

            // Langue
            let languageId: number | null = null;
            if (language && language.description) {
                const lang = await LanguageCourse.create({ code: language.code || 'FR', description: language.description });
                languageId = lang.id;
            }

            const course = await Course.create({
                title,
                description,
                price: price || 0,
                original_price: original_price || null,
                institution_id: institutionId,
                instructor_id: instructor_id || null,
                language_id: languageId,
                status_id: submitStatus.id,
                visibility: visibility || 'public',
                access_code: accessCode,
            });

            // Créer les modules et leçons (avec vidéos)
            const videoFiles = req.files && 'videos' in req.files ? (req.files as any).videos : [];
            let videoIdx = 0;

            if (modules && modules.length > 0) {
                for (const moduleData of modules) {
                    const mod = await Module.create({
                        title: moduleData.title,
                        resume: moduleData.resume || '',
                        course_id: course.id,
                    });

                    if (moduleData.lessons && moduleData.lessons.length > 0) {
                        for (const lessonData of moduleData.lessons) {
                            const lesson = await Lesson.create({
                                title: lessonData.title,
                                resume: lessonData.resume || '',
                                module_id: mod.id,
                            });

                            // Associer la vidéo à la leçon (positionnel)
                            if (videoFiles[videoIdx]) {
                                await VideoLesson.create({
                                    lesson_id: lesson.id,
                                    file_name: 'lessons_video/' + videoFiles[videoIdx].filename,
                                    format: videoFiles[videoIdx].mimetype,
                                });
                            }
                            videoIdx++;
                        }
                    }
                }
            }

            // Créer les objectifs
            if (objectives && objectives.length > 0) {
                await Objective.bulkCreate(
                    objectives.map((obj: string) => ({ title: obj, course_id: course.id }))
                );
            }

            // Créer les fonctionnalités
            if (features && features.length > 0) {
                await Feature.bulkCreate(
                    features.map((feat: string) => ({ title: feat, course_id: course.id }))
                );
            }

            // Associer les catégories
            if (categories && categories.length > 0) {
                for (const categoryId of categories) {
                    const cat = await Category.findByPk(categoryId);
                    if (cat) {
                        await CourseCategory.create({ course_id: course.id, category_id: cat.id });
                    }
                }
            }

            // Image de couverture (FormData)
            if (req.files && 'cover_image' in req.files) {
                const coverFile = (req.files as any).cover_image[0];
                await CoverCourse.create({
                    file_name: 'cover_course/' + coverFile.filename,
                    format: coverFile.mimetype,
                    course_id: course.id,
                });
            }

            const created = await Course.findByPk(course.id, {
                include: [
                    { model: Institution, attributes: ['id', 'name'] },
                    { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] },
                    { model: CourseStatus, attributes: ['id', 'title'] },
                    { model: Module, include: [{ model: Lesson, attributes: ['id', 'title', 'resume'] }] },
                    { model: Objective, attributes: ['id', 'title'] },
                    { model: Feature, attributes: ['id', 'title'] },
                ],
            });

            return res.status(201).json({ message: 'Cours créé avec succès', course: created });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    /**
     * updateCourse()
     *
     * Update a course of an institution
     * — Institution admin only
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async updateCourse(req: CustomRequest | any, res: Response): Promise<any> {
        const institutionId: number = req.params.id;
        const courseId: number = req.params.courseId;
        const data: any = req.body;

        try {
            const isAuthorized = await InstitutionController.isSuperAdminOrInstitutionAdmin(req.userId, institutionId);
            if (!isAuthorized) {
                return res.status(403).json({ message: i18next.t('unauthorized') });
            }

            const course: Course | null = await Course.findOne({
                where: { id: courseId, institution_id: institutionId }
            });
            if (!course) {
                return res.status(404).json({ message: 'Cours introuvable' });
            }

            // Si on passe en privé et qu'il n'y a pas encore de code
            if (data.visibility === 'private' && !course.access_code) {
                data.access_code = InstitutionController.generateAccessCode();
            }

            // Si on passe en public, supprimer le code d'accès
            if (data.visibility === 'public') {
                data.access_code = null;
            }

            // Extraire les relations du body pour ne pas les passer à update()
            const { modules, objectives, features, ...courseData } = data;

            await Course.update(courseData, { where: { id: courseId } });

            // Mettre à jour les modules et leçons
            if (modules && modules.length > 0) {
                // Supprimer les anciens modules (les leçons sont cascade)
                const oldModules = await Module.findAll({ where: { course_id: courseId } });
                for (const oldMod of oldModules) {
                    await Lesson.destroy({ where: { module_id: oldMod.id } });
                }
                await Module.destroy({ where: { course_id: courseId } });

                for (const moduleData of modules) {
                    const mod = await Module.create({
                        title: moduleData.title,
                        resume: moduleData.resume || '',
                        course_id: courseId,
                    });

                    if (moduleData.lessons && moduleData.lessons.length > 0) {
                        for (const lessonData of moduleData.lessons) {
                            await Lesson.create({
                                title: lessonData.title,
                                resume: lessonData.resume || '',
                                module_id: mod.id,
                            });
                        }
                    }
                }
            }

            // Mettre à jour les objectifs
            if (objectives && objectives.length > 0) {
                await Objective.destroy({ where: { course_id: courseId } });
                await Objective.bulkCreate(
                    objectives.map((obj: string) => ({ title: obj, course_id: courseId }))
                );
            }

            // Mettre à jour les fonctionnalités
            if (features && features.length > 0) {
                await Feature.destroy({ where: { course_id: courseId } });
                await Feature.bulkCreate(
                    features.map((feat: string) => ({ title: feat, course_id: courseId }))
                );
            }

            const updated = await Course.findByPk(courseId, {
                include: [
                    { model: Institution, attributes: ['id', 'name'] },
                    { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] },
                    { model: CourseStatus, attributes: ['id', 'title'] },
                    { model: Module, include: [{ model: Lesson, attributes: ['id', 'title', 'resume'] }] },
                    { model: Objective, attributes: ['id', 'title'] },
                    { model: Feature, attributes: ['id', 'title'] },
                ],
            });

            return res.status(200).json({ message: 'Cours mis à jour', course: updated });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    /**
     * publishCourse()
     *
     * Publish a course (change status from 'Submit' to 'Published')
     * — Institution admin only
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async publishCourse(req: CustomRequest | any, res: Response): Promise<any> {
        const institutionId: number = req.params.id;
        const courseId: number = req.params.courseId;

        try {
            const isAuthorized = await InstitutionController.isSuperAdminOrInstitutionAdmin(req.userId, institutionId);
            if (!isAuthorized) {
                return res.status(403).json({ message: i18next.t('unauthorized') });
            }

            const course: Course | null = await Course.findOne({
                where: { id: courseId, institution_id: institutionId }
            });
            if (!course) {
                return res.status(404).json({ message: 'Cours introuvable' });
            }

            const publishedStatus: CourseStatus | null = await CourseStatus.findOne({ where: { title: 'Published' } });
            if (!publishedStatus) {
                return res.status(500).json({ message: 'Statut Published introuvable' });
            }

            await Course.update({ status_id: publishedStatus.id }, { where: { id: courseId } });

            const updated = await Course.findByPk(courseId, {
                include: [
                    { model: Institution, attributes: ['id', 'name'] },
                    { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] },
                    { model: CourseStatus, attributes: ['id', 'title'] },
                ],
            });

            return res.status(200).json({ message: 'Cours publié avec succès', course: updated });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    /**
     * deleteCourse()
     *
     * Delete a course of an institution
     * — Institution admin only
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async deleteCourse(req: CustomRequest | any, res: Response): Promise<any> {
        const institutionId: number = req.params.id;
        const courseId: number = req.params.courseId;

        try {
            const isAuthorized = await InstitutionController.isSuperAdminOrInstitutionAdmin(req.userId, institutionId);
            if (!isAuthorized) {
                return res.status(403).json({ message: i18next.t('unauthorized') });
            }

            const course: Course | null = await Course.findOne({
                where: { id: courseId, institution_id: institutionId }
            });
            if (!course) {
                return res.status(404).json({ message: 'Cours introuvable' });
            }

            await Course.destroy({ where: { id: courseId } });

            return res.status(200).json({ message: 'Cours supprimé avec succès' });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    /**
     * generateCourseAccessCode()
     *
     * Generate a new access code for a private course
     * — Institution admin only
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async generateCourseAccessCode(req: CustomRequest | any, res: Response): Promise<any> {
        const institutionId: number = req.params.id;
        const courseId: number = req.params.courseId;

        try {
            const isAuthorized = await InstitutionController.isSuperAdminOrInstitutionAdmin(req.userId, institutionId);
            if (!isAuthorized) {
                return res.status(403).json({ message: i18next.t('unauthorized') });
            }

            const course: Course | null = await Course.findOne({
                where: { id: courseId, institution_id: institutionId }
            });
            if (!course) {
                return res.status(404).json({ message: 'Cours introuvable' });
            }

            if (course.visibility !== 'private') {
                return res.status(400).json({ message: 'Le cours doit être privé pour générer un code d\'accès' });
            }

            const accessCode = InstitutionController.generateAccessCode();
            await Course.update({ access_code: accessCode }, { where: { id: courseId } });

            return res.status(200).json({ message: 'Code d\'accès généré', access_code: accessCode });
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

    /**
     * Generate a unique access code for a private course
     * Format: INST-XXXX-XXXX
     */
    private static generateAccessCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const part1 = Array.from({ length: 4 }, () => chars[crypto.randomInt(0, chars.length)]).join('');
        const part2 = Array.from({ length: 4 }, () => chars[crypto.randomInt(0, chars.length)]).join('');
        return `INST-${part1}-${part2}`;
    }
}

export { InstitutionController };
