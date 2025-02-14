/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from 'nodemailer';
import sgTransport from 'nodemailer-sendgrid-transport';
import path from 'path';
import fs from 'fs/promises';
import handlebars from 'handlebars';
import * as config from '../config';
// import { logger } from '../logger';
import { Locale } from '../locale';

class Mailer {
  static async sendMail(data: any): Promise<void> {
    try {
      const smtpTransport = nodemailer.createTransport(
        sgTransport({
          auth: {
            api_key: config.SENDGRID_API_KEY,
          },
        })
      );

      const filePath = path.join(__dirname, `./templates/${Locale.getLocale()}/${data.template}.html`);
      const source = await fs.readFile(filePath, 'utf8');
      const template = handlebars.compile(source);
      const html = template(data.context);

      const updatedData = {
        ...data,
        html,
        from: `Node Starter <${config.MAIL_FROM}>`,
        subject: Locale.trans(data.subject),
      };

      const result = await smtpTransport.sendMail(updatedData);
      console.log(`Email envoyé avec succès : ${result.messageId}`);
    } catch (error) {
      console.error(`Erreur lors de l'envoi de l'email : ${error}`);
    }
  }
}

export default Mailer;
