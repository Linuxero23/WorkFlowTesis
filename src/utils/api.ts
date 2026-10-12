import { User } from '../types';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function apiFetch<T>(path: string, user: User, options: RequestInit = {}): Promise<T> {
  if (!user.token) throw new Error('La sesión expiró. Inicia sesión nuevamente.');
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Authorization', `Bearer ${user.token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'No se pudo completar la solicitud');
  return data as T;
}
