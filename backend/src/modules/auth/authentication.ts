import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { connectDatabase } from '../../config/database';
import { AuthenticatedRequestUser, HttpError } from '../shared/academic';

const issuer = 'polythesis-api';
const audience = 'polythesis-client';
const roles = ['ESTUDIANTE', 'PROFESOR', 'COORDINADOR', 'ADMINISTRADOR'];

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const characterCount = secret ? Array.from(secret).length : 0;
  if (
    !secret
    || characterCount < 32
    || Buffer.byteLength(secret, 'utf8') < 32
    || secret.trim() !== secret
  ) {
    throw new Error('JWT_SECRET debe estar definido y tener al menos 32 caracteres');
  }
  return secret;
}

function jwtExpirationSeconds(): number {
  const expiresInSeconds = Number(process.env.JWT_EXPIRES_IN_SECONDS || 28_800);
  if (!Number.isSafeInteger(expiresInSeconds) || expiresInSeconds < 60 || expiresInSeconds > 2_592_000) {
    throw new Error('JWT_EXPIRES_IN_SECONDS debe estar entre 60 y 2592000');
  }
  return expiresInSeconds;
}

export function validateJwtConfiguration(): void {
  jwtSecret();
  jwtExpirationSeconds();
}

export function createAccessToken(user: AuthenticatedRequestUser): string {
  if (!Number.isSafeInteger(user.id) || user.id <= 0 || !roles.includes(user.role)) {
    throw new Error('No se puede emitir un token para un usuario no válido');
  }
  return jwt.sign(
    { role: user.role },
    jwtSecret(),
    {
      algorithm: 'HS256',
      audience,
      expiresIn: jwtExpirationSeconds(),
      issuer,
      subject: String(user.id),
    },
  );
}

export async function authenticateRequest(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authorization = req.header('authorization');
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new HttpError(401, 'Token de acceso requerido');

    let payload: JwtPayload;
    try {
      const decoded = jwt.verify(match[1], jwtSecret(), {
        algorithms: ['HS256'],
        audience,
        issuer,
      });
      if (typeof decoded === 'string') throw new Error('Payload no válido');
      payload = decoded;
    } catch {
      throw new HttpError(401, 'Token no válido o expirado');
    }

    const id = Number(payload.sub);
    const role = typeof payload.role === 'string' ? payload.role : '';
    if (!Number.isSafeInteger(id) || id <= 0 || !roles.includes(role)) {
      throw new HttpError(401, 'Token no válido');
    }

    const pool = await connectDatabase();
    const result = await pool.request().input('id', id).query(
      'SELECT rol FROM Usuarios WHERE id_usuario = @id AND activo = 1',
    );
    const currentRole = result.recordset[0]?.rol as string | undefined;
    if (!currentRole || currentRole !== role) {
      throw new HttpError(401, 'La sesión ya no está activa');
    }

    req.user = { id, role };
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      _res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}
