import * as http from "http";
import express, { Application } from "express";
import * as config from './core/config'

import { dbConnection } from "./core/db/connect";
// import { Routes } from "./routes";



const port: number = config.SERVER_PORT;

const app: Application = express();


const server: http.Server = http.createServer(app);


// Routes.init(app);


server.listen(port, async() => {
    await dbConnection();

    console.log(`Server started on port ${port}`);
})

export { server} 