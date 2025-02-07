/* eslint-disable @typescript-eslint/no-explicit-any */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

const paths: any = {
	test: '../../../.env.test',
	dev: '../../../.env',
	production: '../../.env.prod',
};

const configPath: string = path.resolve(__dirname, paths[process.env.NODE_ENV || 'development']);

const envConfig: dotenv.DotenvParseOutput = dotenv.parse(fs.readFileSync(configPath));

for (const k in envConfig) {
	process.env[k] = envConfig[k];
}

const e: any = process.env;

const ENV: string = e.NODE_ENV || '';
const BASE_URL: string = e.BASE_URL || '';
const SERVER_PORT: number = parseInt(e.SERVER_PORT || '7010', 10);
const APP_NAME: string = e.APP_NAME || '';
const APP_VERSION: string = e.APP_VERSION || '';
const API_BASE: string = e.API_BASE || '';
const DEFAULT_TIMEZONE: string = e.DEFAULT_TIMEZONE || '';
const JWT_SECRET: string = e.JWT_SECRET || 'UMbEJrHSNF$aZc50uRP9B1kz';
const JWT_EXPIRE: number = parseInt(e.JWT_EXPIRE || '86400', 10);
const DB_HOST: string = e.DB_HOST || '';
const DB_PORT: number = parseInt(e.DB_PORT || '5433', 10);
const DB_NAME: string = e.DB_NAME || '';
const DB_USER: string = e.DB_USER || '';
const DB_PASSWORD: string = e.DB_PASSWORD || '';
const DB_AUTH: string = e.DB_AUTH || '';
const LOG_FILE_DIR: string = e.LOG_FILE_DIR || '';
const MAIL_USERNAME: string = e.MAIL_USERNAME || '';
const MAIL_PASSWORD: string = e.MAIL_PASSWORD || '';
const ADMIN_FIRSTNAME: string = e.ADMIN_FIRSTNAME || '';
const ADMIN_LASTNAME: string = e.ADMIN_LASTNAME || '';

export {
	ENV, BASE_URL, SERVER_PORT, APP_NAME, APP_VERSION, API_BASE, DEFAULT_TIMEZONE, JWT_SECRET, JWT_EXPIRE, DB_HOST, DB_PORT,
    DB_NAME, DB_USER, DB_PASSWORD, DB_AUTH, LOG_FILE_DIR, MAIL_USERNAME, MAIL_PASSWORD,
	ADMIN_FIRSTNAME, ADMIN_LASTNAME
}
