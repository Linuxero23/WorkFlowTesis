import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { authRouter } from './modules/auth/auth.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend de PolyThesis funcionando'
  });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor');
    process.exit(1);
  }
}

app.get('/api/test-db', async (req, res) => {
  try {
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
    console.error('Error consultando la base de datos:', error);

    res.status(500).json({
      status: 'error',
      message: 'No se pudo consultar la base de datos'
    });
  }
});


startServer();