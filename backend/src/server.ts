import express from 'express';
import cors from 'cors';
import './config/environment';
import fs from 'node:fs';
import path from 'node:path';
import { connectDatabase } from './config/database';
import { authRouter } from './modules/auth/auth.routes';
import { activitiesRouter } from './modules/activities/activities.routes';
import { deliveriesRouter } from './modules/deliveries/deliveries.routes';
import { feedbackRouter } from './modules/feedback/feedback.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { messagesRouter } from './modules/messages/messages.routes';
import { projectsRouter } from './modules/projects/projects.routes';
import { usersRouter } from './modules/users/users.routes';
import { groupsRouter } from './modules/groups/groups.routes';
import { conversationsRouter } from './modules/conversations/conversations.routes';
import { authenticateRequest, validateJwtConfiguration } from './modules/auth/authentication';
import { HttpError, requireRole } from './modules/shared/academic';
import { filesRouter } from './modules/files/files.routes';

const app = express();
const uploadsDirectory = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDirectory, { recursive: true });

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS?.trim()) {
  throw new Error('CORS_ORIGINS debe configurarse en producción');
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origen no permitido por CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}));
app.use(express.json());
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend de PoliThesis funcionando' });
});
app.use('/api/auth', authRouter);
app.use('/api', authenticateRequest);
app.use('/api', activitiesRouter);
app.use('/api', deliveriesRouter);
app.use('/api', feedbackRouter);
app.use('/api', notificationsRouter);
app.use('/api', messagesRouter);
app.use('/api', projectsRouter);
app.use('/api', usersRouter);
app.use('/api', groupsRouter);
app.use('/api', conversationsRouter);
app.use('/api', filesRouter);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    validateJwtConfiguration();
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
}

app.get('/api/test-db', async (req, res) => {
  try {
    requireRole(req, ['COORDINADOR', 'ADMINISTRADOR']);
    const pool = await connectDatabase();

    const result = await pool.request().query(`
      SELECT COUNT(*) AS totalUsuarios
      FROM Usuarios
    `);

    res.json({
      status: 'ok',
      database: 'SynesisDB',
      totalUsuarios: result.recordset[0].totalUsuarios
    });
  } catch (error) {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ status: 'error', message: error.message });
      return;
    }
    console.error('Error consultando la base de datos:', error);

    res.status(500).json({
      status: 'error',
      message: 'No se pudo consultar la base de datos'
    });
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no controlado en API:', error);
  res.status(500).json({ message: 'Error interno del servidor' });
});

startServer();