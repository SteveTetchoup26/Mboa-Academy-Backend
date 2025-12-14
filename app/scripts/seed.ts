import { runSeeders } from '../seeders';
import { sequelize } from '../core/db/connect';

async function seed() {
    try {
        await sequelize.authenticate();

        await runSeeders(sequelize);

        await sequelize.close();

        process.exit(0);
    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

seed();