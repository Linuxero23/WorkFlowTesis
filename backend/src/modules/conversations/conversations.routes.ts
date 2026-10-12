import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { directConversation, getConversations, getMessages, groupConversationById, postMessage, readConversation } from './conversations.controller';

const chatDirectory = path.resolve(process.cwd(), 'uploads', 'chat');
fs.mkdirSync(chatDirectory, { recursive: true });
const upload = multer({ dest: chatDirectory, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, callback) => callback(null, ['.pdf', '.doc', '.docx', '.xlsx', '.png', '.jpg', '.jpeg'].includes(path.extname(file.originalname).toLowerCase())) });

export const conversationsRouter = Router();
conversationsRouter.get('/conversations/user/:userId', getConversations);
conversationsRouter.get('/conversations/:conversationId/messages', getMessages);
conversationsRouter.post('/conversations/:conversationId/messages', upload.single('archivo'), postMessage);
conversationsRouter.post('/conversations/direct', directConversation);
conversationsRouter.patch('/conversations/:id/read', readConversation);
conversationsRouter.get('/groups/:groupId/conversation', groupConversationById);
