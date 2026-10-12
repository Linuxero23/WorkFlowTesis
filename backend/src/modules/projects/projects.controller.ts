import { Request, Response } from 'express';
import { getProjectStudentProgress, getStudentProject, getTutorProjects } from './projects.service';
import { HttpError, parsePositiveId, requireRole } from '../shared/academic';
function handleError(res: Response, error: unknown) { const status = error instanceof HttpError ? error.statusCode : 500; if (status === 500) console.error(error); res.status(status).json({ message: error instanceof HttpError ? error.message : 'Error interno del servidor' }); }
export async function studentProject(req: Request, res: Response) { try { const user = requireRole(req, ['ESTUDIANTE']); if (user.id !== Number(req.params.userId)) throw new HttpError(403, 'No puedes consultar otro proyecto'); res.json(await getStudentProject(user.id)); } catch (e) { handleError(res, e); } }
export async function tutorProjects(req: Request, res: Response) { try { const user = requireRole(req, ['PROFESOR', 'COORDINADOR', 'ADMINISTRADOR']); res.json(await getTutorProjects(user.id)); } catch (e) { handleError(res, e); } }
export async function projectStudentProgress(req: Request, res: Response) {
  try {
    const user = requireRole(req, ['ESTUDIANTE', 'PROFESOR', 'COORDINADOR', 'ADMINISTRADOR']);
    const progress = await getProjectStudentProgress(
      parsePositiveId(String(req.params.projectId), 'Proyecto'),
      user.id,
      user.role
    );
    res.json(progress);
  } catch (e) {
    handleError(res, e);
  }
}
