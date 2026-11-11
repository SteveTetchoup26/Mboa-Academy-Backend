import fs from 'fs';
import * as path from 'path';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET } from '../core/config';

/**
 * Stockage distant des fichiers uploadés (Supabase Storage).
 *
 * Le disque de Render est éphémère : tout ce qui est écrit dans ./public/uploads
 * disparaît à chaque redéploiement ou redémarrage du service. Quand Supabase est
 * configuré, les fichiers y sont donc envoyés juste après leur réception.
 */

const baseUrl: string = SUPABASE_URL.replace(/\/+$/, '');

export const isRemoteStorageEnabled: boolean = Boolean(baseUrl && SUPABASE_SERVICE_ROLE_KEY);

const authHeaders = (): Record<string, string> => ({
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: SUPABASE_SERVICE_ROLE_KEY,
});

const encodeKey = (key: string): string => key.split('/').map(encodeURIComponent).join('/');

let bucketReady: Promise<void> | null = null;

/**
 * Crée le bucket public s'il n'existe pas encore (une seule fois par processus)
 */
const ensureBucket = (): Promise<void> => {
    if (!bucketReady) {
        bucketReady = (async () => {
            const response = await fetch(`${baseUrl}/storage/v1/bucket`, {
                method: 'POST',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: SUPABASE_STORAGE_BUCKET, name: SUPABASE_STORAGE_BUCKET, public: true }),
            });

            if (response.ok) return;

            const body = await response.text();
            // 409 / "already exists" : le bucket est déjà là, rien à faire
            if (response.status === 409 || /already exists|duplicate/i.test(body)) return;

            throw new Error(`Supabase Storage: unable to create bucket (${response.status}) ${body}`);
        })().catch((error) => {
            bucketReady = null;
            throw error;
        });
    }

    return bucketReady;
};

/**
 * Clé du fichier dans le bucket : `<sous-dossier>/<nom du fichier>`,
 * identique au chemin servi sous /uploads (ex: cover_course/123-image.jpg)
 */
export const getStorageKey = (file: { destination: string; filename: string }): string => {
    return `${path.basename(path.resolve(file.destination))}/${file.filename}`;
};

/**
 * URL publique d'un fichier du bucket
 */
export const getPublicUrl = (key: string): string => {
    return `${baseUrl}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${encodeKey(key)}`;
};

/**
 * Envoie un fichier reçu par multer vers Supabase Storage puis supprime la copie locale
 */
export const uploadToRemoteStorage = async (file: { destination: string; filename: string; path: string; mimetype: string }): Promise<void> => {
    await ensureBucket();

    const key = getStorageKey(file);
    const content = await fs.promises.readFile(file.path);

    const response = await fetch(`${baseUrl}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${encodeKey(key)}`, {
        method: 'POST',
        headers: {
            ...authHeaders(),
            'Content-Type': file.mimetype || 'application/octet-stream',
            'Cache-Control': 'max-age=31536000',
            'x-upsert': 'true',
        },
        body: content,
    });

    if (!response.ok) {
        throw new Error(`Supabase Storage: upload of ${key} failed (${response.status}) ${await response.text()}`);
    }

    await fs.promises.unlink(file.path).catch(() => undefined);
};
