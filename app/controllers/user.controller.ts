/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';

import { CustomRequest } from '../core/types';
import { i18next } from '../core/i18n';
import User from '../models/authentication/user.model';
import UserStatus from '../models/authentication/userStatus.model';
import Role from '../models/authentication/role.model';
import UserRole from '../models/authentication/userRole.model';
import Expertise from '../models/authentication/expertise.model';


/**
 * Controller for user details
 *
 * @class
 */
class UserController {
    /**
   * me()
   *
   * Get the informations of the user authenticated
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
    public static async me(req: CustomRequest|any, res: Response): Promise<any> {
		try {
			// if (!req.userId) {
			// 	return res.status(401).json({ message: "User ID not found in request" });
			// }
			const user: User | null = await User.findOne({ 
                where: { id: req.userId },
                attributes: { exclude: ['password', 'createdAt', 'updatedAt']},
				include: {
					model: Role,
					through: { attributes: [] }
				}
            });

			if (!user) {
				return res.status(404).json({ message: i18next.t('no.user') });
			}

			return res.json({ user });
		} catch (err) {
			console.log(err);

			return res.status(500).json({ error: i18next.t('internal.error') });
		}
	}

    /**
   * all()
   *
   * Get all users in the database
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
    public static async all(req: Request, res: Response): Promise<any> {
		try {
			const users: Array<User> = await User.findAll({
                attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
				include: [
					{
						model: Role,
						through: { attributes: [] }
					},{
						model: UserStatus,
						attributes: ['id', 'title']
					}
				]
            });

			return res.json({ users });
		} catch (err) {
			console.log(err);

			return res.status(500).json({ error: i18next.t('internal.error') });
		}
	}

    /**
   * one()
   *
   * Get an user by it's ID
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
	public static async one(req: Request, res: Response): Promise<any> {
		try {
			const user: User | null = await User.findOne({ 
				where: { id: req.params.id },
				attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }
			});

			if (!user) {
				return res.status(404).json({ message: i18next.t('model.not.found', { model: 'User' }) });
			}

			return res.status(200).json({ user });
		} catch (err) {
			console.log(err);

			return res.status(500).json({ error: i18next.t('internal.error') });
		}
	}

    /**
   * destroy()
   *
   * Delete an user in the database
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
	public static async destroy(req: CustomRequest|any, res: Response): Promise<any> {
		const id: number = req.params.id;

		try {
			if (req.userId === id) {
                const status: UserStatus | null = await UserStatus.findOne({ where: { title: 'Archived'}});
				await User.update({
                    status_id: status?.id
                },{
                    where: { id }
                });
			}

			return res.json({ message: i18next.t('model.deleted', { model: 'User' }) });
		} catch (err) {
			console.log(err);

			return res.status(500).json({ error: i18next.t('internal.error') });
		}
	}

    /**
   * update()
   *
   * Update information of the authenticated user
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
	public static async update(req: CustomRequest|any, res: Response): Promise<any> {
		const uid: string = req.body.uid;
		const authUserId: string = req.userId;
		const data: any = req.body;
		let updatedUser: User | null = null;

		try {
			if (uid !== authUserId) {
				return res.status(403).json({ message: i18next.t('unauthorized.resource') });
			}

			const user: any = await User.findOne({ where: { id: uid }});

			if (!user) {
				return res.status(404).json({ message: i18next.t('model.not.found', { model: 'User' }) });
			}

			if (data !== null) {
				await User.update(data, {
					where: { id: uid}
				});
			}
			updatedUser = await User.findOne({ 
				where: { id: uid },
				include: {
					model: Role,
					through: { attributes: [] }
				}
			});

			return res.json({ message: i18next.t('model.saved', { model: 'User'}), updatedUser });
		} catch (err) {
			console.log(err);

			return res.status(500).json({ message: i18next.t('internal.error') });
		}
	}

	/**
   * becomeInstructor()
   *
   * Update the user to become an instructor
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   *
   * @return Object
   */
	public static async becomeInstructor(req: CustomRequest|any, res: Response): Promise<any> {
		const { email, phone_number, domain, job_title } = req.body;

		try {
			const user = await User.findOne({ 
				where: { 
					id: req.userId ,
					email
				}
			});

			if (!user) {
				return res.status(404).json({ message: i18next.t('unauthorized') });
			}

			await user.update({
				phone_number,
			});

			const instructorRole: Role | null = await Role.findOne({ where: { title: 'Instructor' }});

			if (!instructorRole) {
				return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Role' }) });
			}

			await UserRole.create({
				user_id: user.id,
				role_id: instructorRole.id
			});

			await Expertise.create({
				instructor_id: user.id,
                domain,
                job_title
			});

			const updatedUser: User | null  = await User.findOne({ 
				where: { 
					id: req.userId ,
					email
				}, 
				attributes: { exclude: ['password', 'email_token', 'createdAt', 'updatedAt'] },
				include: {
					model: Role,
                    through: { attributes: [] }
				}
			});

			return res.json({ message: i18next.t('model.saved', { model: 'User'}), updatedUser });
			
		} catch (err) {
			console.log(err);

			return res.status(500).json({ message: i18next.t('internal.error') });
		}
	}
}

export { UserController }