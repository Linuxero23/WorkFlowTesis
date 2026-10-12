import bcrypt from 'bcrypt';
import { connectDatabase } from '../../config/database';

export const PUBLIC_ROLES = ['ESTUDIANTE', 'PROFESOR'] as const;
export type UserRole = (typeof PUBLIC_ROLES)[number];

export interface RegisterInput {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
  rol: string;
}

export interface RegisteredUser {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  activo: boolean;
  fecha_registro: Date;
}

export interface LoginInput {
  correo: string;
  password: string;
}

export interface AuthenticatedUser {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
}

export class RegistrationError extends Error {
  constructor(public readonly statusCode: 400 | 409, message: string) {
    super(message);
    this.name = 'RegistrationError';
  }
}

function isValidInstitutionalEmail(email: string): boolean {
  return /^[^\s@]+@poligran\.edu\.co$/.test(email);
}

export async function registerUser(input: RegisterInput | undefined): Promise<RegisteredUser> {
  const nombre = typeof input?.nombre === 'string' ? input.nombre.trim() : '';
  const apellido = typeof input?.apellido === 'string' ? input.apellido.trim() : '';
  const correo = typeof input?.correo === 'string' ? input.correo.trim().toLowerCase() : '';
  const password = typeof input?.password === 'string' ? input.password : '';
  const rol = typeof input?.rol === 'string' ? input.rol.trim().toUpperCase() : '';

  if (!nombre || !apellido || !correo || !password || !rol) {
    throw new RegistrationError(400, 'Todos los campos son obligatorios');
  }

  if (!isValidInstitutionalEmail(correo)) {
    throw new RegistrationError(400, 'El correo debe terminar en @poligran.edu.co');
  }
  if (nombre.length > 100 || apellido.length > 100 || correo.length > 254) {
    throw new RegistrationError(400, 'Nombre, apellido o correo excede la longitud permitida');
  }

  if (!PUBLIC_ROLES.includes(rol as UserRole)) {
    throw new RegistrationError(400, 'El registro público solo permite los roles estudiante o profesor');
  }

  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new RegistrationError(400, 'La contraseña debe tener entre 8 y 72 bytes');
  }

  const pool = await connectDatabase();
  const existingUser = await pool
    .request()
    .input('correo', correo)
    .query('SELECT TOP 1 id_usuario FROM Usuarios WHERE correo = @correo');

  if (existingUser.recordset.length > 0) {
    throw new RegistrationError(409, 'El correo ya está registrado');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await pool
      .request()
      .input('nombre', nombre)
      .input('apellido', apellido)
      .input('correo', correo)
      .input('password_hash', passwordHash)
      .input('rol', rol)
      .query(`
        INSERT INTO Usuarios (nombre, apellido, correo, password_hash, rol)
        OUTPUT INSERTED.id_usuario, INSERTED.nombre, INSERTED.apellido,
               INSERTED.correo, INSERTED.rol, INSERTED.activo,
               INSERTED.fecha_registro
        VALUES (@nombre, @apellido, @correo, @password_hash, @rol)
      `);

    return result.recordset[0] as RegisteredUser;
  } catch (error: unknown) {
    const sqlError = error as { number?: number };
    if (sqlError.number === 2601 || sqlError.number === 2627) {
      throw new RegistrationError(409, 'El correo ya está registrado');
    }
    throw error;
  }
}

export class LoginError extends Error {
  constructor(message = 'Correo o contraseña incorrectos') {
    super(message);
    this.name = 'LoginError';
  }
}

export async function loginUser(input: LoginInput | undefined): Promise<AuthenticatedUser> {
  const correo = typeof input?.correo === 'string' ? input.correo.trim().toLowerCase() : '';
  const password = typeof input?.password === 'string' ? input.password : '';

  if (!isValidInstitutionalEmail(correo) || !password || Buffer.byteLength(password, 'utf8') > 72) {
    throw new LoginError();
  }

  const pool = await connectDatabase();
  const result = await pool
    .request()
    .input('correo', correo)
    .query(`
      SELECT TOP 1 id_usuario, nombre, apellido, correo, password_hash, rol
      FROM Usuarios
      WHERE correo = @correo AND activo = 1
    `);

  const databaseUser = result.recordset[0] as {
    id_usuario: number;
    nombre: string;
    apellido: string;
    correo: string;
    password_hash: string | null;
    rol: string;
  } | undefined;

  if (!databaseUser?.password_hash || !(await bcrypt.compare(password, databaseUser.password_hash))) {
    throw new LoginError();
  }

  return {
    id_usuario: databaseUser.id_usuario,
    nombre: databaseUser.nombre,
    apellido: databaseUser.apellido,
    correo: databaseUser.correo,
    rol: databaseUser.rol,
  };
}