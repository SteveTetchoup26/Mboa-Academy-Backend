/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';

import { CustomRequest } from '../core/types';
import { i18next } from '../core/i18n';
import Enrollment from '../models/enrollment/enrollment.model';
import EnrollmentStatus from '../models/enrollment/enrollmentStatus.model';
import User from '../models/authentication/user.model';
import Module from '../models/course/module.model';
import Lesson from '../models/course/lesson.model';
import EnrollmentEvolution from '../models/enrollment/enrollmentEvolution.model';
import Course from '../models/course/course.model';
import { Op } from 'sequelize';


/**
 * Controller for user details
 *
 * @class
 */
class EnrollmentController {
    /**
   * create()
   *
   * create a new enrollment
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
    // public static async create(req: CustomRequest|any, res: Response): Promise<any> {
	// 	const { course_id } = req.body;

    //     try{
    //         const status: EnrollmentStatus | null = await EnrollmentStatus.findOne({
    //             where: { title: 'Init' }
    //         });
    //         if(!status){
    //             return res.status(404).json({ message: i18next.t('model.not.found', { model: 'EnrollmentStatus' }) });
    //         }

    //         await Enrollment.create({
    //             course_id,
    //             user_id: req.userId,
    //             status_id: status.id,
    //             progress: 0
    //         });

    //         return res.status(201).json({ message: i18next.t('enrollment.success') });
    //     } catch (err) {
    //         console.log(err);

    //         return res.status(500).json({ error: i18next.t('internal.error') });
    //     }
	// }

    /**
   * all()
   *
   * Get all enrollments in the database
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
    public static async all(req: Request, res: Response): Promise<any> {
		try {
			const enrollments: Array<Enrollment> = await Enrollment.findAll({
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            });

			return res.status(200).json({ enrollments });
		} catch (err) {
			console.log(err);

			return res.status(500).json({ error: i18next.t('internal.error') });
		}
	}

    /**
   * one()
   *
   * Get an enrollment by it's ID
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
	public static async one(req: CustomRequest | any, res: Response): Promise<any> {
        try {
            const enrollment: Enrollment | null = await Enrollment.findOne({ 
                where: { id: req.params.id },
                attributes: { exclude: ['createdAt', 'updatedAt'] },
                include: [
                    {
                        model: User,
                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                    },
                    {
                        model: EnrollmentStatus,
                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                    },
                    {
                        model: Course,
                        attributes: { exclude: ['instructor_id', 'language_id', 'createdAt'] }
                    }
                ]
            });

            if (!enrollment) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Enrollment' }) });
            }

            return res.status(200).json({ enrollment });
        } catch (err) {
            console.log(err);

            return res.status(500).json({ error: i18next.t('internal.error') });
        }
	}

    /**
   * destroy()
   *
   * Delete an enrollment in the database
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
	public static async destroy(req: CustomRequest|any, res: Response): Promise<any> {}   

    /**
   * update()
   *
   * Update information of the enrollment
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
	public static async update(req: CustomRequest | any, res: Response): Promise<any> {
        const { progress } = req.body;
        try {
            const user: any = await User.findOne({ where: { id: req.userId }});

            if (!user) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'User' }) });
            }

            const status: EnrollmentStatus | null = await EnrollmentStatus.findOne({
                where: { title: 'Ongoing' }
            });

            if(!status){
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'EnrollmentStatus' }) });
            }

            if (progress !== null) {
                await Enrollment.update({
                    status_id: status.id,
                    progress
                }, {
                    where: { user_id: user.id }
                });
            }

            return res.json({ message: i18next.t('model.saved', { model: 'Enrollment'}) });
        } catch (err) {
            console.log(err);

            return res.status(500).json({ message: i18next.t('internal.error') });
        }
    }


    /**
     * enrollWithCode()
     *
     * Enroll in a private course using an access code
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async enrollWithCode(req: CustomRequest | any, res: Response): Promise<any> {
        const { course_id, access_code } = req.body;

        try {
            if (!course_id || !access_code) {
                return res.status(400).json({ message: 'course_id et access_code sont requis' });
            }

            const course: Course | null = await Course.findByPk(course_id);
            if (!course) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Course' }) });
            }

            if (course.visibility !== 'private') {
                return res.status(400).json({ message: 'Ce cours n\'est pas privé' });
            }

            if (course.access_code !== access_code) {
                return res.status(400).json({ message: 'Code d\'accès invalide' });
            }

            // Vérifier si déjà inscrit
            const existing = await Enrollment.findOne({
                where: { course_id, student_id: req.userId }
            });
            if (existing) {
                return res.status(400).json({ message: 'Vous êtes déjà inscrit à ce cours' });
            }

            const initStatus: EnrollmentStatus | null = await EnrollmentStatus.findOne({
                where: { title: 'Init' }
            });
            if (!initStatus) {
                return res.status(500).json({ message: 'Statut Init introuvable' });
            }

            const enrollment = await Enrollment.create({
                course_id,
                student_id: req.userId,
                status_id: initStatus.id,
                progress: 0,
            });

            return res.status(201).json({
                message: 'Inscription réussie',
                enrollment,
            });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    // TODO for evolution lesson

    public static async initProgressLesson(req: CustomRequest | any, res: Response): Promise<any> {
        const { progress } = req.body;
        try {
            const user: User | null = await User.findOne({ where: { id: req.userId }});
        
            if (!user) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'User' }) });
            }

            const status: EnrollmentStatus | null = await EnrollmentStatus.findOne({
                where: { title: 'Init' }
            });

            if(!status){
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'EnrollmentStatus' }) });
            }

            const enrollment: Enrollment | null = await Enrollment.findOne({ where: { user_id: user.id } });

            if(!enrollment) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'EnrollmentEvolution' }) });
            }

            const module: Module | null = await Module.findOne({ where: { course_id: enrollment.course_id }});
            const lesson: Lesson | null = await Lesson.findOne({ where: { module_id: module?.id } });

            await EnrollmentEvolution.create({
                enrollment_id: enrollment.id,
                lesson_id: lesson?.id,
                status_id: status.id,
                progress
            })

        } catch (err){
            console.log(err);

            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    public static async updateProgressLesson(req: CustomRequest | any, res: Response): Promise<any> {
        const { progress } = req.body;
        try {
            const user: any = await User.findOne({ where: { id: req.userId }});

            if (!user) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'User' }) });
            }

            const status: EnrollmentStatus | null = await EnrollmentStatus.findOne({
                where: { title: 'Ongoing' }
            });

            if(!status){
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'EnrollmentStatus' }) });
            }

            if (progress !== null) {
                await EnrollmentEvolution.update({
                    status_id: status.id,
                    progress
                }, {
                    where: { user_id: user.id }
                });
            }

            return res.json({ message: i18next.t('model.saved', { model: 'Enrollment'}) });
        } catch (err) {
            console.log(err);

            return res.status(500).json({ message: i18next.t('internal.error') });
        }
    }
}

export { EnrollmentController }