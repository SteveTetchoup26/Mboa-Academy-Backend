/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from 'nodemailer';
import sgTransport from 'nodemailer-sendgrid-transport';
import path from 'path';
import fs from 'fs/promises';
import handlebars from 'handlebars';
import * as config from '../config';
// import { logger } from '../logger';
import { i18next } from '../../core/i18n'

const smtpTransport = nodemailer.createTransport({
  service: 'gmail',
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: 20000,
  auth: {
    user: config.MAIL_USERNAME,
    pass: config.MAIL_PASSWORD,
  },
});

class Mailer {
  static async sendMail(data: any): Promise<void> {
    try {
      const language = i18next.language || 'fr';
      const filePath = path.join(__dirname, `./templates/${language}/${data.template}.html`);
      const source = await fs.readFile(filePath, 'utf8');
      const template = handlebars.compile(source);
      const html = template(data.context);

      const updatedData = {
        ...data,
        html,
        from: `Node Starter <${config.MAIL_FROM}>`,
        subject: i18next.t(data.subject),
      };

      const result = await smtpTransport.sendMail(updatedData);
      
      console.log(`Email envoyé avec succès : ${result.messageId}`);
    } catch (error) {
      console.error(`Erreur lors de l'envoi de l'email : ${error}`);
      throw error;
    }
  }
}

export default Mailer;
