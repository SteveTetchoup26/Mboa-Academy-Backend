# Mboa Academy — Backend

API REST de la plateforme de formation en ligne **Mboa Academy** : comptes et rôles, institutions, cours (modules, leçons, vidéos), inscriptions, paiements, avis et webinaires.

Ce dépôt contient uniquement l'API. Le site public et l'interface d'administration sont deux applications Vue séparées qui consomment cette API.

## Stack

- **Node.js** + **TypeScript**, **Express 4**
- **PostgreSQL** avec **Sequelize** (`sequelize-typescript`)
- **JWT** pour l'authentification
- **Multer** pour la réception des fichiers, **Supabase Storage** pour leur conservation
- **SendGrid** (Nodemailer + Handlebars) pour les e-mails
- **i18next** pour les messages en français et en anglais

## Démarrage en local

Prérequis : Node.js 18 ou plus récent (l'envoi vers Supabase utilise `fetch`) et une base PostgreSQL locale.

```bash
npm install
cp .env.example .env   # puis adapter les valeurs
npm run dev
```

Le serveur démarre sur le port défini par `SERVER_PORT` (7010 par défaut). Au démarrage, il crée les tables manquantes puis exécute les seeders.

> **Attention** — avec `NODE_ENV=dev` et `DB_HOST=localhost` (ou `127.0.0.1`), toutes les tables sont **supprimées et recréées à chaque démarrage** (`sequelize.sync({ force: true })`). Ce comportement est volontairement limité à une base locale : il ne s'applique jamais à une base distante.

### Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement avec rechargement automatique |
| `npm run build` | Compilation TypeScript vers `build/` (copie aussi les gabarits d'e-mail et les traductions) |
| `npm start` | Lance la version compilée (`build/index.js`) |
| `npm run lint` | Analyse ESLint |
| `npm run db:seed` | Exécute `app/scripts/seed.ts` |
| `npm run seed:admin` | Crée le compte super administrateur |

## Variables d'environnement

Le fichier `.env.example` liste toutes les variables. Les principales :

| Variable | Description |
|---|---|
| `NODE_ENV` | `dev` en local, `production` en ligne |
| `SERVER_PORT` | Port d'écoute |
| `API_BASE` | Préfixe des routes, par exemple `/api/v1` |
| `JWT_SECRET`, `JWT_EXPIRE` | Signature et durée de vie (en secondes) des jetons de session |
| `JWT_EMAIL_SECRET`, `JWT_EMAIL_EXPIRE` | Idem pour les jetons envoyés par e-mail |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Connexion PostgreSQL |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_PHONE` | Compte super administrateur créé au premier démarrage |
| `SENDGRID_API_KEY`, `MAIL_FROM` | Envoi des e-mails |
| `WEB_APP_URL`, `RESET_PASSWORD_PATH`, `CONFIRM_ACCOUNT_PATH` | Construction des liens envoyés par e-mail |
| `FRONTEND_URL`, `ADMIN_URL` | Origines autorisées par CORS (en plus des domaines `*.vercel.app`) |
| `UPLOAD_*_PATH` | Dossiers locaux de réception des fichiers, sous `./public/uploads` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Stockage distant des fichiers (voir ci-dessous) |
| `SUPABASE_STORAGE_BUCKET` | Nom du bucket, `uploads` par défaut |

## Fichiers uploadés

Les images de couverture, vidéos de leçon, logos et avatars sont reçus par Multer dans `./public/uploads/<dossier>` puis servis sous `/uploads/<dossier>/<fichier>`.

- **Sans** les variables Supabase, les fichiers restent sur le disque local. C'est suffisant en développement.
- **Avec** `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`, chaque fichier est envoyé dans un bucket public Supabase Storage (créé automatiquement) et la copie locale est supprimée. Une requête sur `/uploads/...` dont le fichier n'est pas sur le disque est redirigée vers le bucket.

Le stockage distant est **indispensable sur Render** : son disque est éphémère et tout fichier local est perdu à chaque redéploiement ou redémarrage.

La clé attendue est la clé `service_role` (ou clé secrète) du projet Supabase, pas la clé `anon` : cette dernière ne peut ni créer le bucket ni y écrire.

Contraintes : 15 Mo maximum par fichier, extensions `.jpg`, `.jpeg`, `.png` et `.mp4`. Les noms de fichiers sont nettoyés (espaces et caractères spéciaux remplacés) et préfixés d'un horodatage.

## API

Toutes les routes sont préfixées par `API_BASE`. Sauf mention contraire, elles exigent l'en-tête `Authorization: Bearer <token>`, le jeton étant renvoyé par la connexion.

Routes accessibles sans jeton : connexion, inscription, confirmation de compte, mot de passe oublié et réinitialisation, demande de création d'une institution, ainsi que la consultation des catégories, des cours, des avis d'un cours, des utilisateurs et des webinaires. La liste exacte se trouve dans `app/core/middleware/auth.ts`.

| Ressource | Préfixe | Opérations principales |
|---|---|---|
| Authentification | `/auth` | `register`, `login`, `admin/login`, `account/confirm`, `password/forgot`, `password/reset` |
| Utilisateurs | `/users` | profil (`me`), liste, mise à jour du profil, `become-instructor` |
| Catégories | `/categories` | CRUD |
| Cours | `/courses` | création, liste publique, détail, cours du formateur, cours suivis, validation par un administrateur |
| Institutions | `/institutions` | CRUD, administrateurs, statistiques, validation |
| Cours d'institution | `/institutions/:id/courses` | création, mise à jour, suppression, publication, code d'accès, gestion des apprenants |
| Inscriptions | `/enrollments` | inscription, inscription par code, progression par leçon |
| Paiements | `/payments` | création, liste, détail |
| Avis | `/reviews` | création, avis d'un cours, suppression |
| Webinaires | `/webinars` | CRUD, salle, inscriptions |

### Création d'un cours

`POST /courses/create` et `POST /institutions/:id/courses/create` attendent une requête `multipart/form-data` :

- `data` : le cours au format JSON (titre, description, prix, modules et leçons, objectifs, fonctionnalités, catégories, langue) ;
- `cover_image` : l'image de couverture ;
- `videos` : les vidéos, associées aux leçons dans l'ordre où elles apparaissent.

Un champ `data` invalide renvoie une erreur 400.

### Suppression d'un cours d'institution

`DELETE /institutions/:id/courses/:courseId` supprime le cours et tout son contenu (modules, leçons, vidéos, objectifs, inscriptions, avis, forum). Les paiements sont conservés et détachés du cours. Un cours ayant délivré des certificats ne peut pas être supprimé (erreur 409).

## Données initiales

Au démarrage, le serveur crée s'ils n'existent pas : les rôles et statuts de référence, le compte super administrateur (à partir des variables `ADMIN_*`), les types et statuts d'institution, ainsi qu'une institution et un apprenant de démonstration (voir `app/seeders/`).

## Structure du projet

```
app/
├── index.ts          Point d'entrée
├── controllers/      Logique des routes
├── routes/           Déclaration des routes
├── models/           Modèles Sequelize, par domaine
├── seeders/          Données initiales
├── utils/            Réception des fichiers et stockage distant
├── locale/           Traductions (fr, en)
└── core/
    ├── config/       Lecture des variables d'environnement
    ├── db/           Connexion à la base
    ├── middleware/   Authentification JWT
    ├── mailer/       Envoi d'e-mails et gabarits
    └── i18n/         Initialisation des traductions
```

## Déploiement

L'application est déployée sur **Render** (API), **Supabase** (PostgreSQL et stockage des fichiers) et **Vercel** (applications front).

Sur Render :

- commande de build, par exemple : `npm install && npm run build`
- commande de démarrage : `npm start`
- variables d'environnement : celles de `.env.example`, avec `NODE_ENV=production`

La connexion à la base utilise SSL dès que `NODE_ENV` est différent de `dev`.
