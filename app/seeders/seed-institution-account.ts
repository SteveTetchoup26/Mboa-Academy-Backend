import bcrypt from 'bcryptjs';
import User from '../models/authentication/user.model';
import Role from '../models/authentication/role.model';
import UserStatus from '../models/authentication/userStatus.model';
import UserRole from '../models/authentication/userRole.model';
import Institution from '../models/institution/institution.model';
import InstitutionStatus from '../models/institution/institutionStatus.model';
import InstitutionTypeModel from '../models/institution/institutionType.model';
import InstitutionAdmin from '../models/institution/institutionAdmin.model';

export async function seedInstitutionAccount() {
    try {
        const institutionEmail = 'institution@demo.mboa';
        const institutionPassword = 'Institution@123';
        const institutionName = 'École Supérieure de Technologie';

        // Vérifier si le compte existe déjà
        const existingUser = await User.findOne({
            where: { email: institutionEmail }
        });

        if (existingUser) {
            console.log('ℹ️  Compte institution de démo déjà existant');
            return existingUser;
        }

        // Récupérer les références
        const institutionRole = await Role.findOne({ where: { title: 'Institution' } });
        const activeStatus = await UserStatus.findOne({ where: { title: 'Active' } });
        const institutionActiveStatus = await InstitutionStatus.findOne({ where: { title: 'Active' } });
        const institutionType = await InstitutionTypeModel.findOne({ where: { title: 'Training Center' } });

        if (!institutionRole || !activeStatus || !institutionActiveStatus || !institutionType) {
            throw new Error(
                'Références manquantes. Vérifiez que les @AfterSync hooks se sont exécutés ' +
                '(rôles, statuts utilisateur, statuts institution, types institution).'
            );
        }

        // Créer l'utilisateur
        const hashedPassword = await bcrypt.hash(institutionPassword, 10);

        const user = await User.create({
            name: 'Admin Demo Institution',
            email: institutionEmail,
            password: hashedPassword,
            status_id: activeStatus.id,
            phone_number: '+237600000001',
        });

        // Lui assigner le rôle Institution
        await UserRole.create({
            user_id: user.id,
            role_id: institutionRole.id,
        });

        // Créer l'institution (déjà active)
        const institution = await Institution.create({
            name: institutionName,
            slug: 'ecole-superieure-de-technologie',
            description: 'Institution de démonstration pour les tests. Propose des formations en développement web, mobile et data science.',
            address: '123 Rue de la Technologie',
            city: 'Yaoundé',
            country: 'Cameroun',
            phone: '+237600000000',
            email: institutionEmail,
            website: 'https://demo-mboa.tech',
            brand_color: '#4F46E5',
            type_id: institutionType.id,
            status_id: institutionActiveStatus.id,
        });

        // Lier l'utilisateur comme admin de l'institution
        await InstitutionAdmin.create({
            institution_id: institution.id,
            user_id: user.id,
            role: 'admin',
        });

        console.log('✅ Compte institution de démo créé avec succès');
        console.log(`   Email    : ${institutionEmail}`);
        console.log(`   Mot de passe : ${institutionPassword}`);
        console.log(`   Institution  : ${institutionName}`);

        return user;

    } catch (error) {
        console.error('❌ Erreur lors de la création du compte institution de démo:', error);
        throw error;
    }
}
