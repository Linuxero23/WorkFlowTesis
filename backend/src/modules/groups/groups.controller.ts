import { Request, Response } from 'express';
import { HttpError, parsePositiveId, requireRole, requestUser } from '../shared/academic';
import { academicAccess, addStudent, changeTutor, createGroup, getGroup, listGroups, removeStudent, setGroupActive, updateGroup } from './groups.service';

function handleError(res: Response, error: unknown) {
  const status = error instanceof HttpError ? error.statusCode : 500;
  if (status === 500) console.error(error);
  res.status(status).json({ message: error instanceof HttpError ? error.message : 'Error interno del servidor' });
}

export async function getGroups(req: Request, res: Response) { try { const user = requireRole(req, ['COORDINADOR', 'ADMINISTRADOR', 'PROFESOR']); res.json(await listGroups(user.role === 'PROFESOR' ? user.id : undefined)); } catch (error) { handleError(res, error); } }
export async function getGroupById(req: Request, res: Response) { try { const user = requireRole(req, ['COORDINADOR', 'ADMINISTRADOR', 'PROFESOR']); res.json(await getGroup(parsePositiveId(String(req.params.id), 'Grupo'), user)); } catch (error) { handleError(res, error); } }
export async function postGroup(req: Request, res: Response) { try { requireRole(req, ['COORDINADOR', 'ADMINISTRADOR']); res.status(201).json(await createGroup(req.body)); } catch (error) { handleError(res, error); } }
export async function patchGroup(req: Request, res: Response) { try { requireRole(req, ['COORDINADOR', 'ADMINISTRADOR']); res.json(await updateGroup(parsePositiveId(String(req.params.id), 'Grupo'), req.body)); } catch (error) { handleError(res, error); } }
export async function postGroupStudent(req: Request, res: Response) { try { requireRole(req, ['COORDINADOR', 'ADMINISTRADOR']); res.json(await addStudent(parsePositiveId(String(req.params.id), 'Grupo'), parsePositiveId(String(req.body.id_estudiante), 'Estudiante'))); } catch (error) { handleError(res, error); } }
export async function deleteGroupStudent(req: Request, res: Response) { try { requireRole(req, ['COORDINADOR', 'ADMINISTRADOR']); res.json(await removeStudent(parsePositiveId(String(req.params.id), 'Grupo'), parsePositiveId(String(req.params.studentId), 'Estudiante'))); } catch (error) { handleError(res, error); } }
export async function patchGroupTutor(req: Request, res: Response) { try { requireRole(req, ['COORDINADOR', 'ADMINISTRADOR']); res.json(await changeTutor(parsePositiveId(String(req.params.id), 'Grupo'), parsePositiveId(String(req.body.id_profesor), 'Profesor'))); } catch (error) { handleError(res, error); } }
export async function deactivateGroup(req: Request, res: Response) { try { const user = requireRole(req, ['COORDINADOR', 'ADMINISTRADOR']); res.json(await setGroupActive(parsePositiveId(String(req.params.id), 'Grupo'), false, user.id)); } catch (error) { handleError(res, error); } }
export async function activateGroup(req: Request, res: Response) { try { const user = requireRole(req, ['COORDINADOR', 'ADMINISTRADOR']); res.json(await setGroupActive(parsePositiveId(String(req.params.id), 'Grupo'), true, user.id)); } catch (error) { handleError(res, error); } }
export async function getAcademicAccess(req: Request, res: Response) { try { const user = requestUser(req); const id = parsePositiveId(String(req.params.userId), 'Usuario'); if (id !== user.id) throw new HttpError(403, 'No puedes consultar el acceso de otro usuario'); res.json(await academicAccess(id)); } catch (error) { handleError(res, error); } }
