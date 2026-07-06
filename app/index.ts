import * as http from "http";
import express, { Application } from "express";
import * as config from './core/config'
import { Locale } from './core/locale';

import { dbConnection, sequelize } from "./core/db/connect";
import { initI18n } from "./core/i18n";
import { Routes } from "./routes";
import { runSeeders } from "./seeders";

const port: number = config.SERVER_PORT;

const app: Application = express();


const server: http.Server = http.createServer(app);


Routes.init(app);


const startServer = async () => {
    await dbConnection();
    await runSeeders(sequelize);
    // await Locale.init();
    await initI18n();

    server.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });
};

startServer();

export { server }