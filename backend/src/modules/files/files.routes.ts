import { Router } from 'express';
import { downloadDeliveryFile, downloadMessageFile, handleFileError } from './files.controller';

export const filesRouter = Router();
filesRouter.get('/files/deliveries/:id', downloadDeliveryFile);
filesRouter.get('/files/messages/:id', downloadMessageFile);
filesRouter.use(handleFileError);
