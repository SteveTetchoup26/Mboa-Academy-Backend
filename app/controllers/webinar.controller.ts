/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';

import { CustomRequest } from '../core/types';
import { i18next } from '../core/i18n';
import { Op } from 'sequelize';
import Webinar from '../models/webinar/webinar.model';
import WebinarStatus from '../models/webinar/webinarStatus.model';
import WebinarRegistration from '../models/webinar/webinarRegistration.model';
import User from '../models/authentication/user.model';
import Institution from '../models/institution/institution.model';


/**
 * Generate a random alphanumeric access code
 */
const generateAccessCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Controller for webinar management
 *
 * @class
 */
class WebinarController {

    /**
     * create()
     *
     * Create a new webinar
     *
     * @param {CustomRequest} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async create(req: CustomRequest | any, res: Response): Promise<any> {
        const {
            title,
            description,
            start_date,
            end_date,
            meeting_link,
            visibility,
            access_code,
            institution_id,
            max_participants,
        } = req.body;

        const transaction = await Webinar.sequelize?.transaction();

        try {
            if (!title) {
                return res.status(400).json({ message: 'Le titre est requis' });
            }

            if (!start_date || !end_date) {
                return res.status(400).json({ message: 'Les dates de début et fin sont requises' });
            }

            // Calcul de la durée en minutes
            const start = new Date(start_date);
            const end = new Date(end_date);
            const duration = Math.round((end.getTime() - start.getTime()) / 60000);

            if (duration <= 0) {
                return res.status(400).json({ message: 'La date de fin doit être après la date de début' });
            }

            // Statut par défaut : Upcoming
            const status = await WebinarStatus.findOne({
                where: { title: 'Upcoming' }
            });

            if (!status) {
                return res.status(500).json({ message: 'Statut webinar introuvable' });
            }

            const webinar = await Webinar.create({
                title,
                description,
                start_date,
                end_date,
                duration,
                meeting_link,
                visibility: visibility || 'public',
                access_code: visibility === 'private' ? (access_code || generateAccessCode()) : null,
                status_id: status.id,
                institution_id: institution_id || null,
                instructor_id: req.userId,
                max_participants: max_participants || null,
            }, { transaction });

            await transaction?.commit();

            // Re-fetch with associations
            const created = await Webinar.findByPk(webinar.id, {
                include: [
                    { model: WebinarStatus, as: 'status' },
                    { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] },
                    { model: Institution, as: 'institution' },
                ]
            });

            return res.status(201).json({ webinar: created, message: 'Webinaire créé avec succès' });
        } catch (e: any) {
            await transaction?.rollback();
            console.error(e);
            return res.status(500).json({ message: e.message || "Erreur lors de la création du webinaire" });
        }
    }

    /**
     * all()
     *
     * Get all public upcoming/live webinars
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async all(req: Request, res: Response): Promise<any> {
        try {
            const { status, page = 1, limit = 12 } = req.query;

            const where: any = { visibility: 'public' };

            if (status) {
                const statusRecord = await WebinarStatus.findOne({ where: { title: status as string } });
                if (statusRecord) where.status_id = statusRecord.id;
            }

            const offset = (Number(page) - 1) * Number(limit);

            const { rows: webinars, count: total } = await Webinar.findAndCountAll({
                where,
                include: [
                    { model: WebinarStatus, as: 'status' },
                    { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] },
                    { model: Institution, as: 'institution', attributes: ['id', 'name', 'city'] },
                    {
                        model: WebinarRegistration,
                        as: 'registrations',
                        attributes: ['id'],
                    },
                ],
                order: [['start_date', 'ASC']],
                limit: Number(limit),
                offset,
            });

            const webinarsWithCounts = webinars.map(w => {
                const data = w.toJSON() as any;
                data.registrationsCount = data.registrations?.length || 0;
                delete data.registrations;
                return data;
            });

            return res.status(200).json({
                webinars: webinarsWithCounts,
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
            });
        } catch (e: any) {
            console.error(e);
            return res.status(500).json({ message: e.message || "Erreur lors du chargement des webinaires" });
        }
    }

    /**
     * allByInstitution()
     *
     * Get all webinars for a specific institution
     *
     * @param {CustomRequest} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async allByInstitution(req: CustomRequest | any, res: Response): Promise<any> {
        try {
            const institutionId = req.params.institutionId;

            const webinars = await Webinar.findAll({
                where: { institution_id: institutionId },
                include: [
                    { model: WebinarStatus, as: 'status' },
                    { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] },
                    {
                        model: WebinarRegistration,
                        as: 'registrations',
                        attributes: ['id', 'user_id'],
                    },
                ],
                order: [['start_date', 'DESC']],
            });

            const webinarsWithCounts = webinars.map(w => {
                const data = w.toJSON() as any;
                data.registrationsCount = data.registrations?.length || 0;
                delete data.registrations;
                return data;
            });

            return res.status(200).json({ webinars: webinarsWithCounts });
        } catch (e: any) {
            console.error(e);
            return res.status(500).json({ message: e.message || "Erreur lors du chargement des webinaires" });
        }
    }

    /**
     * allByInstructor()
     *
     * Get all webinars for the current instructor
     *
     * @param {CustomRequest} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async allByInstructor(req: CustomRequest | any, res: Response): Promise<any> {
        try {
            const webinars = await Webinar.findAll({
                where: { instructor_id: req.userId },
                include: [
                    { model: WebinarStatus, as: 'status' },
                    { model: Institution, as: 'institution', attributes: ['id', 'name'] },
                    {
                        model: WebinarRegistration,
                        as: 'registrations',
                        attributes: ['id'],
                    },
                ],
                order: [['start_date', 'DESC']],
            });

            const webinarsWithCounts = webinars.map(w => {
                const data = w.toJSON() as any;
                data.registrationsCount = data.registrations?.length || 0;
                delete data.registrations;
                return data;
            });

            return res.status(200).json({ webinars: webinarsWithCounts });
        } catch (e: any) {
            console.error(e);
            return res.status(500).json({ message: e.message || "Erreur lors du chargement des webinaires" });
        }
    }

    /**
     * one()
     *
     * Get one webinar by ID
     *
     * @param {Request} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async one(req: Request, res: Response): Promise<any> {
        try {
            const webinar = await Webinar.findByPk(req.params.id, {
                include: [
                    { model: WebinarStatus, as: 'status' },
                    { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] },
                    { model: Institution, as: 'institution', attributes: ['id', 'name', 'city'] },
                    {
                        model: WebinarRegistration,
                        as: 'registrations',
                        include: [{ model: User, attributes: ['id', 'name', 'email'] }],
                    },
                ],
            });

            if (!webinar) {
                return res.status(404).json({ message: 'Webinaire introuvable' });
            }

            const data = webinar.toJSON() as any;
            data.registrationsCount = data.registrations?.length || 0;

            return res.status(200).json({ webinar: data });
        } catch (e: any) {
            console.error(e);
            return res.status(500).json({ message: e.message || "Erreur lors du chargement du webinaire" });
        }
    }

    /**
     * update()
     *
     * Update a webinar
     *
     * @param {CustomRequest} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async update(req: CustomRequest | any, res: Response): Promise<any> {
        const {
            title,
            description,
            start_date,
            end_date,
            meeting_link,
            visibility,
            access_code,
            max_participants,
        } = req.body;

        try {
            const webinar = await Webinar.findByPk(req.params.id);

            if (!webinar) {
                return res.status(404).json({ message: 'Webinaire introuvable' });
            }

            // Vérifier que l'utilisateur est bien le créateur
            if (webinar.instructor_id !== req.userId) {
                return res.status(403).json({ message: 'Non autorisé à modifier ce webinaire' });
            }

            // Recalculer la durée si les dates changent
            let duration = webinar.duration;
            if (start_date && end_date) {
                const start = new Date(start_date);
                const end = new Date(end_date);
                duration = Math.round((end.getTime() - start.getTime()) / 60000);
                if (duration <= 0) {
                    return res.status(400).json({ message: 'La date de fin doit être après la date de début' });
                }
            }

            await webinar.update({
                title: title ?? webinar.title,
                description: description ?? webinar.description,
                start_date: start_date ?? webinar.start_date,
                end_date: end_date ?? webinar.end_date,
                duration,
                meeting_link: meeting_link ?? webinar.meeting_link,
                visibility: visibility ?? webinar.visibility,
                access_code: visibility === 'private'
                  ? (access_code || webinar.access_code || generateAccessCode())
                  : null,
                max_participants: max_participants ?? webinar.max_participants,
            });

            // Re-fetch
            const updated = await Webinar.findByPk(webinar.id, {
                include: [
                    { model: WebinarStatus, as: 'status' },
                    { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] },
                    { model: Institution, as: 'institution' },
                ],
            });

            return res.status(200).json({ webinar: updated, message: 'Webinaire mis à jour avec succès' });
        } catch (e: any) {
            console.error(e);
            return res.status(500).json({ message: e.message || "Erreur lors de la mise à jour du webinaire" });
        }
    }

    /**
     * updateStatus()
     *
     * Update webinar status (e.g. mark as Live, Past, Cancelled)
     *
     * @param {CustomRequest} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async updateStatus(req: CustomRequest | any, res: Response): Promise<any> {
        const { status } = req.body;

        try {
            const webinar = await Webinar.findByPk(req.params.id);

            if (!webinar) {
                return res.status(404).json({ message: 'Webinaire introuvable' });
            }

            const statusRecord = await WebinarStatus.findOne({ where: { title: status } });
            if (!statusRecord) {
                return res.status(400).json({ message: `Statut "${status}" invalide` });
            }

            await webinar.update({ status_id: statusRecord.id });

            const updated = await Webinar.findByPk(webinar.id, {
                include: [{ model: WebinarStatus, as: 'status' }],
            });

            return res.status(200).json({ webinar: updated, message: 'Statut mis à jour' });
        } catch (e: any) {
            console.error(e);
            return res.status(500).json({ message: e.message || "Erreur" });
        }
    }

    /**
     * generateRoom()
     *
     * Generate a Jitsi Meet room for a webinar and set status to Live.
     * Room name format: mboa-{webinarId}-{8randomChars}
     *
     * @param {CustomRequest} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async generateRoom(req: CustomRequest | any, res: Response): Promise<any> {
        try {
            const webinar = await Webinar.findByPk(req.params.id, {
                include: [{ model: WebinarStatus, as: 'status' }],
            });

            if (!webinar) {
                return res.status(404).json({ message: 'Webinaire introuvable' });
            }

            // Si un lien Jitsi existe déjà, le réutiliser
            let meetingLink = webinar.meeting_link;
            if (!meetingLink || !meetingLink.includes('meet.jit.si')) {
                const randomPart = Math.random().toString(36).substring(2, 10);
                const roomName = `mboa-${webinar.id}-${randomPart}`;
                meetingLink = `https://meet.jit.si/${roomName}`;
            }

            // Ne passer à Live que si le statut actuel n'est pas Past ou Cancelled
            const currentStatus = webinar.status?.title;
            if (currentStatus === 'Past' || currentStatus === 'Cancelled') {
                // Mettre à jour le meeting_link tout de même, mais garder le statut
                await webinar.update({ meeting_link: meetingLink });
            } else {
                const liveStatus = await WebinarStatus.findOne({ where: { title: 'Live' } });
                if (!liveStatus) {
                    return res.status(500).json({ message: 'Statut Live introuvable' });
                }
                await webinar.update({
                    meeting_link: meetingLink,
                    status_id: liveStatus.id,
                });
            }

            const updated = await Webinar.findByPk(webinar.id, {
                include: [
                    { model: WebinarStatus, as: 'status' },
                    { model: Institution, as: 'institution', attributes: ['id', 'name'] },
                ],
            });

            return res.status(200).json({
                webinar: updated,
                meeting_link: meetingLink,
                message: 'Salle de visioconférence prête',
            });
        } catch (e: any) {
            console.error(e);
            return res.status(500).json({ message: e.message || "Erreur lors de la création de la salle" });
        }
    }

    /**
     * destroy()
     *
     * Delete a webinar
     *
     * @param {CustomRequest} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async destroy(req: CustomRequest | any, res: Response): Promise<any> {
        try {
            const webinar = await Webinar.findByPk(req.params.id);

            if (!webinar) {
                return res.status(404).json({ message: 'Webinaire introuvable' });
            }

            if (webinar.instructor_id !== req.userId) {
                return res.status(403).json({ message: 'Non autorisé à supprimer ce webinaire' });
            }

            // Supprimer les inscriptions associées
            await WebinarRegistration.destroy({ where: { webinar_id: webinar.id } });
            await webinar.destroy();

            return res.status(200).json({ message: 'Webinaire supprimé avec succès' });
        } catch (e: any) {
            console.error(e);
            return res.status(500).json({ message: e.message || "Erreur lors de la suppression" });
        }
    }

    /**
     * register()
     *
     * Register current user to a webinar
     *
     * @param {CustomRequest} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async register(req: CustomRequest | any, res: Response): Promise<any> {
        try {
            const webinarId = req.params.id;
            const userId = req.body.user_id || req.userId;

            const webinar = await Webinar.findByPk(webinarId, {
                include: [{ model: WebinarStatus, as: 'status' }],
            });

            if (!webinar) {
                return res.status(404).json({ message: 'Webinaire introuvable' });
            }

            // Vérifier que le webinaire n'est pas passé ou annulé
            if (webinar.status?.title === 'Past' || webinar.status?.title === 'Cancelled') {
                return res.status(400).json({ message: 'Ce webinaire est terminé ou annulé' });
            }

            // Vérifier les places disponibles
            if (webinar.max_participants) {
                const count = await WebinarRegistration.count({ where: { webinar_id: webinarId } });
                if (count >= webinar.max_participants) {
                    return res.status(400).json({ message: 'Webinaire complet — plus de places disponibles' });
                }
            }

            // Vérifier que l'utilisateur n'est pas déjà inscrit
            const existing = await WebinarRegistration.findOne({
                where: { webinar_id: webinarId, user_id: userId },
            });

            if (existing) {
                return res.status(400).json({ message: 'Vous êtes déjà inscrit à ce webinaire' });
            }

            // Si c'est un webinaire privé, vérifier le code d'accès
            if (webinar.visibility === 'private') {
                const providedCode = req.body.access_code;
                if (!providedCode || providedCode !== webinar.access_code) {
                    return res.status(400).json({ message: 'Code d\'accès invalide' });
                }
            }

            const registration = await WebinarRegistration.create({
                webinar_id: webinarId,
                user_id: userId,
            });

            return res.status(201).json({
                registration,
                message: 'Inscription au webinaire réussie',
            });
        } catch (e: any) {
            console.error(e);
            return res.status(500).json({ message: e.message || "Erreur lors de l'inscription" });
        }
    }

    /**
     * unregister()
     *
     * Unregister current user from a webinar
     *
     * @param {CustomRequest} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async unregister(req: CustomRequest | any, res: Response): Promise<any> {
        try {
            const webinarId = req.params.id;
            const userId = req.userId;

            const registration = await WebinarRegistration.findOne({
                where: { webinar_id: webinarId, user_id: userId },
            });

            if (!registration) {
                return res.status(404).json({ message: 'Inscription introuvable' });
            }

            await registration.destroy();

            return res.status(200).json({ message: 'Désinscription réussie' });
        } catch (e: any) {
            console.error(e);
            return res.status(500).json({ message: e.message || "Erreur lors de la désinscription" });
        }
    }

    /**
     * registrations()
     *
     * Get all registrations for a webinar
     *
     * @param {CustomRequest} req: Request object
     * @param {Response} res: Response object
     *
     * @return Object
     */
    public static async registrations(req: CustomRequest | any, res: Response): Promise<any> {
        try {
            const webinarId = req.params.id;

            const webinar = await Webinar.findByPk(webinarId);
            if (!webinar) {
                return res.status(404).json({ message: 'Webinaire introuvable' });
            }

            const registrations = await WebinarRegistration.findAll({
                where: { webinar_id: webinarId },
                include: [
                    { model: User, attributes: ['id', 'name', 'email'] },
                ],
                order: [['createdAt', 'DESC']],
            });

            return res.status(200).json({ registrations, total: registrations.length });
        } catch (e: any) {
            console.error(e);
            return res.status(500).json({ message: e.message || "Erreur" });
        }
    }
}

export { WebinarController };
