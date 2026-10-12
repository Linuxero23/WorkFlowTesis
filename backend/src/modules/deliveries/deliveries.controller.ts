import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { createDelivery, listDeliveries, reviewDelivery } from './deliveries.service';
import { HttpError, parsePositiveId, requireRole } from '../shared/academic';

export const upload = multer({
  dest: path.resolve(process.cwd(), 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ['.pdf', '.doc', '.docx', '.xlsx', '.png', '.jpg', '.jpeg'];
    callback(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

function handleError(res: Response, error: unknown) {
  const status = error instanceof HttpError ? error.statusCode : 500;
  if (status === 500) console.error(error);
  res.status(status).json({ message: error instanceof HttpError ? error.message : 'Error interno del servidor' });
}

export function authorizeDeliveryUpload(req: Request, res: Response, next: NextFunction) {
  try {
    requireRole(req, ['ESTUDIANTE']);
    next();
  } catch (error) {
    handleError(res, error);
  }
}

export async function getDeliveries(req: Request, res: Response) { try { const user = requireRole(req, ['ESTUDIANTE','PROFESOR','COORDINADOR']); res.json(await listDeliveries(parsePositiveId(String(req.params.activityId), 'Actividad'), user.id, user.role)); } catch (e) { handleError(res, e); } }
export async function postDelivery(req: Request, res: Response) {
  try {
    const user = requireRole(req, ['ESTUDIANTE']);
    const file = req.file ? { originalname: req.file.originalname, filename: req.file.filename } : undefined;
    res.status(201).json(await createDelivery(parsePositiveId(String(req.params.activityId), 'Actividad'), user.id, {
      comentario: req.body.comentario_estudiante,
      url: req.body.url_externa,
      file
    }));
  } catch (error) {
    if (error instanceof HttpError && req.file) {
      try {
        await unlink(req.file.path);
      } catch (cleanupError) {
        if ((cleanupError as NodeJS.ErrnoException).code !== 'ENOENT') console.error('No se pudo limpiar una carga rechazada:', cleanupError);
      }
    }
    handleError(res, error);
  }
}
export async function patchReview(req: Request, res: Response) { try { const user = requireRole(req, ['PROFESOR']); res.json(await reviewDelivery(parsePositiveId(String(req.params.id), 'Entrega'), user.id, req.body)); } catch (e) { handleError(res, e); } }
