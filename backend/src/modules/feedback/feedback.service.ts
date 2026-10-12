import { connectDatabase } from '../../config/database';
import { createNotification, HttpError, logActivity, projectAccess } from '../shared/academic';

const feedbackTypes = ['OBSERVACION', 'CORRECCION', 'APROBACION', 'RECHAZO'];

async function deliveryContext(deliveryId: number) {
  const pool = await connectDatabase();
  const result = await pool.request().input('deliveryId', deliveryId).query(`
    SELECT e.id_entrega, e.id_estudiante, a.id_proyecto, a.titulo, p.id_tutor
    FROM Entregas e JOIN Actividades a ON a.id_actividad = e.id_actividad JOIN Proyectos p ON p.id_proyecto = a.id_proyecto
    WHERE e.id_entrega = @deliveryId
  `);
  if (!result.recordset[0]) throw new HttpError(404, 'Entrega no encontrada');
  return result.recordset[0];
}

export async function listFeedback(deliveryId: number, userId: number) {
  const context = await deliveryContext(deliveryId);
  await projectAccess(context.id_proyecto, userId);
  const pool = await connectDatabase();
  const roleResult = await pool.request().input('userId', userId).query('SELECT rol FROM Usuarios WHERE id_usuario = @userId');
  if (roleResult.recordset[0]?.rol === 'ESTUDIANTE' && context.id_estudiante !== userId) {
    throw new HttpError(403, 'Solo puedes consultar la retroalimentación de tus entregas');
  }
  const result = await pool.request().input('deliveryId', deliveryId).query(`SELECT r.*, CONCAT(u.nombre, ' ', u.apellido) AS autor_nombre FROM Retroalimentaciones r JOIN Usuarios u ON u.id_usuario = r.id_autor WHERE r.id_entrega = @deliveryId ORDER BY r.fecha_creacion DESC`);
  return result.recordset;
}

export async function addFeedback(deliveryId: number, userId: number, input: { comentario?: string; tipo?: string }) {
  const context = await deliveryContext(deliveryId);
  const role = await (async () => { const p = await connectDatabase(); const r = await p.request().input('userId', userId).query('SELECT rol FROM Usuarios WHERE id_usuario = @userId'); return r.recordset[0]?.rol; })();
  await projectAccess(context.id_proyecto, userId);
  const comment = input.comentario?.trim();
  if (!comment || !input.tipo || !feedbackTypes.includes(input.tipo)) throw new HttpError(400, 'Comentario y tipo de retroalimentación son obligatorios');
  if (role !== 'PROFESOR' || context.id_tutor !== userId) throw new HttpError(403, 'Solo el profesor asignado al proyecto puede retroalimentar');
  const pool = await connectDatabase();
  const result = await pool.request().input('deliveryId', deliveryId).input('author', userId).input('comment', comment).input('type', input.tipo).query('INSERT INTO Retroalimentaciones (id_entrega, id_autor, comentario, tipo) OUTPUT INSERTED.* VALUES (@deliveryId, @author, @comment, @type)');
  await createNotification({ userId: context.id_estudiante, projectId: context.id_proyecto, deliveryId, title: 'Nueva retroalimentación', message: `Tu profesor comentó la entrega de ${context.titulo}.`, type: 'INFO' });
  await logActivity(userId, context.id_proyecto, 'RETROALIMENTACION_CREADA', `Retroalimentación en entrega ${deliveryId}`);
  return result.recordset[0];
}
