import { Router } from 'express';
import { getNotifications, readAllNotifications, readNotification } from './notifications.controller';
export const notificationsRouter = Router();
notificationsRouter.get('/notifications/user/:userId', getNotifications);
notificationsRouter.patch('/notifications/:id/read', readNotification);
notificationsRouter.patch('/notifications/read-all/:userId', readAllNotifications);
