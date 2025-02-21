/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';

import { CustomRequest } from '../core/types';
import { i18next } from '../core/i18n';
import Category from '../models/course/category.model';
import Role from '../models/authentication/role.model';
import UserRole from '../models/authentication/userRole.model';


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
            const userRole: UserRole | null = await UserRole.findOne({ where: { user_id: req.userId }});
            
            if (!userRole) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'UserRole' }) });
            }

		    const role: Role | null = await Role.findOne({ where: { title: 'Admin' }});
            
            if (!role) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Role' }) });
            }

            if(userRole.role_id === role.id){
                await Category.create({
                    title,
                    description,
                    admin_id: userRole.user_id,
                })
                return res.status(201).json({ message: i18next.t('category.success')});
            } else {
                return res.status(403).json({ message: i18next.t('unauthorized') });
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

        return res.status(200).json({ message: i18next.t('model.saved', { model: 'Category'}), updateCategory });
    } catch (err) {
        console.log(err);

        return res.status(500).json({ error: i18next.t('internal.error') });
    }
  }
}

export { CategoryController }