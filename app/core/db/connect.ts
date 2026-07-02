import { Sequelize } from 'sequelize-typescript'
import * as config from '../config'
import * as path from 'path';



const sequelize = new Sequelize({
    database: config.DB_NAME,
    host: config.DB_HOST,
    dialect: 'postgres',
    username: config.DB_USER,
    password: config.DB_PASSWORD,
    port: config.DB_PORT,
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false, // requis pour Supabase
        }
    },
    models: [path.join(__dirname, '../../models/*/*.model.ts')],
    modelMatch: (filename: string, member) => {
		return filename.substring(0, filename.indexOf('.model')) === member.toLowerCase()
	}
})



const dbConnection = async () => {
	try {
      await sequelize.authenticate();
    
      if(config.ENV === 'dev') {
        await sequelize.sync({force: true});
      } else {
        await sequelize.sync();
      }
      
      console.log('Connected to postgreSQL')

	  } catch (error) {
		  console.error('Error to connect to database', error);
	  }
}

export { dbConnection, sequelize }