import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import * as path from 'path';

async function initI18n() {
  await i18next.use(Backend).init({
    lng: 'en', // Langue par défaut
    fallbackLng: 'fr', // Langue de secours
    backend: {
      loadPath: path.join(__dirname, '../../locale/{{lng}}/{{ns}}.json'), // Chemin des fichiers
    },
    ns: ['message', 'validation'], // Namespaces disponibles
    defaultNS: 'message',
    fallbackNS: ['validation'],
    interpolation: {
      escapeValue: false, // Permet d'inclure du HTML si nécessaire
    },
  });
}

export { i18next, initI18n };
