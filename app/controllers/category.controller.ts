/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';

import { CustomRequest } from '../core/types';
import { i18next } from '../core/i18n';
import Category from '../models/course/category.model';
import CourseStatus from '../models/course/courseStatus.model';
import User from '../models/authentication/user.model';
import UserStatus from '../models/authentication/userStatus.model';


/**
 * Controller for category details
 *
 * @class
 */
class CategoryController {
     /**
   * create()
   *
   * create category in the database
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
  public static async create(req: CustomRequest | any, res: Response,): Promise<any> {
        const { title, description } = req.body;

        try {
            const user: User | null = await User.findOne({ where: { id: req.userId }});
            if (!user) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'User' }) });
            }

		    const status: UserStatus | null = await UserStatus.findOne({ where: { title: 'Admin' } });
            if (!status) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Course' }) });
            }

            if(user.status_id === status.id){
                await Category.create({
                    title,
                    description,
                    admin_id: user.id,
                })
            }
        } catch (err) {
            console.log(err);

            return res.status(500).json({ message: i18next.t('internal.error')});
        }
    
  }


    /**
   * all()
   *
   * Get all categories in the database
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
    public static async all(req: CustomRequest | any, res: Response): Promise<any> { 
		try {
            const categories: Array<Category> = await Category.findAll({
                attributes: { exclude: ['admin_id']}
            });

            return res.status(200).json({ categories });
		} catch (err) {
			console.log(err);

			return res.status(500).json({ error: i18next.t('internal.error') });
		}
	}

    /**
   * one()
   *
   * Get an category by it's ID
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
	public static async one(req: Request, res: Response): Promise<any> {
		try {
			const category: Category | null = await Category.findByPk(
                req.params.id, 
                {
                    attributes: { exclude: ['admin_id']}
                }
            );

            return res.status(200).json({ category });
		} catch (err) {
			console.log(err);

			return res.status(500).json({ error: i18next.t('internal.error') });
		}
	}

    /**
   * destroy()
   *
   * Delete (archived) an category in the database
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
	public static async destroy(req: CustomRequest | any, res: Response): Promise<any> {
		const id: number = req.params.id;
		try {
            const category: Category | null = await Category.findOne({ where: { id } });
            if (!category) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Category' }) });
            }

            const status: UserStatus | null = await UserStatus.findOne({ where: { title: 'Admin' } });
            if (!status) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Course' }) });
            }

            if (req.userId === category.admin_id) {
                const status: CourseStatus | null = await CourseStatus.findOne({ where: { title: 'Archived'}});
                await Category.update({
                    status_id: status?.id
                },{
                    where: { id }
                });
            }

            return res.status(200).json({ message: i18next.t('model.deleted', { model: 'Course' }) });
		} catch (err) {
			console.log(err);

			return res.status(500).json({ error: i18next.t('internal.error') });
		}
	}

     /**
   * update()
   *
   * update category in the database
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
  public static async update(req: CustomRequest | any, res: Response,): Promise<any> {
    const id: number = req.params.id;
    const data: any = req.body;
    let updateCategory: Category | null;
    try {
        const category: Category | null = await Category.findOne({ where: { id } });
        if (!category) {
            return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Category' }) });
        }

        if (req.userId === category.admin_id) {
            await Category.update(data, {
                where: { id: category.id }
            })
        }
        updateCategory = await Category.findOne({ where: { id: category.id } });

        return res.status(200).json({ updateCategory });
    } catch (err) {
        console.log(err);

        return res.status(500).json({ error: i18next.t('internal.error') });
    }
  }
}

export { CategoryController }