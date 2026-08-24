import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  port: Number(process.env.DB_PORT) || 1435,
  database: process.env.DB_DATABASE,

  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

export async function connectDatabase() {
  try {
    const pool = await sql.connect(dbConfig);

    console.log('Conectado a SQL Server');
    console.log(`Base de datos: ${process.env.DB_DATABASE}`);

    return pool;
  } catch (error) {
    console.error('Error conectando a SQL Server:', error);
    throw error;
  }
}