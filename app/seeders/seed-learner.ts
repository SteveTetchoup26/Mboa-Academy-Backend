import bcrypt from 'bcryptjs';
import User from '../models/authentication/user.model';
import Role from '../models/authentication/role.model';
import UserStatus from '../models/authentication/userStatus.model';

export async function seedLearner() {
    try {
        const learnerEmail = 'apprenant@demo.mboa';
        const learnerPassword = 'Apprenant@123';
        const learnerName = 'Jean Dupont';

        // Vérifier si le compte existe déjà
        const existingUser = await User.findOne({
            where: { email: learnerEmail }
        });

        if (existingUser) {
            console.log('ℹ️  Compte apprenant de démo déjà existant');
            return existingUser;
        }

        // Récupérer les références
        const learnerRole = await Role.findOne({ where: { title: 'Student' } });
        const activeStatus = await UserStatus.findOne({ where: { title: 'Active' } });

        if (!learnerRole) {
            throw new Error(
                'Le rôle Student n\'existe pas. Vérifiez que les hooks @AfterSync se sont exécutés.'
            );
        }

        if (!activeStatus) {
            throw new Error(
                'Le statut Active n\'existe pas. Vérifiez que les hooks @AfterSync se sont exécutés.'
            );
        }

        // Créer l'utilisateur
        const hashedPassword = await bcrypt.hash(learnerPassword, 10);

        const user = await User.create({
            name: learnerName,
            email: learnerEmail,
            password: hashedPassword,
            status_id: activeStatus.id,
            phone_number: '+237600000002',
        });

        // Lui assigner le rôle Apprenant
        await user.$add('role', learnerRole);

        console.log('✅ Compte apprenant de démo créé avec succès');
        console.log(`   Email    : ${learnerEmail}`);
        console.log(`   Mot de passe : ${learnerPassword}`);

        return user;

    } catch (error) {
        console.error('❌ Erreur lors de la création du compte apprenant:', error);
        throw error;
    }
}
