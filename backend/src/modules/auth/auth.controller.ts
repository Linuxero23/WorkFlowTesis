import { Request, Response } from 'express';
import { LoginError, RegistrationError, loginUser, registerUser } from './auth.service';
import { createAccessToken } from './authentication';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      user,
    });
  } catch (error: unknown) {
    if (error instanceof RegistrationError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error('Error registrando usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const authenticatedUser = await loginUser(req.body);
    const token = createAccessToken({ id: authenticatedUser.id_usuario, role: authenticatedUser.rol });
    res.status(200).json({ user: authenticatedUser, token });
  } catch (error: unknown) {
    if (error instanceof LoginError) {
      res.status(401).json({ message: error.message });
      return;
    }

    console.error('Error autenticando usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}