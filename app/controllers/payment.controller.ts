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
import PaymentStatus from '../models/payment/paymentStatus.model';
import Payment from '../models/payment/payment.model';
import PaymentMethod from '../models/payment/paymentMethod.model';
import Course from '../models/course/course.model';


/**
 * Controller for user details
 *
 * @class
 */
class PaymentController {
    /**
   * create()
   *
   * create a payment enrollment
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
    public static async create(req: CustomRequest|any, res: Response): Promise<any> {
        const { courseId, paymentMethodId, amount } = req.body;
        const transaction = await Course.sequelize?.transaction();
		
        try {
            const student: User | null = await User.findOne({ where: { id: req.userId }});
            if (!student) {
                return res.status(404).json({ message: i18next.t('unauthorized') });
            }

            const paymentMethod: PaymentMethod | null = await PaymentMethod.findOne({ where: { id: paymentMethodId }});
            if (!paymentMethod) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'PaymentMethod' }) });
            }


            const pending: PaymentStatus | null = await PaymentStatus.findOne({ where: { title: 'Pending' } });

            const payment = await Payment.create({
                student_id: student.id,
                payment_method_id: paymentMethod.id,
                payment_status_id: pending?.id,
                course_id: courseId,
                amount
            }, { transaction });

            // Simuler un paiement avec 100% de chances de succès
            const status = Math.random() >= 0 ? "Success" : "Failed";
            const paymentStatus = await PaymentStatus.findOne({ where: { title: status } });


            if (status !== "Success") {
                await Payment.update(
                    { status_id: paymentStatus?.id }, 
                    { where: { id: payment.id } }
                );
                return res.status(400).json({success: false, message: i18next.t('payment.failed') });
            }
            
            await Payment.update({ status_id: paymentStatus?.id }, { where: { id: payment.id } });


            const statusEnroll: EnrollmentStatus | null = await EnrollmentStatus.findOne({
                where: { title: 'Init' }
            });

            const enrollment = await Enrollment.create({
                student_id: student.id,
                course_id: courseId,
                status_id: statusEnroll?.id,
                progress: 0,
            }, { transaction });

            await transaction?.commit();
        
            res.status(201).json({success: true, message: i18next.t('enrollment.success'), enrollment });
        } catch (err) {
            console.log(err);

            return res.status(500).json({ error: i18next.t('internal.error') });
        }
	} 
    
    /**
       * all()
       *
       * Get all payments in the database
       *
       * @param {Request} req: Request object
       * @param {Response} res: Response object
       * @param {NextFunction} next: NextFunction object
       *
       * @return Object
    */
    public static async all(req: Request, res: Response): Promise<any> {
        try {
            const payments: Array<Payment> = await Payment.findAll({
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            });

            return res.status(200).json({ payments });
        } catch (err) {
            console.log(err);

            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }

     /**
       * one()
       *
       * Get an payment by it's ID
       *
       * @param {Request} req: Request object
       * @param {Response} res: Response object
       * @param {NextFunction} next: NextFunction object
       *
       * @return Object
    */
    public static async one(req: Request, res: Response): Promise<any> {
        try {
            const payment: Payment | null = await Payment.findOne({ 
                where: { id: req.params.id },
                attributes: { exclude: ['createdAt', 'updatedAt'] },
                include: [
                    {
                        model: User,
                        attributes: { exclude: ['password', 'email_token', 'createdAt', 'updatedAt'] }
                    },
                    {
                        model: PaymentMethod,
                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                    },
                    {
                        model: PaymentStatus,
                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                    }, 
                    {
                        model: Course,
                        attributes: { exclude: ['instructor_id', 'language_id', 'createdAt'] }
                    }
                ]
            });

            if (!payment) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Enrollment' }) });
            }

            return res.status(200).json({ payment });
        } catch (err) {
            console.log(err);

            return res.status(500).json({ error: i18next.t('internal.error') });
        }
    }
}

export { PaymentController }