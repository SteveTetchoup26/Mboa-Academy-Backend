/* eslint-disable @typescript-eslint/no-explicit-any */
import * as path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { UPLOAD_DEFAULT_PATH, UPLOAD_DOCUMENT_USER_PATH, UPLOAD_DOCUMENT_ADMIN_PATH, UPLOAD_PAYMENT_METHOD_PATH, UPLOAD_COVER_COURSE_PATH, UPLOAD_LESSON_VIDEO_PATH, UPLOAD_INSTITUTION_LOGO_PATH } from '../core/config';
import { isRemoteStorageEnabled, uploadToRemoteStorage } from './storage';



const storage: multer.StorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder;

        // Déterminer le dossier selon le nom du champ (fieldname) ou fileType
        const fieldName = file.fieldname;

        if (fieldName === 'cover_image') {
            folder = UPLOAD_COVER_COURSE_PATH;
        } else if (fieldName === 'videos') {
            folder = UPLOAD_LESSON_VIDEO_PATH;
        } else if (fieldName === 'logo' || fieldName === 'institutionLogo') {
            folder = UPLOAD_INSTITUTION_LOGO_PATH;
        } else {
            const fileType = req.body.fileType;
            switch (fileType) {
                case "documentUser":
                    folder = UPLOAD_DOCUMENT_USER_PATH;
                    break;
                case "documentAdmin":
                    folder = UPLOAD_DOCUMENT_ADMIN_PATH;
                    break;
                case "paymentMethod":
                    folder = UPLOAD_PAYMENT_METHOD_PATH;
                    break;
                case "courseCover":
                    folder = UPLOAD_COVER_COURSE_PATH;
                    break;
                case "lessonVideo":
                    folder = UPLOAD_LESSON_VIDEO_PATH;
                    break;
                case "institutionLogo":
                    folder = UPLOAD_INSTITUTION_LOGO_PATH;
                    break;
                default:
                    folder = UPLOAD_DEFAULT_PATH;
            }
        }
    
        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder, { recursive: true });
        }
    
        cb(null, folder);
      },

    filename(req: Request, file: any, fn: (error: Error | null, filename: string) => void): void {
        // Nom sans espaces ni caractères spéciaux : il sert d'URL et de clé de stockage
        const extension = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.originalname, path.extname(file.originalname))
            .normalize('NFD')
            .replace(/[^a-zA-Z0-9_-]+/g, '_')
            .slice(0, 80) || 'file';

        fn(null, `${new Date().getTime().toString()}-${baseName}${extension}`);
    }
})


const multerUpload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter(req: any, file: any, callback: (error: Error | any , acceptFile: boolean) => void): void {
        const allowedExtensions = ['.jpg', '.png', '.jpeg', '.mp4'];
        const allowedMimeTypes = ['image/', 'video/'];
    
        const extensionIsValid = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());
        const mimetypeIsValid = allowedMimeTypes.some(type => file.mimetype.startsWith(type));
    
        if (extensionIsValid && mimetypeIsValid) {
            callback(null, true);
        } else {
            callback(new Error('Invalid file type. Only images and MP4 videos are allowed'), false);
        }
    }
});


/**
 * Après multer : envoie les fichiers reçus vers le stockage distant (si configuré).
 * `file.filename` reste inchangé, les contrôleurs n'ont donc rien à adapter.
 */
const persistUploadedFiles: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!isRemoteStorageEnabled) return next();

    const files: any[] = [];
    if (req.file) files.push(req.file);
    if (Array.isArray(req.files)) {
        files.push(...req.files);
    } else if (req.files) {
        Object.values(req.files).forEach((group: any) => files.push(...group));
    }

    try {
        await Promise.all(files.map(file => uploadToRemoteStorage(file)));
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'file upload failed' });
    }
};


export const uploadFiles = {
    single: (fieldName: string): RequestHandler[] => [multerUpload.single(fieldName), persistUploadedFiles],
    fields: (fields: multer.Field[]): RequestHandler[] => [multerUpload.fields(fields), persistUploadedFiles],
};
