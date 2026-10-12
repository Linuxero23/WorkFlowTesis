import { Request, Response } from 'express';
import { addFeedback, listFeedback } from './feedback.service';
import { HttpError, parsePositiveId, requireRole } from '../shared/academic';

function handleError(res: Response, error: unknown) { const status = error instanceof HttpError ? error.statusCode : 500; if (status === 500) console.error(error); res.status(status).json({ message: error instanceof HttpError ? error.message : 'Error interno del servidor' }); }
export async function getFeedback(req: Request, res: Response) { try { const user = requireRole(req, ['ESTUDIANTE','PROFESOR','COORDINADOR']); res.json(await listFeedback(parsePositiveId(String(req.params.id), 'Entrega'), user.id)); } catch (e) { handleError(res, e); } }
export async function postFeedback(req: Request, res: Response) { try { const user = requireRole(req, ['PROFESOR']); res.status(201).json(await addFeedback(parsePositiveId(String(req.params.id), 'Entrega'), user.id, req.body)); } catch (e) { handleError(res, e); } }
