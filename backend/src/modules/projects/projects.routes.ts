import { Router } from 'express';
import { projectStudentProgress, studentProject, tutorProjects } from './projects.controller';
export const projectsRouter = Router();
projectsRouter.get('/projects/student/:userId', studentProject);
projectsRouter.get('/projects/tutored', tutorProjects);
projectsRouter.get('/projects/:projectId/student-progress', projectStudentProgress);
