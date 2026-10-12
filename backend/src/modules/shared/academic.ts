import { Request } from 'express';
import { connectDatabase } from '../../config/database';

export class HttpError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}

export interface AuthenticatedRequestUser {
  id: number;
  role: string;
}

export function requestUser(req: Request): AuthenticatedRequestUser {
  if (!req.user) throw new HttpError(401, 'Debes iniciar sesión');
  return req.user;
}

export function requireRole(req: Request, roles: string[]): AuthenticatedRequestUser {
  const user = requestUser(req);
  if (!roles.includes(user.role)) throw new HttpError(403, 'No tienes permisos para esta acción');
  return user;
}

export async function projectAccess(projectId: number, userId: number): Promise<{ id_estudiante: number; id_tutor: number; id_grupo: number | null }> {
  const pool = await connectDatabase();
  const result = await pool.request()
    .input('projectId', projectId)
    .input('userId', userId)
    .query(`
      SELECT p.id_estudiante, p.id_tutor, g.id_grupo FROM Proyectos p
      LEFT JOIN GruposTrabajo g ON g.id_proyecto = p.id_proyecto
      WHERE p.id_proyecto = @projectId
        AND EXISTS (
          SELECT 1
          FROM Usuarios u
          WHERE u.id_usuario = @userId
            AND u.activo = 1
            AND (
              (
                u.rol = 'ESTUDIANTE'
                AND EXISTS (
                  SELECT 1 FROM GrupoEstudiantes ge
                  JOIN GruposTrabajo g ON g.id_grupo = ge.id_grupo
                  WHERE ge.id_estudiante = @userId AND g.activo = 1
                    AND g.id_proyecto = p.id_proyecto
                )
              )
              OR (
                u.rol = 'PROFESOR'
                AND (
                  p.id_tutor = @userId
                  OR EXISTS (
                    SELECT 1 FROM GruposTrabajo g
                    WHERE g.id_proyecto = p.id_proyecto
                      AND g.id_profesor = @userId
                      AND g.activo = 1
                  )
                )
              )
              OR u.rol IN ('COORDINADOR', 'ADMINISTRADOR')
            )
        )
    `);
  if (!result.recordset[0]) throw new HttpError(403, 'No tienes acceso a este proyecto');
  return result.recordset[0];
}

export async function createNotification(input: {
  userId: number;
  projectId?: number;
  activityId?: number;
  deliveryId?: number;
  title: string;
  message: string;
  type?: string;
}): Promise<void> {
  const pool = await connectDatabase();
  await pool.request()
    .input('userId', input.userId)
    .input('projectId', input.projectId ?? null)
    .input('activityId', input.activityId ?? null)
    .input('deliveryId', input.deliveryId ?? null)
    .input('title', input.title)
    .input('message', input.message)
    .input('type', input.type || 'INFO')
    .query(`
      INSERT INTO Notificaciones
        (id_usuario, id_proyecto, id_actividad, id_entrega, titulo, mensaje, tipo, leida)
      VALUES (@userId, @projectId, @activityId, @deliveryId, @title, @message, @type, 0)
    `);
}

export async function logActivity(userId: number, projectId: number | null, action: string, description: string): Promise<void> {
  try {
    const pool = await connectDatabase();
    await pool.request()
      .input('userId', userId)
      .input('projectId', projectId)
      .input('action', action)
      .input('description', description)
      .query(`
        INSERT INTO HistorialActividad (id_usuario, id_proyecto, tipo_accion, descripcion)
        VALUES (@userId, @projectId, @action, @description)
      `);
  } catch (error) {
    console.warn('No se pudo registrar el historial secundario de la acción académica', {
      action,
      userId,
      projectId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function parsePositiveId(value: string | undefined, name: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, `${name} no válido`);
  return id;
}
