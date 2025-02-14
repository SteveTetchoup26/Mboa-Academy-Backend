import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

async function initI18n() {
  await i18next.use(Backend).init({
    lng: 'en', // Langue par défaut
    fallbackLng: 'en', // Langue de secours
    backend: {
      loadPath: '../../locale/{{lng}}/{{ns}}.json', // Chemin des fichiers
    },
    ns: ['message', 'validation'], // Namespaces disponibles
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // Permet d'inclure du HTML si nécessaire
    },
  });
}

export { i18next, initI18n };
