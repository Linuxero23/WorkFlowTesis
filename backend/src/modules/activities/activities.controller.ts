import { Request, Response } from 'express';
import { createActivity, listActivities, setActivityLock, updateActivity } from './activities.service';
import { HttpError, parsePositiveId, requireRole } from '../shared/academic';

function handleError(res: Response, error: unknown) {
  const status = error instanceof HttpError ? error.statusCode : 500;
  if (status === 500) console.error(error);
  res.status(status).json({ message: error instanceof HttpError ? error.message : 'Error interno del servidor' });
}

export async function getActivities(req: Request, res: Response) { try { const user = requireRole(req, ['ESTUDIANTE','PROFESOR','COORDINADOR','ADMINISTRADOR']); res.json(await listActivities(parsePositiveId(String(req.params.projectId), 'Proyecto'), user.id)); } catch (e) { handleError(res, e); } }
export async function postActivity(req: Request, res: Response) { try { const user = requireRole(req, ['PROFESOR']); res.status(201).json(await createActivity(parsePositiveId(String(req.params.projectId), 'Proyecto'), user.id, req.body)); } catch (e) { handleError(res, e); } }
export async function patchActivity(req: Request, res: Response) { try { const user = requireRole(req, ['PROFESOR']); res.json(await updateActivity(parsePositiveId(String(req.params.id), 'Actividad'), user.id, req.body)); } catch (e) { handleError(res, e); } }
export async function unlockActivity(req: Request, res: Response) { try { const user = requireRole(req, ['PROFESOR']); res.json(await setActivityLock(parsePositiveId(String(req.params.id), 'Actividad'), user.id, false)); } catch (e) { handleError(res, e); } }
export async function lockActivity(req: Request, res: Response) { try { const user = requireRole(req, ['PROFESOR']); res.json(await setActivityLock(parsePositiveId(String(req.params.id), 'Actividad'), user.id, true)); } catch (e) { handleError(res, e); } }
