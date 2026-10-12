import { connectDatabase } from '../../config/database';
import { createNotification, HttpError, logActivity, projectAccess } from '../shared/academic';

interface ActivityInput {
  titulo?: unknown;
  descripcion?: unknown;
  numero_semana?: unknown;
  fecha_inicio?: unknown;
  fecha_limite?: unknown;
  bloqueada?: unknown;
  estado?: unknown;
}

function activityValues(input: ActivityInput) {
  const title = typeof input.titulo === 'string' ? input.titulo.trim() : '';
  const description = typeof input.descripcion === 'string' ? input.descripcion.trim() : null;
  const startDate = input.fecha_inicio === '' || input.fecha_inicio === null ? null : input.fecha_inicio;
  const dueDate = input.fecha_limite === '' || input.fecha_limite === null ? null : input.fecha_limite;
  const validDate = (value: unknown) => {
    if (value === undefined || value === null) return true;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  if (!title || title.length > 200) throw new HttpError(400, 'El título es obligatorio y no puede exceder 200 caracteres');
  if (description && description.length > 4000) throw new HttpError(400, 'La descripción no puede exceder 4000 caracteres');
  if (input.bloqueada !== undefined && typeof input.bloqueada !== 'boolean') throw new HttpError(400, 'El bloqueo debe ser verdadero o falso');
  if (!validDate(startDate) || !validDate(dueDate)) throw new HttpError(400, 'Las fechas deben tener formato YYYY-MM-DD');
  if (startDate && dueDate && String(dueDate) < String(startDate)) throw new HttpError(400, 'La fecha límite no puede ser anterior a la fecha de inicio');
  return { title, description, startDate: startDate ?? null, dueDate: dueDate ?? null };
}

export async function listActivities(projectId: number, userId: number) {
  await projectAccess(projectId, userId);
  const pool = await connectDatabase();
  const result = await pool.request().input('projectId', projectId).query(`
    SELECT id_actividad, id_proyecto, numero_semana, titulo, descripcion,
           fecha_inicio, fecha_limite, estado, fecha_completada, fecha_creacion, bloqueada, es_semana_base
    FROM Actividades
    WHERE id_proyecto = @projectId
    ORDER BY numero_semana, es_semana_base DESC, id_actividad
  `);
  return result.recordset;
}

export async function createActivity(projectId: number, userId: number, input: ActivityInput) {
  const access = await projectAccess(projectId, userId);
  const week = Number(input.numero_semana);
  if (!Number.isInteger(week) || week < 1 || week > 16) throw new HttpError(400, 'La semana debe ser un número entre 1 y 16');
  const { title, description, startDate, dueDate } = activityValues(input);
  const pool = await connectDatabase();
  const result = await pool.request()
    .input('projectId', projectId).input('week', week).input('title', title)
    .input('description', description).input('startDate', startDate).input('dueDate', dueDate)
    .input('blocked', input.bloqueada === undefined ? null : Boolean(input.bloqueada))
    .query(`
      UPDATE Actividades
      SET titulo = @title, descripcion = @description, fecha_inicio = @startDate,
          fecha_limite = @dueDate, bloqueada = COALESCE(@blocked, bloqueada)
      OUTPUT INSERTED.*
      WHERE id_proyecto = @projectId AND numero_semana = @week AND es_semana_base = 1;
    `);
  const activity = result.recordset[0];
  if (!activity) throw new HttpError(404, 'No existe una actividad base para esa semana; ejecuta la migración 004');
  const recipients = access.id_grupo === null
    ? [access.id_estudiante]
    : (await pool.request().input('groupId', access.id_grupo).query('SELECT id_estudiante FROM GrupoEstudiantes WHERE id_grupo = @groupId')).recordset.map(row => row.id_estudiante as number);
  for (const recipient of recipients) {
    await createNotification({ userId: recipient, projectId, activityId: activity.id_actividad, title: 'Actividad actualizada', message: `Tu profesor actualizó: ${title}`, type: 'INFO' });
  }
  await logActivity(userId, projectId, 'ACTIVIDAD_ACTUALIZADA', `Se actualizó la actividad ${title}`);
  return activity;
}

export async function updateActivity(activityId: number, userId: number, input: ActivityInput) {
  const pool = await connectDatabase();
  const found = await pool.request().input('activityId', activityId).query(`
    SELECT id_proyecto, titulo, descripcion, fecha_inicio, fecha_limite, bloqueada, estado
    FROM Actividades WHERE id_actividad = @activityId
  `);
  if (!found.recordset[0]) throw new HttpError(404, 'Actividad no encontrada');
  const existing = found.recordset[0] as {
    id_proyecto: number;
    titulo: string;
    descripcion: string | null;
    fecha_inicio: Date | null;
    fecha_limite: Date | null;
    bloqueada: boolean;
    estado: ActivityInput['estado'];
  };
  const access = await projectAccess(existing.id_proyecto, userId);
  const dateInput = (value: Date | null) => value ? value.toISOString().slice(0, 10) : null;
  const { title, description, startDate, dueDate } = activityValues({
    titulo: input.titulo === undefined ? existing.titulo : input.titulo,
    descripcion: input.descripcion === undefined ? existing.descripcion : input.descripcion,
    fecha_inicio: input.fecha_inicio === undefined ? dateInput(existing.fecha_inicio) : input.fecha_inicio,
    fecha_limite: input.fecha_limite === undefined ? dateInput(existing.fecha_limite) : input.fecha_limite,
    bloqueada: input.bloqueada === undefined ? existing.bloqueada : input.bloqueada,
  });
  const validStates = ['PENDIENTE', 'EN_PROGRESO', 'EN_REVISION', 'COMPLETADA', 'ATRASADA'];
  const state = input.estado === undefined ? existing.estado : input.estado;
  if (typeof state !== 'string' || !validStates.includes(state)) {
    throw new HttpError(400, 'Estado académico no válido');
  }
  const blocked = Boolean(input.bloqueada === undefined ? existing.bloqueada : input.bloqueada);
  const updated = await pool.request().input('activityId', activityId).input('title', title)
    .input('description', description).input('startDate', startDate).input('dueDate', dueDate)
    .input('blocked', blocked).input('state', state)
    .query(`
      UPDATE Actividades
      SET titulo = @title, descripcion = @description, fecha_inicio = @startDate,
          fecha_limite = @dueDate, bloqueada = @blocked, estado = @state,
          fecha_completada = CASE WHEN @state = 'COMPLETADA' THEN COALESCE(fecha_completada, SYSUTCDATETIME()) ELSE NULL END
      OUTPUT INSERTED.*
      WHERE id_actividad = @activityId
    `);
  const activity = updated.recordset[0];
  if (!activity) throw new HttpError(404, 'Actividad no encontrada');
  const warnings: string[] = [];
  try {
    const recipients = access.id_grupo === null
      ? [access.id_estudiante]
      : (await pool.request().input('groupId', access.id_grupo)
        .query('SELECT id_estudiante FROM GrupoEstudiantes WHERE id_grupo = @groupId')).recordset.map(row => row.id_estudiante as number);
    for (const recipient of recipients) {
      await createNotification({ userId: recipient, projectId: activity.id_proyecto, activityId, title: 'Actividad actualizada', message: `Tu profesor actualizó: ${title}`, type: 'INFO' });
    }
  } catch (error) {
    console.error('La actividad se guardó, pero no se pudieron generar todas las notificaciones:', error);
    warnings.push('La actividad se guardó, pero no se pudieron generar todas las notificaciones.');
  }
  try {
    await logActivity(userId, activity.id_proyecto, 'ACTIVIDAD_ACTUALIZADA', `Se actualizó la actividad ${title}`);
  } catch (error) {
    console.error('La actividad se guardó, pero no se pudo registrar en el historial:', error);
    warnings.push('La actividad se guardó, pero no se pudo registrar en el historial.');
  }
  return { activity, warnings };
}

export async function setActivityLock(activityId: number, userId: number, blocked: boolean) {
  const pool = await connectDatabase();
  const result = await pool.request().input('activityId', activityId).query(`
    SELECT a.id_proyecto, a.titulo
    FROM Actividades a WHERE a.id_actividad = @activityId
  `);
  const activity = result.recordset[0];
  if (!activity) throw new HttpError(404, 'Actividad no encontrada');
  const access = await projectAccess(activity.id_proyecto, userId);
  const updated = await pool.request().input('activityId', activityId).input('blocked', blocked)
    .query(`
      UPDATE Actividades
      SET bloqueada = @blocked
      OUTPUT INSERTED.id_actividad, INSERTED.bloqueada, INSERTED.estado
      WHERE id_actividad = @activityId
    `);
  if (!updated.recordset[0]) throw new HttpError(404, 'Actividad no encontrada');
  const savedBlocked = Boolean(updated.recordset[0].bloqueada);
  const warnings: string[] = [];
  if (!savedBlocked) {
    try {
      const recipients = access.id_grupo === null
        ? [access.id_estudiante]
        : (await pool.request().input('groupId', access.id_grupo).query('SELECT id_estudiante FROM GrupoEstudiantes WHERE id_grupo = @groupId')).recordset.map(row => row.id_estudiante as number);
      for (const recipient of recipients) {
        await createNotification({ userId: recipient, projectId: activity.id_proyecto, activityId, title: 'Actividad habilitada', message: `Tu profesor habilitó: ${activity.titulo}`, type: 'INFO' });
      }
    } catch (error) {
      console.error('El bloqueo se actualizó, pero no se pudieron generar todas las notificaciones:', error);
      warnings.push('El bloqueo se actualizó, pero no se pudieron generar todas las notificaciones.');
    }
  }
  try {
    await logActivity(userId, activity.id_proyecto, savedBlocked ? 'ACTIVIDAD_BLOQUEADA' : 'ACTIVIDAD_DESBLOQUEADA', activity.titulo);
  } catch (error) {
    console.error('El bloqueo se actualizó, pero no se pudo registrar en el historial:', error);
    warnings.push('El bloqueo se actualizó, pero no se pudo registrar en el historial.');
  }
  return { id_actividad: activityId, bloqueada: savedBlocked, warnings };
}
