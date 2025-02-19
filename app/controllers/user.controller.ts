/* eslint-disable @typescript-eslint/no-explicit-any */
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';

import { Request, Response, NextFunction } from 'express';

import { CustomRequest, UploadedFile } from '../core/types';
import { i18next } from '../core/i18n';
import User from '../models/authentication/user.model';


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
    public static async me(req: CustomRequest|any, res: Response, next: NextFunction): Promise<any> {
		try {
			const user: User | null = await User.findOne({ 
                where: { id: req.userId },
                attributes: { exclude: ['password']}
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
    public static async all(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
			const users: Array<User> = await User.findAll({
                attributes: { exclude: ['password'] }
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
	public static async one(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
			const user: User | null = await User.findOne({ where: { id: req.params.id }});

			if (!user) {
				return res.status(404).json({ message: i18next.t('model.not.found', { model: 'User' }) });
			}

			return res.json({ user });
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
	public static async destroy(req: CustomRequest|any, res: Response, next: NextFunction): Promise<any> {
		const id: number = req.params.id;

		try {
			if (req.userId === id) {
				await User.destroy({ where: { id: id } });
			}

			// TODO check if authenticated user has privilege to delete

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
	public static async update(req: CustomRequest|any, res: Response, next: NextFunction): Promise<any> {
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
			updatedUser = await User.findOne({ where: { id: uid }});

			return res.json({ updatedUser });
		} catch (err) {
			console.log(err);

			return res.status(500).json({ message: i18next.t('internal.error') });
		}
	}
}

export { UserController }