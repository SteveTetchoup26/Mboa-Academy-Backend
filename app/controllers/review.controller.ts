/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';

import { CustomRequest } from '../core/types';
import { i18next } from '../core/i18n';
import Review from '../models/course/review.model';
import User from '../models/authentication/user.model';
import Course from '../models/course/course.model';
import Enrollment from '../models/enrollment/enrollment.model';
import { Op } from 'sequelize';

/**
 * Controller for course reviews
 *
 * @class
 */
class ReviewController {
    /**
     * create()
     *
     * Create a review for a course (only enrolled students)
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async create(req: CustomRequest | any, res: Response): Promise<any> {
        const { courseId, rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'La note doit être comprise entre 1 et 5' });
        }

        try {
            // Vérifier que l'étudiant est inscrit au cours
            const enrollment = await Enrollment.findOne({
                where: {
                    student_id: req.userId,
                    course_id: courseId,
                }
            });

            if (!enrollment) {
                return res.status(403).json({ message: 'Vous devez être inscrit au cours pour le noter' });
            }

            // Vérifier si l'étudiant a déjà noté ce cours
            const existing = await Review.findOne({
                where: {
                    student_id: req.userId,
                    course_id: courseId,
                }
            });

            if (existing) {
                // Mettre à jour la note existante
                existing.rating = rating;
                existing.comment = comment || existing.comment;
                await existing.save();

                return res.status(200).json({ message: i18next.t('review.updated'), review: existing });
            }

            const review = await Review.create({
                student_id: req.userId,
                course_id: courseId,
                rating,
                comment,
            });

            res.status(201).json({ message: i18next.t('review.created'), review });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: i18next.t('internal.error') });
        }
    }

    /**
     * byCourse()
     *
     * Get all reviews for a course
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async byCourse(req: Request, res: Response): Promise<any> {
        try {
            const reviews: Array<Review> = await Review.findAll({
                where: { course_id: req.params.courseId },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            // Calculer la moyenne
            const total = reviews.reduce((sum, r) => sum + r.rating, 0);
            const averageRating = reviews.length > 0 ? Math.round((total / reviews.length) * 10) / 10 : 0;

            return res.status(200).json({ reviews, averageRating, reviewsCount: reviews.length });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    /**
     * userReview()
     *
     * Get the review of the authenticated user for a course
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async userReview(req: CustomRequest | any, res: Response): Promise<any> {
        try {
            const review: Review | null = await Review.findOne({
                where: {
                    student_id: req.userId,
                    course_id: req.params.courseId,
                }
            });

            return res.status(200).json({ review });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

    /**
     * destroy()
     *
     * Delete a review
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async destroy(req: CustomRequest | any, res: Response): Promise<any> {
        try {
            const review: Review | null = await Review.findOne({
                where: { id: req.params.id }
            });

            if (!review) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Review' }) });
            }

            if (review.student_id !== req.userId) {
                return res.status(403).json({ message: i18next.t('unauthorized') });
            }

            await review.destroy();
            return res.status(200).json({ message: i18next.t('model.deleted', { model: 'Review' }) });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }
}

export { ReviewController };
