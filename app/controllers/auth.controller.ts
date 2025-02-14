/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as config from '../core/config';

import { decodeJwtToken } from "../core/middleware/auth";
import { TokenInfo } from '../core/types';


import User from "../models/authentication/user.model";
import UserStatus from "../models/authentication/userStatus.model";
import UserRole from "../models/authentication/userRole.model";


const {
	JWT_SECRET, JWT_EXPIRE
}: any = config;

/**
 * Controller for authentication
 * 
 * @class
 */

class authController {

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
        try {
            const { name, email }: any = req.body;

            const status: UserStatus | null = await UserStatus.findOne({ where: { title: 'Pending'}});
            const role: UserRole | null = await UserRole.findOne({ where: { title: 'Student' }});

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
            return res.status(500).json({ error: "Internal Server Error"})
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
                return res.status(400).json({ message: 'login failed' });
            }

            const isMatch: boolean = bcrypt.compareSync(password, user.password);

            if(!isMatch) {
                return res.status(400).json({ message: 'login failed' });
            }

            const { id }: any  = user;
            const TokenInfo: TokenInfo = { id };
            const token: string = jwt.sign(TokenInfo, JWT_SECRET, { expiresIn: JWT_EXPIRE});
            
            return res.json({success: true, token })
        } catch (error) {
            console.log(error);

            return res.status(500).json({ message: 'Internal Server Error'})
        }
    }
}

export { authController }
