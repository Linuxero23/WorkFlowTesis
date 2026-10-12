import sql from 'mssql';
import { connectDatabase } from '../../config/database';
import { createNotification, HttpError, logActivity, projectAccess } from '../shared/academic';

export async function listDeliveries(activityId: number, userId: number, role: string) {
  const pool = await connectDatabase();
  const activity = await pool.request().input('activityId', activityId).query('SELECT id_proyecto FROM Actividades WHERE id_actividad = @activityId');
  if (!activity.recordset[0]) throw new HttpError(404, 'Actividad no encontrada');
  await projectAccess(activity.recordset[0].id_proyecto, userId);
  const result = await pool.request().input('activityId', activityId).input('userId', userId).input('role', role).query(`
    SELECT e.*, CONCAT(u.nombre, ' ', u.apellido) AS estudiante_nombre,
           feedback.comentario AS retroalimentacion,
           feedback.tipo AS tipo_retroalimentacion,
           feedback.fecha_creacion AS fecha_retroalimentacion
    FROM Entregas e
    JOIN Usuarios u ON u.id_usuario = e.id_estudiante
    OUTER APPLY (
      SELECT TOP 1 r.comentario, r.tipo, r.fecha_creacion
      FROM Retroalimentaciones r
      WHERE r.id_entrega = e.id_entrega
      ORDER BY r.fecha_creacion DESC, r.id_retroalimentacion DESC
    ) feedback
    WHERE e.id_actividad = @activityId
      AND (@role <> 'ESTUDIANTE' OR e.id_estudiante = @userId)
    ORDER BY e.fecha_entrega DESC, e.id_entrega DESC
  `);
  return result.recordset;
}

export async function createDelivery(
  activityId: number,
  userId: number,
  input: { comentario?: string; url?: string; file?: { originalname: string; filename: string } }
) {
  if (input.comentario !== undefined && typeof input.comentario !== 'string') throw new HttpError(400, 'El comentario de la entrega no es válido');
  if (input.url !== undefined && typeof input.url !== 'string') throw new HttpError(400, 'El enlace de la entrega no es válido');
  const comment = input.comentario?.trim() || null;
  const url = input.url?.trim() || null;
  if (!comment && !url && !input.file) throw new HttpError(400, 'La entrega debe incluir comentario, enlace o archivo');
  if (comment && comment.length > 4000) throw new HttpError(400, 'El comentario no puede exceder 4000 caracteres');
  if (url) {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol) || url.length > 2048) throw new Error('invalid URL');
    } catch {
      throw new HttpError(400, 'El enlace debe ser una URL HTTP o HTTPS válida');
    }
  }
  if (input.file && (input.file.originalname.length > 255 || `/uploads/${input.file.filename}`.length > 500)) {
    throw new HttpError(400, 'El nombre del archivo es demasiado largo');
  }

  const pool = await connectDatabase();
  const transaction = pool.transaction();
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  let delivery: Record<string, unknown>;
  let context: { id_proyecto: number; id_tutor: number; titulo: string; id_grupo: number | null };
  try {
    const result = await transaction.request().input('activityId', activityId).query(`
      SELECT a.id_proyecto, a.titulo, a.bloqueada, a.estado, p.id_tutor, g.id_grupo, p.id_estudiante
      FROM Actividades a WITH (UPDLOCK, HOLDLOCK)
      JOIN Proyectos p ON p.id_proyecto = a.id_proyecto
      LEFT JOIN GruposTrabajo g ON g.id_proyecto = p.id_proyecto
      WHERE a.id_actividad = @activityId
    `);
    const activity = result.recordset[0];
    if (!activity) throw new HttpError(404, 'Actividad no encontrada');
    await projectAccess(activity.id_proyecto, userId);
    if (activity.bloqueada) throw new HttpError(409, 'La actividad está bloqueada');
    if (activity.id_grupo === null) {
      if (activity.id_estudiante !== userId) throw new HttpError(403, 'No perteneces al proyecto de esta actividad');
    } else {
      const membership = await transaction.request().input('groupId', activity.id_grupo).input('userId', userId).query(`
        SELECT 1 AS miembro FROM GrupoEstudiantes ge
        JOIN GruposTrabajo g ON g.id_grupo = ge.id_grupo
        WHERE ge.id_grupo = @groupId AND ge.id_estudiante = @userId AND g.activo = 1
      `);
      if (!membership.recordset[0]) throw new HttpError(403, 'No perteneces al grupo de este proyecto');
    }
    const previous = await transaction.request().input('activityId', activityId).input('studentId', userId).query(`
      SELECT TOP 1 estado_revision,
        CAST(CASE WHEN EXISTS (
          SELECT 1 FROM Entregas approved
          WHERE approved.id_actividad = @activityId
            AND approved.id_estudiante = @studentId
            AND approved.estado_revision = 'APROBADA'
        ) THEN 1 ELSE 0 END AS bit) AS ya_aprobada
      FROM Entregas
      WHERE id_actividad = @activityId AND id_estudiante = @studentId
      ORDER BY fecha_entrega DESC, id_entrega DESC
    `);
    if (previous.recordset[0]?.ya_aprobada) {
      throw new HttpError(409, 'Esta semana ya fue aprobada y no admite nuevas entregas');
    }
    if (previous.recordset[0] && !['REQUIERE_CORRECCION', 'RECHAZADA'].includes(previous.recordset[0].estado_revision)) {
      throw new HttpError(409, 'Tu entrega ya fue enviada y está pendiente o finalizada; espera la revisión del profesor');
    }
    const inserted = await transaction.request()
      .input('activityId', activityId).input('studentId', userId)
      .input('fileName', input.file?.originalname || null)
      .input('filePath', input.file ? `/uploads/${input.file.filename}` : null)
      .input('url', url).input('comment', comment)
      .query(`
        INSERT INTO Entregas
          (id_actividad, id_estudiante, nombre_archivo, ruta_archivo, url_externa, comentario_estudiante, estado_revision)
        OUTPUT INSERTED.*
        VALUES (@activityId, @studentId, @fileName, @filePath, @url, @comment, 'ENVIADA')
      `);
    delivery = inserted.recordset[0] as Record<string, unknown>;
    context = { id_proyecto: activity.id_proyecto, id_tutor: activity.id_tutor, titulo: activity.titulo, id_grupo: activity.id_grupo };
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  await createNotification({
    userId: context.id_tutor, projectId: context.id_proyecto, activityId,
    deliveryId: Number(delivery.id_entrega), title: 'Nueva entrega recibida',
    message: `El estudiante entregó: ${context.titulo}`, type: 'INFO'
  });
  await logActivity(userId, context.id_proyecto, 'ENTREGA_ENVIADA', `Entrega enviada para ${context.titulo}`);
  return delivery;
}

export async function reviewDelivery(
  deliveryId: number,
  userId: number,
  input: { estado_revision?: string; calificacion?: number; retroalimentacion?: string; tipo_retroalimentacion?: string }
) {
  const validStates = ['ENVIADA', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'REQUIERE_CORRECCION'];
  if (!input.estado_revision || !validStates.includes(input.estado_revision)) throw new HttpError(400, 'Estado de revisión no válido');
  const grade = input.calificacion === undefined || input.calificacion === null ? null : Number(input.calificacion);
  if (grade !== null && (!Number.isFinite(grade) || grade < 0 || grade > 5)) throw new HttpError(400, 'La calificación debe estar entre 0 y 5');
  if (input.retroalimentacion !== undefined && typeof input.retroalimentacion !== 'string') throw new HttpError(400, 'La retroalimentación no es válida');
  if (input.tipo_retroalimentacion !== undefined && typeof input.tipo_retroalimentacion !== 'string') throw new HttpError(400, 'El tipo de retroalimentación no es válido');
  const feedback = input.retroalimentacion?.trim() || null;
  const feedbackType = input.tipo_retroalimentacion ||
    (input.estado_revision === 'APROBADA' ? 'APROBACION' :
      input.estado_revision === 'RECHAZADA' ? 'RECHAZO' :
        input.estado_revision === 'REQUIERE_CORRECCION' ? 'CORRECCION' : 'OBSERVACION');
  const validFeedbackTypes = ['OBSERVACION', 'CORRECCION', 'APROBACION', 'RECHAZO'];
  if (feedback && feedback.length > 4000) throw new HttpError(400, 'La retroalimentación no puede exceder 4000 caracteres');
  if (feedback && !validFeedbackTypes.includes(feedbackType)) throw new HttpError(400, 'Tipo de retroalimentación no válido');

  const pool = await connectDatabase();
  const transaction = pool.transaction();
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  let delivery: Record<string, unknown>;
  let context: { id_estudiante: number; id_proyecto: number; id_actividad: number; titulo: string };
  try {
    const found = await transaction.request().input('deliveryId', deliveryId).query(`
      SELECT e.id_entrega, e.id_estudiante, a.id_proyecto, a.id_actividad, a.titulo
      FROM Entregas e WITH (UPDLOCK, HOLDLOCK)
      JOIN Actividades a ON a.id_actividad = e.id_actividad
      WHERE e.id_entrega = @deliveryId
    `);
    const current = found.recordset[0];
    if (!current) throw new HttpError(404, 'Entrega no encontrada');
    await projectAccess(current.id_proyecto, userId);
    const updated = await transaction.request()
      .input('deliveryId', deliveryId).input('status', input.estado_revision)
      .input('grade', grade).input('reviewer', userId)
      .query(`
        UPDATE Entregas
        SET estado_revision = @status, calificacion = @grade,
            fecha_revision = SYSUTCDATETIME(), revisado_por = @reviewer
        OUTPUT INSERTED.*
        WHERE id_entrega = @deliveryId
      `);
    delivery = updated.recordset[0] as Record<string, unknown>;
    if (feedback) {
      await transaction.request().input('deliveryId', deliveryId).input('author', userId)
        .input('comment', feedback).input('type', feedbackType).query(`
          INSERT INTO Retroalimentaciones (id_entrega, id_autor, comentario, tipo)
          VALUES (@deliveryId, @author, @comment, @type)
        `);
    }
    if (['REQUIERE_CORRECCION', 'RECHAZADA'].includes(input.estado_revision)) {
      await transaction.request().input('activityId', current.id_actividad).query(`
        UPDATE Actividades SET bloqueada = 0 WHERE id_actividad = @activityId
      `);
    }
    context = {
      id_estudiante: current.id_estudiante, id_proyecto: current.id_proyecto,
      id_actividad: current.id_actividad, titulo: current.titulo
    };
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const message = input.estado_revision === 'APROBADA' ? 'Tu entrega fue aprobada.' :
    input.estado_revision === 'REQUIERE_CORRECCION' ? 'Tu profesor solicitó correcciones.' : 'Tu entrega fue revisada.';
  const warnings: string[] = [];
  try {
    await createNotification({
      userId: context.id_estudiante, projectId: context.id_proyecto, activityId: context.id_actividad,
      deliveryId, title: 'Entrega revisada',
      message: grade === null ? message : `${message} Calificación: ${grade}.`,
      type: 'INFO'
    });
  } catch (error) {
    console.error('La revisión se guardó, pero no se pudo generar la notificación:', error);
    warnings.push('La revisión se guardó, pero no se pudo generar la notificación al estudiante.');
  }
  try {
    await logActivity(userId, context.id_proyecto, 'ENTREGA_REVISADA', `Entrega ${deliveryId}: ${input.estado_revision}`);
  } catch (error) {
    console.error('La revisión se guardó, pero no se pudo registrar en el historial:', error);
    warnings.push('La revisión se guardó, pero no se pudo registrar en el historial.');
  }
  return { delivery, warnings };
}
