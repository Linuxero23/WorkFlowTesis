import { Router } from 'express';
import { getActivities, postActivity, patchActivity, unlockActivity, lockActivity } from './activities.controller';

export const activitiesRouter = Router();
activitiesRouter.get('/projects/:projectId/activities', getActivities);
activitiesRouter.post('/projects/:projectId/activities', postActivity);
activitiesRouter.patch('/activities/:id', patchActivity);
activitiesRouter.patch('/activities/:id/unlock', unlockActivity);
activitiesRouter.patch('/activities/:id/lock', lockActivity);
