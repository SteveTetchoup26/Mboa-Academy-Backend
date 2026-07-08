import bcrypt from 'bcryptjs';
import User from '../models/authentication/user.model';
import Role from '../models/authentication/role.model';
import UserStatus from '../models/authentication/userStatus.model';
import * as config from '../core/config';

export async function seedSuperAdmin() {
    try {
        const adminEmail = config.ADMIN_MAIL;
        const adminPassword = config.ADMIN_PASSWORD;
        const adminPhone = config.ADMIN_PHONE;
        const adminName = config.ADMIN_NAME;

        const existingAdmin = await User.findOne({ 
            where: { email: adminEmail } 
        });

        if (existingAdmin) {
            console.log('Super admin déjà existant');
            return existingAdmin;
        }

        const adminRole = await Role.findOne({
            where: { title: 'Super Admin' }
        });

        const activeStatus = await UserStatus.findOne({ 
            where: { title: 'Active' } 
        });

        if (!adminRole) {
            throw new Error('Le rôle Super Admin n\'existe pas. Vérifiez que les hooks @AfterSync se sont exécutés.');
        }

        if (!activeStatus) {
            throw new Error('Le statut Active n\'existe pas. Vérifiez que les hooks @AfterSync se sont exécutés.');
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const admin = await User.create({
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            status_id: activeStatus.id,
            phone_number: adminPhone
        });

        await admin.$add('role', adminRole);

        return admin;

    } catch (error) {
        console.error('Erreur lors de la création du super admin:', error);
        throw error;
    }
}