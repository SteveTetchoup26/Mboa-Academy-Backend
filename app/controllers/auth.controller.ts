/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as config from '../core/config';

import { decodeJwtToken } from "../core/middleware/auth";
import { TokenInfo } from '../core/types';
import { i18next } from '../core/i18n';
import mailer from '../core/mailer';


import User from "../models/authentication/user.model";
import UserStatus from "../models/authentication/userStatus.model";
import UserRole from "../models/authentication/userRole.model";
import Role from "../models/authentication/role.model";



const {
	JWT_SECRET, JWT_EXPIRE, JWT_EMAIL_EXPIRE, JWT_EMAIL_SECRET, WEB_APP_URL, RESET_PASSWORD_PATH
}: any = config;

/**
 * Controller for authentication
 * 
 * @class
 */

class AuthController {

    /**
     *  register()
     * 
     * creates a new user and save to the database
     * 
     * @param {Request} req Request object
     * @param {Response} res Response object
     * @param {NextFunction} next NextFunction object
     * 
     * @return Object
     */
    public static async register(req: Request, res: Response, next: NextFunction): Promise<any> {

      const { name, email }: any = req.body;

        try {

            const status: UserStatus | null = await UserStatus.findOne({ where: { title: 'Pending'}});
            const role: Role | null = await Role.findOne({ where: { title: 'Student' }});

            if(!status || !role) {
                return res.status(400).json({ error: "Invalid status or role" });
            }

            const password: string = bcrypt.hashSync(req.body.password, 10);

            const user = await User.create({
                name,
                email,
                password,
                status_id: status.id,
            });
            
            await UserRole.create({
                user_id: user.id,
                role_id: role.id
            });

            return res.status(201).json({ message: "User registered successfully", user });

        } catch (error) {
            
            console.log(error);
            return res.status(500).json({ error: i18next.t('internal.error')})
        }
    }


    /**
     * login()
     * 
     * Login user with email address and password
     * 
     * @param {Request} req Request object
     * @param {Response} res Response object
     * @param {NextFunction} next NextFunction object
     * 
     * @return Object
     */

    public static async login(req: Request, res: Response): Promise<any> {
        const { email, password }: any = req.body;

        try {
            const user: User | null = await User.findOne({ where: { email }})

            if(!user) {
                return res.status(400).json({ message: i18next.t('login.failed') });
            }

            const isMatch: boolean = bcrypt.compareSync(password, user.password);

            if(!isMatch) {
                return res.status(400).json({ message: i18next.t('login.failed') });
            }

            const { id }: any  = user;
            const TokenInfo: TokenInfo = { id };
            const token: string = jwt.sign(TokenInfo, JWT_SECRET, { expiresIn: JWT_EXPIRE});
            
            return res.json({success: true, token })
        } catch (error) {
            console.log(error);

            return res.status(500).json({ message: i18next.t('internal.error')});
        }
    }


    /**
   * forgotPassword()
   *
   * Sent an email with a token to reset user password
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
    public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<any> {
        const { email }: any = req.body;
      
        try {
          const user: any = await User.findOne({ where: { email }});
      
          if (!user) {
            return res.status(404).json({ message: i18next.t('no.user') });
          }
      
          const { id } = user;
          const tokenInfo: TokenInfo = { id };
      
          let token: string;
          try {
            token = jwt.sign(tokenInfo, JWT_EMAIL_SECRET, { expiresIn: JWT_EMAIL_EXPIRE });
          } catch (error) {
            console.error(error);
            return res.status(500).json({ message: i18next.t('internal.error')});
          }
      
          const data: any = {
            to: user.email,
            subject: i18next.t('mail.subject.forgot.password'),
            template: 'forgot-password-email',
            context: {
              url: `${WEB_APP_URL}/${RESET_PASSWORD_PATH}?token=${token}`,
              name: user.name,
            },
          };
      
          await mailer.sendMail(data);
      
          return res.json({ message: i18next.t('email.success') });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: i18next.t('internal.error')});
        }
    }

    /**
   * resetPassword()
   *
   * Reset the password of an user
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
	public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<any> {
		const resetToken: string = req.body.reset_token;
		let decoded: any;

		try {
			decoded = await decodeJwtToken(resetToken, JWT_SECRET);
		} catch (err) {
			console.log(err);

			return res.status(400).json({ message: i18next.t('bad.token') });
		}

		try {
			const user: any = await User.findOne({ where: { id: decoded.id }});

			if (!user) {
				return res.status(404).json({ message: i18next.t('no.user') });
			}

			const password: string = await bcrypt.hashSync(req.body.password, 10);

			const { id }: any = user;

			await User.update({ password }, {
				where: { id }
			});

			return res.json({ message: i18next.t('password.reset') });
		} catch (err) {
			console.log(err);

			return res.status(500).json({ message: i18next.t('internal.error') });
		}
	}
      
}

export { AuthController }
