import { Request, Response } from 'express';
import { HttpError, requireRole } from '../shared/academic';
import { coordinatorStats, listUsers } from './users.service';

function handleError(res: Response, error: unknown) {
  const status = error instanceof HttpError ? error.statusCode : 500;
  if (status === 500) console.error(error);
  res.status(status).json({ message: error instanceof HttpError ? error.message : 'Error interno del servidor' });
}

export async function getUsers(req: Request, res: Response) {
  try {
    requireRole(req, ['COORDINADOR', 'ADMINISTRADOR']);
    const role = typeof req.query.role === 'string' ? req.query.role.toUpperCase() : undefined;
    if (role && !['ESTUDIANTE', 'PROFESOR'].includes(role)) throw new HttpError(400, 'Rol de consulta no válido');
    res.json(await listUsers(role));
  } catch (error) { handleError(res, error); }
}

export async function getCoordinatorStats(req: Request, res: Response) {
  try {
    requireRole(req, ['COORDINADOR', 'ADMINISTRADOR']);
    res.json(await coordinatorStats());
  } catch (error) { handleError(res, error); }
}
