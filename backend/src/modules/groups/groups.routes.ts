import { Router } from 'express';
import { activateGroup, deactivateGroup, deleteGroupStudent, getAcademicAccess, getGroupById, getGroups, patchGroup, patchGroupTutor, postGroup, postGroupStudent } from './groups.controller';

export const groupsRouter = Router();
groupsRouter.get('/groups', getGroups);
groupsRouter.get('/groups/:id', getGroupById);
groupsRouter.post('/groups', postGroup);
groupsRouter.patch('/groups/:id', patchGroup);
groupsRouter.post('/groups/:id/students', postGroupStudent);
groupsRouter.delete('/groups/:id/students/:studentId', deleteGroupStudent);
groupsRouter.patch('/groups/:id/tutor', patchGroupTutor);
groupsRouter.patch('/groups/:id/deactivate', deactivateGroup);
groupsRouter.patch('/groups/:id/activate', activateGroup);
groupsRouter.get('/users/:userId/academic-access', getAcademicAccess);
