import { Router } from 'express';
import { authorizeDeliveryUpload, getDeliveries, patchReview, postDelivery, upload } from './deliveries.controller';

export const deliveriesRouter = Router();
deliveriesRouter.get('/activities/:activityId/deliveries', getDeliveries);
deliveriesRouter.post('/activities/:activityId/deliveries', authorizeDeliveryUpload, upload.single('archivo'), postDelivery);
deliveriesRouter.patch('/deliveries/:id/review', patchReview);
