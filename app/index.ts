import * as http from "http";
import express, { Application } from "express";
import * as config from './core/config'
import { Locale } from './core/locale';

import { dbConnection } from "./core/db/connect";
import { initI18n } from "./core/i18n";
// import { Routes } from "./routes";



const port: number = config.SERVER_PORT;

const app: Application = express();


const server: http.Server = http.createServer(app);


// Routes.init(app);


server.listen(port, async() => {
    await dbConnection();

    // await Locale.init();
    await initI18n();

    console.log(`Server started on port ${port}`);
})

export { server} 