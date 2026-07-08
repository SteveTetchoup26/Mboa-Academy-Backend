/* eslint-disable @typescript-eslint/no-explicit-any */
import * as jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import * as config from '../config';
import { CustomRequest } from '../types';

export type CreateJWTTokenFunction = (payload: any, jwtSecret: string, jwtExpire: number) => string;

/**
 * Create a JWT token
 * 
 * @param {any} payload Information to encode
 * @param {string} jwtSecret JWT secret
 * @param {string} jwtExpire JWT expiration date
 * 
 * @returns string
 */

export const createJWTToken: CreateJWTTokenFunction = (payload: any, jwtSecret: string, jwtExpire: number): string => {
    return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpire });
};


/**
 * Decode a JWT token
 * 
 * @param {string} token Token to decode
 * @param {string} jwtSecret Secret key used to create the token
 * 
 * @returns Promise<any>
 */

type decodedJWTFunction = (token: string, jwtSecret: string) => Promise<jwt.JwtPayload | string>;

export const decodeJwtToken: decodedJWTFunction = (token: string, jwtSecret: string): Promise<any> => {
    return new Promise((resolve, reject): any => {
        jwt.verify(token, jwtSecret, (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
            if(err) return reject(err);
            resolve(decoded!);
        });
    })
}



/**
 * Middleware to authorize a request only if a valid token is provided
 * 
 * @param {Request | any} req Request object
 * @param {Response} res Response object
 * @param {NextFunction} next NextFunction object
 * 
 * @returns any
 */


const authMiddleware: any = async (req: CustomRequest | any, res: Response, next: NextFunction): Promise<any> => {
    const token = req.headers.authorization?.split(' ')[1];
   
    const allowedRoutes: string[] = [
        '/auth/login',
        '/auth/admin/login',
        '/auth/register',
        '/auth/account/confirm',
        '/auth/password/forgot',
        '/auth/password/reset',
        '/institutions/create',
        '/categories',
        '/courses',
        '/users',
        '/uploads/others'
    ];
    let routeName: string = '';

    if(req.originalUrl){
        routeName = req.originalUrl.replace(config.API_BASE, '');
    } else {
        return res.status(401).json({ message: 'unauthorized' });
    }

    const isAllowed = allowedRoutes.includes(routeName) || allowedRoutes.some(route => new RegExp(`^${route}/\\d+$`).test(routeName));

    if (isAllowed) {
        return next();
    }

    if(token) {
        try {
            const decoded: any = await decodeJwtToken(token, config.JWT_SECRET);

            if(!decoded.id) {
                return res.status(401).json({ message: 'unauthorized' });
            }

            req.userId = decoded.id;
            return next();

        } catch (error) {
            console.error(error);
        }
    }

    return res.status(401).json({ message: 'unauthorized' });
}

export { authMiddleware }