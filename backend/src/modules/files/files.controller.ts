import { Request, Response, NextFunction } from 'express';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';
import { connectDatabase } from '../../config/database';
import { HttpError, projectAccess, requestUser } from '../shared/academic';

const uploadsDirectory = path.resolve(process.cwd(), 'uploads');

function storedUploadPath(storedPath: string): string {
  const normalizedPath = storedPath.replace(/\\/g, '/');
  const match = normalizedPath.match(/^\/?uploads\/(.+)$/i);
  if (!match || path.posix.isAbsolute(match[1])) {
    throw new HttpError(404, 'Archivo no encontrado');
  }
  const filePath = path.resolve(uploadsDirectory, ...match[1].split('/'));
  const relativePath = path.relative(uploadsDirectory, filePath);
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new HttpError(404, 'Archivo no encontrado');
  }
  return filePath;
}

const contentTypes: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

async function sendStoredFile(
  storedPath: string,
  originalName: string,
  preview: boolean,
  res: Response,
  next: NextFunction
) {
  const filePath = storedUploadPath(storedPath);
  try {
    await access(filePath);
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) throw new HttpError(404, 'Archivo no encontrado');
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if ((error as NodeJS.ErrnoException).code === 'ENOENT' || (error as NodeJS.ErrnoException).code === 'ENOTDIR') {
      throw new HttpError(404, 'Archivo no encontrado');
    }
    throw error;
  }

  const extension = path.extname(originalName).toLowerCase();
  const contentType = contentTypes[extension] || 'application/octet-stream';
  const inline = preview && (extension === '.pdf' || contentType.startsWith('image/'));
  const safeName = path.basename(originalName).replace(/[\r\n"]/g, '_');
  const asciiName = safeName.replace(/[^\x20-\x7E]/g, '_');
  res.setHeader(
    'Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(filePath, { headers: { 'Content-Type': contentType } }, error => {
    if (error) {
      if (res.headersSent) next(error);
      else next(new HttpError(404, 'Archivo no encontrado'));
    }
  });
}

export async function downloadDeliveryFile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requestUser(req);
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) throw new HttpError(400, 'Entrega no válida');
    const pool = await connectDatabase();
    const result = await pool.request().input('id', id).query(`
      SELECT e.ruta_archivo, e.nombre_archivo, e.id_estudiante, a.id_proyecto
      FROM Entregas e
      JOIN Actividades a ON a.id_actividad = e.id_actividad
      WHERE e.id_entrega = @id AND e.ruta_archivo IS NOT NULL
    `);
    const delivery = result.recordset[0] as
      | { ruta_archivo: string; nombre_archivo: string; id_estudiante: number; id_proyecto: number }
      | undefined;
    if (!delivery) throw new HttpError(404, 'Archivo no encontrado');
    if (user.role === 'ESTUDIANTE' && delivery.id_estudiante !== user.id) {
      throw new HttpError(403, 'No tienes permiso para descargar este archivo');
    }
    if (!['ESTUDIANTE', 'PROFESOR'].includes(user.role)) {
      throw new HttpError(403, 'No tienes permiso para descargar este archivo');
    }
    await projectAccess(delivery.id_proyecto, user.id);
    await sendStoredFile(delivery.ruta_archivo, delivery.nombre_archivo, req.query.preview === '1', res, next);
  } catch (error) {
    next(error);
  }
}

export async function downloadMessageFile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requestUser(req);
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) throw new HttpError(400, 'Mensaje no válido');
    const pool = await connectDatabase();
    const result = await pool.request().input('id', id).input('userId', user.id).query(`
      SELECT m.archivo_url
      FROM Mensajes m
      JOIN ConversacionParticipantes cp ON cp.id_conversacion = m.id_conversacion
      JOIN Conversaciones c ON c.id_conversacion = m.id_conversacion
      WHERE m.id_mensaje = @id
        AND m.archivo_url IS NOT NULL
        AND cp.id_usuario = @userId
        AND cp.activo = 1
        AND c.activo = 1
    `);
    const file = result.recordset[0] as { archivo_url: string } | undefined;
    if (!file) throw new HttpError(404, 'Archivo no encontrado');
    const name = path.basename(file.archivo_url);
    await sendStoredFile(file.archivo_url, name, req.query.preview === '1', res, next);
  } catch (error) {
    next(error);
  }
}

export function handleFileError(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = error instanceof HttpError ? error.statusCode : 500;
  if (status === 500) console.error(error);
  res.status(status).json({
    message: error instanceof Error ? error.message : 'Error interno del servidor',
  });
}
