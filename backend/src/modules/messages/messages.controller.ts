import { Request, Response } from 'express';
import { upload } from '../deliveries/deliveries.controller';
import { listMessages, readMessage, sendMessage } from './messages.service';
import { HttpError, parsePositiveId, requestUser } from '../shared/academic';
function handleError(res: Response, error: unknown) { const status = error instanceof HttpError ? error.statusCode : 500; if (status === 500) console.error(error); res.status(status).json({ message: error instanceof HttpError ? error.message : 'Error interno del servidor' }); }
export async function getMessages(req: Request, res: Response) { try { const user = requestUser(req); res.json(await listMessages(parsePositiveId(String(req.params.projectId), 'Proyecto'), user.id)); } catch (e) { handleError(res, e); } }
export async function postMessage(req: Request, res: Response) { try { const user = requestUser(req); res.status(201).json(await sendMessage(parsePositiveId(String(req.params.projectId), 'Proyecto'), user.id, { receptor: req.body.id_receptor, mensaje: req.body.mensaje, file: req.file ? { filename: req.file.filename } : undefined })); } catch (e) { handleError(res, e); } }
export async function patchMessageRead(req: Request, res: Response) { try { const user = requestUser(req); res.json(await readMessage(parsePositiveId(String(req.params.id), 'Mensaje'), user.id)); } catch (e) { handleError(res, e); } }
export const messageUpload = upload;
