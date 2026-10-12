import sql from 'mssql';
import './environment';

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

function environmentBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  throw new Error(`${name} debe ser true o false`);
}

const dbConfig: sql.config = {
  user: requiredEnvironment('DB_USER'),
  password: requiredEnvironment('DB_PASSWORD'),
  server: requiredEnvironment('DB_SERVER'),
  port: Number(process.env.DB_PORT) || 1435,
  database: requiredEnvironment('DB_DATABASE'),

  options: {
    encrypt: environmentBoolean('DB_ENCRYPT', true),
    trustServerCertificate: environmentBoolean('DB_TRUST_SERVER_CERTIFICATE', false)
  }
};

if (
  process.env.NODE_ENV === 'production'
  && (!dbConfig.options?.encrypt || dbConfig.options.trustServerCertificate)
) {
  throw new Error('Producción requiere DB_ENCRYPT=true y DB_TRUST_SERVER_CERTIFICATE=false');
}

export async function connectDatabase() {
  try {
    return await sql.connect(dbConfig);
  } catch (error) {
    console.error('Error conectando a SQL Server:', error);
    throw error;
  }
}