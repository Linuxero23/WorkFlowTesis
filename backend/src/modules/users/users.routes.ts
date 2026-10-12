import { Router } from 'express';
import { getCoordinatorStats, getUsers } from './users.controller';

export const usersRouter = Router();
usersRouter.get('/users', getUsers);
usersRouter.get('/coordinator/stats', getCoordinatorStats);
