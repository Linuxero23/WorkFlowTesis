import { Notification, User } from '../types';
import { apiFetch } from './api';

interface ApiNotification {
  id_notificacion: number;
  titulo: string;
  mensaje: string;
  fecha_creacion: string;
  leida: boolean;
  tipo: string;
}

export async function fetchNotifications(user: User): Promise<Notification[]> {
  const rows = await apiFetch<ApiNotification[]>(`/notifications/user/${user.id}`, user);
  return rows.map(row => ({
    id: String(row.id_notificacion),
    title: row.titulo,
    message: row.mensaje,
    date: row.fecha_creacion,
    read: row.leida,
    type: row.tipo.toLowerCase() === 'success' ? 'success'
      : row.tipo.toLowerCase() === 'warning' ? 'warning'
        : 'info',
  }));
}
