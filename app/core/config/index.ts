/* eslint-disable @typescript-eslint/no-explicit-any */
import * as dotenv from 'dotenv';

// En local, charge le fichier .env s'il existe. Sur Render, les variables
// sont déjà dans process.env — dotenv.config() ne fait rien si le fichier est absent.
dotenv.config();

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
const JWT_EMAIL_SECRET: string = e.JWT_EMAIL_SECRET || 'xIT8Vq3Yh$tuDva4I2FxegDo';
const JWT_EMAIL_EXPIRE: number = parseInt(e.JWT_EMAIL_EXPIRE || '300', 10);
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
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const MAIL_FROM = process.env.MAIL_FROM || '';
const WEB_APP_URL: string = e.WEB_APP_URL || '';
const RESET_PASSWORD_PATH: string = e.RESET_PASSWORD_PATH || '';
const CONFIRM_ACCOUNT_PATH: string = e.CONFIRM_ACCOUNT_PATH || '';
const UPLOAD_DOCUMENT_USER_PATH: string = e.UPLOAD_DOCUMENT_USER_PATH || '';
const UPLOAD_DOCUMENT_ADMIN_PATH: string = e.UPLOAD_DOCUMENT_ADMIN_PATH || '';
const UPLOAD_PAYMENT_METHOD_PATH: string = e.UPLOAD_PAYMENT_METHOD_PATH || '';
const UPLOAD_COVER_COURSE_PATH: string = e.UPLOAD_COVER_COURSE_PATH || '';
const UPLOAD_LESSON_VIDEO_PATH: string = e.UPLOAD_LESSON_VIDEO_PATH || '';
const UPLOAD_DEFAULT_PATH: string = e.UPLOAD_DEFAULT_PATH || '';
const ADMIN_MAIL: string = e.ADMIN_EMAIL || '';
const ADMIN_PASSWORD: string = e.ADMIN_PASSWORD || '';
const ADMIN_PHONE: string = e.ADMIN_PHONE || '';
const ADMIN_NAME: string = e.ADMIN_NAME || '';

export {
	ENV, BASE_URL, SERVER_PORT, APP_NAME, APP_VERSION, API_BASE, DEFAULT_TIMEZONE, JWT_SECRET, JWT_EXPIRE, DB_HOST, DB_PORT,
    DB_NAME, DB_USER, DB_PASSWORD, DB_AUTH, LOG_FILE_DIR, MAIL_USERNAME, MAIL_PASSWORD, SENDGRID_API_KEY, MAIL_FROM,
	ADMIN_FIRSTNAME, ADMIN_LASTNAME, WEB_APP_URL, CONFIRM_ACCOUNT_PATH, RESET_PASSWORD_PATH, JWT_EMAIL_SECRET, JWT_EMAIL_EXPIRE,
	UPLOAD_DOCUMENT_USER_PATH, UPLOAD_DOCUMENT_ADMIN_PATH, UPLOAD_PAYMENT_METHOD_PATH, UPLOAD_COVER_COURSE_PATH, UPLOAD_LESSON_VIDEO_PATH,
	UPLOAD_DEFAULT_PATH, ADMIN_MAIL, ADMIN_PASSWORD, ADMIN_PHONE, ADMIN_NAME
}
