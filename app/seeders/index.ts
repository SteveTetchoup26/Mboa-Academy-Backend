import { Sequelize } from 'sequelize-typescript';
import { seedSuperAdmin } from './seed-admin';

export async function runSeeders(sequelize: Sequelize) {
    try {
        await sequelize.sync();

        // Les rôles et statuts sont déjà créés via @AfterSync
        // Attendre un peu pour être sûr
        await new Promise(resolve => setTimeout(resolve, 1000));

        await seedSuperAdmin();

    } catch (error) {
        console.error('Erreur lors de l\'exécution des seeders:', error);
        // Ne pas throw — un échec du seeder ne doit pas crasher l'application
    }
}