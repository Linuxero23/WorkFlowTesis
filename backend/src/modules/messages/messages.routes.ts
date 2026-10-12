import { Router } from 'express';
import { getMessages, messageUpload, patchMessageRead, postMessage } from './messages.controller';
export const messagesRouter = Router();
messagesRouter.get('/projects/:projectId/messages', getMessages);
messagesRouter.post('/projects/:projectId/messages', messageUpload.single('archivo'), postMessage);
messagesRouter.patch('/messages/:id/read', patchMessageRead);
