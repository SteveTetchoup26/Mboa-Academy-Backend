/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response, NextFunction } from 'express';
import { CustomRequest } from '../types';
import InstitutionAdmin from '../../models/institution/institutionAdmin.model';
import Role from '../../models/authentication/role.model';
import UserRole from '../../models/authentication/userRole.model';

/**
 * Middleware to authorize a request only if the user is:
 * - Super Admin (global platform admin), OR
 * - Institution Admin (admin of the targeted institution)
 *
 * @param {Request | any} req Request object
 * @param {Response} res Response object
 * @param {NextFunction} next NextFunction object
 *
 * @returns any
 */
const institutionAdminMiddleware = async (req: CustomRequest | any, res: Response, next: NextFunction): Promise<any> => {
    const institutionId: number = req.params.id;

    if (!institutionId) {
        return res.status(400).json({ message: 'Institution ID is required' });
    }

    try {
        // Check if user is Super Admin
        const superAdminRole: Role | null = await Role.findOne({ where: { title: 'Super Admin' } });
        if (superAdminRole) {
            const superAdmin: UserRole | null = await UserRole.findOne({
                where: { user_id: req.userId, role_id: superAdminRole.id }
            });
            if (superAdmin) {
                return next();
            }
        }

        // Check if user is an admin of this institution
        const admin: InstitutionAdmin | null = await InstitutionAdmin.findOne({
            where: { institution_id: institutionId, user_id: req.userId }
        });

        if (!admin) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        req.institutionAdminRole = admin.role;
        return next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export { institutionAdminMiddleware };
