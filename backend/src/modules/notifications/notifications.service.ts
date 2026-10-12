import { connectDatabase } from '../../config/database';
import { HttpError } from '../shared/academic';

export async function listNotifications(userId: number) {
  const pool = await connectDatabase();
  const result = await pool.request().input('userId', userId).query('SELECT * FROM Notificaciones WHERE id_usuario = @userId ORDER BY fecha_creacion DESC');
  return result.recordset;
}

export async function markRead(notificationId: number, userId: number) {
  const pool = await connectDatabase();
  const result = await pool.request().input('id', notificationId).input('userId', userId).query('UPDATE Notificaciones SET leida = 1, fecha_lectura = GETDATE() OUTPUT INSERTED.* WHERE id_notificacion = @id AND id_usuario = @userId');
  if (!result.recordset[0]) throw new HttpError(404, 'Notificación no encontrada');
  return result.recordset[0];
}

export async function markAllRead(userId: number) {
  const pool = await connectDatabase();
  await pool.request().input('userId', userId).query('UPDATE Notificaciones SET leida = 1, fecha_lectura = GETDATE() WHERE id_usuario = @userId AND leida = 0');
  return { success: true };
}
