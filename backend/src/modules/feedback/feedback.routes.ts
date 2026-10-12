import { Router } from 'express';
import { getFeedback, postFeedback } from './feedback.controller';
export const feedbackRouter = Router();
feedbackRouter.get('/deliveries/:id/feedback', getFeedback);
feedbackRouter.post('/deliveries/:id/feedback', postFeedback);
