import { Sequelize } from 'sequelize-typescript';
import { seedSuperAdmin } from './seed-admin';
import { seedInstitutionTypes, seedInstitutionStatuses } from './seed-institutions';
import { seedInstitutionAccount } from './seed-institution-account';
import { seedLearner } from './seed-learner';

export async function runSeeders(sequelize: Sequelize) {
    try {
        await sequelize.sync();

        // Les rôles et statuts sont déjà créés via @AfterSync
        // Attendre un peu pour être sûr
        await new Promise(resolve => setTimeout(resolve, 1000));

        await seedSuperAdmin();
        await seedInstitutionTypes();
        await seedInstitutionStatuses();
        await seedInstitutionAccount();
        await seedLearner();

    } catch (error) {
        console.error('Erreur lors de l\'exécution des seeders:', error);
        // Ne pas throw — un échec du seeder ne doit pas crasher l'application
    }
}