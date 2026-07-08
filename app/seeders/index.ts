import { Sequelize } from 'sequelize-typescript';
import { seedSuperAdmin } from './seed-admin';
import { seedInstitutionTypes, seedInstitutionStatuses } from './seed-institutions';

export async function runSeeders(sequelize: Sequelize) {
    try {
        await sequelize.sync();

        // Les rôles et statuts sont déjà créés via @AfterSync
        // Attendre un peu pour être sûr
        await new Promise(resolve => setTimeout(resolve, 1000));

        await seedSuperAdmin();
        await seedInstitutionTypes();
        await seedInstitutionStatuses();

    } catch (error) {
        console.error('Erreur lors de l\'exécution des seeders:', error);
        // Ne pas throw — un échec du seeder ne doit pas crasher l'application
    }
}