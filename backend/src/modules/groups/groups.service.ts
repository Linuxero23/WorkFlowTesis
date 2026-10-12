import { connectDatabase } from '../../config/database';
import sql from 'mssql';
import { createNotification, HttpError, logActivity } from '../shared/academic';
import { createGroupConversation, ensureDirectForUsers, syncGroupParticipant, syncGroupTutor } from '../conversations/conversations.service';

interface GroupInput { nombre?: string; id_profesor?: number; estudiantes?: number[]; activo?: boolean; }
const weekValues = `
  (1, N'Inicio y formalización', N'Inicio, formalización, asignación y planteamiento inicial.'),
  (2, N'Anteproyecto parte 1', N'Título, alcance y contexto del problema.'),
  (3, N'Anteproyecto parte 2', N'Justificación y objetivos del proyecto.'),
  (4, N'Anteproyecto parte 3', N'Bibliografía, cronograma y entregables del anteproyecto.'),
  (5, N'Marco teórico', N'Desarrollo del marco teórico y revisión de fuentes.'),
  (6, N'Requerimientos parte 1', N'Análisis de requerimientos funcionales.'),
  (7, N'Requerimientos parte 2', N'Análisis de requerimientos no funcionales.'),
  (8, N'Diseño de solución', N'Diseño de la solución, prototipos y arquitectura inicial.'),
  (9, N'Desarrollo de propuesta tecnológica', N'Construcción y actualización de la propuesta tecnológica.'),
  (10, N'Arquitectura de software', N'Definición de arquitectura, datos y comunicaciones.'),
  (11, N'Documentación de arquitectura', N'Documentación de la arquitectura propuesta.'),
  (12, N'Documentación de pruebas', N'Plan y documentación de pruebas.'),
  (13, N'Ejecución de pruebas', N'Ejecución y registro de pruebas del sistema.'),
  (14, N'Análisis de resultados', N'Análisis y documentación de resultados de pruebas.'),
  (15, N'Conclusión del proyecto', N'Conclusiones, recomendaciones y trabajo futuro.'),
  (16, N'Informe final y retrospectiva', N'Entrega del informe final y retrospectiva del proyecto.')
`;

async function ensureProjectWeeks(transaction: sql.Transaction, projectId: number) {
  await transaction.request().input('projectId', projectId).query(`
    INSERT INTO Actividades
      (id_proyecto, numero_semana, titulo, descripcion, estado, bloqueada, es_semana_base)
    SELECT @projectId, weeks.numero_semana, weeks.titulo, weeks.descripcion, 'PENDIENTE', 1, 1
    FROM (VALUES ${weekValues}) AS weeks(numero_semana, titulo, descripcion)
    WHERE NOT EXISTS (
      SELECT 1 FROM Actividades a
      WHERE a.id_proyecto = @projectId
        AND a.numero_semana = weeks.numero_semana
        AND a.es_semana_base = 1
    )
  `);
}

function idsOrThrow(ids: number[] | undefined): number[] {
  if (ids !== undefined && !Array.isArray(ids)) throw new HttpError(400, 'La lista de estudiantes debe ser un arreglo');
  const values = ids || [];
  if (values.some(id => !Number.isInteger(id) || id <= 0)) throw new HttpError(400, 'Hay identificadores de estudiantes no válidos');
  if (new Set(values).size !== values.length) throw new HttpError(400, 'No puedes repetir estudiantes en un grupo');
  return values;
}

async function validateTutorAndStudents(request: sql.Request, tutorId: number, studentIds: number[]) {
  const tutor = await request.input('tutorId', tutorId).query("SELECT COUNT(*) AS total FROM Usuarios WHERE id_usuario = @tutorId AND rol = 'PROFESOR' AND activo = 1");
  if (!tutor.recordset[0]?.total) throw new HttpError(400, 'El tutor debe ser un profesor activo');
  if (studentIds.length === 0) throw new HttpError(400, 'Asigna al menos un estudiante al grupo');
  const placeholders = studentIds.map((_, index) => `@student${index}`).join(', ');
  const studentRequest = request;
  studentIds.forEach((id, index) => studentRequest.input(`student${index}`, id));
  const students = await studentRequest.query(`SELECT COUNT(*) AS total FROM Usuarios WHERE rol = 'ESTUDIANTE' AND activo = 1 AND id_usuario IN (${placeholders})`);
  if (students.recordset[0]?.total !== studentIds.length) throw new HttpError(400, 'Todos los estudiantes deben ser estudiantes activos');
}

export async function listGroups(userId?: number) {
  const pool = await connectDatabase();
  const result = await pool.request().input('userId', userId ?? null).query(`
    SELECT g.id_grupo, g.nombre, g.id_profesor, g.activo, g.fecha_creacion,
           CONCAT(u.nombre, ' ', u.apellido) AS profesor_nombre,
           COUNT(ge.id_estudiante) AS cantidad_estudiantes
    FROM GruposTrabajo g JOIN Usuarios u ON u.id_usuario = g.id_profesor
    LEFT JOIN GrupoEstudiantes ge ON ge.id_grupo = g.id_grupo
    WHERE @userId IS NULL OR g.id_profesor = @userId
    GROUP BY g.id_grupo, g.nombre, g.id_profesor, g.activo, g.fecha_creacion, u.nombre, u.apellido
    ORDER BY g.fecha_creacion DESC
  `);
  return result.recordset;
}

export async function getGroup(groupId: number, user?: { id: number; role: string }) {
  const pool = await connectDatabase();
  const group = await pool.request().input('groupId', groupId)
    .input('userId', user?.role === 'PROFESOR' ? user.id : null).query(`
    SELECT g.id_grupo, g.nombre, g.id_profesor, g.activo, g.fecha_creacion,
           CONCAT(u.nombre, ' ', u.apellido) AS profesor_nombre
    FROM GruposTrabajo g JOIN Usuarios u ON u.id_usuario = g.id_profesor
    WHERE g.id_grupo = @groupId AND (@userId IS NULL OR g.id_profesor = @userId)
  `);
  if (!group.recordset[0]) throw new HttpError(404, 'Grupo no encontrado');
  const students = await pool.request().input('groupId', groupId).query(`
    SELECT u.id_usuario, u.nombre, u.apellido, u.correo, ge.fecha_asignacion
    FROM GrupoEstudiantes ge JOIN Usuarios u ON u.id_usuario = ge.id_estudiante
    WHERE ge.id_grupo = @groupId ORDER BY u.apellido, u.nombre
  `);
  return { ...group.recordset[0], estudiantes: students.recordset };
}

export async function createGroup(input: GroupInput) {
  const name = typeof input.nombre === 'string' ? input.nombre.trim() : '';
  const tutorId = Number(input.id_profesor);
  const studentIds = idsOrThrow(input.estudiantes);
  if (!name || !Number.isInteger(tutorId) || tutorId <= 0) throw new HttpError(400, 'Nombre y profesor son obligatorios');
  if (studentIds.length === 0) throw new HttpError(400, 'Asigna al menos un estudiante al grupo');
  const pool = await connectDatabase();
  const transaction = pool.transaction();
  let groupId = 0;
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const validationRequest = transaction.request();
    await validateTutorAndStudents(validationRequest, tutorId, studentIds);
    if (studentIds.length) {
      const placeholders = studentIds.map((_, index) => `@student${index}`).join(', ');
      const duplicateRequest = transaction.request();
      studentIds.forEach((id, index) => duplicateRequest.input(`student${index}`, id));
      const duplicate = await duplicateRequest.query(`
        SELECT TOP 1 ge.id_estudiante FROM GrupoEstudiantes ge JOIN GruposTrabajo g ON g.id_grupo = ge.id_grupo
        WHERE g.activo = 1 AND ge.id_estudiante IN (${placeholders})
      `);
      if (duplicate.recordset[0]) throw new HttpError(409, 'Uno de los estudiantes ya pertenece a un grupo activo');
    }
    const created = await transaction.request().input('name', name).input('tutorId', tutorId).query(`
      INSERT INTO GruposTrabajo (nombre, id_profesor, activo) OUTPUT INSERTED.id_grupo VALUES (@name, @tutorId, 0)
    `);
    groupId = created.recordset[0].id_grupo as number;
    for (const studentId of studentIds) {
      await transaction.request().input('groupId', groupId).input('studentId', studentId).query(`
        INSERT INTO GrupoEstudiantes (id_grupo, id_estudiante) VALUES (@groupId, @studentId)
      `);
    }
    const candidateRequest = transaction.request().input('tutorId', tutorId);
    studentIds.forEach((id, index) => candidateRequest.input(`projectStudent${index}`, id));
    const candidates = await candidateRequest.query(`
      SELECT DISTINCT p.id_proyecto
      FROM Proyectos p
      WHERE p.id_tutor = @tutorId
        AND p.id_estudiante IN (${studentIds.map((_, index) => `@projectStudent${index}`).join(', ')})
        AND NOT EXISTS (SELECT 1 FROM GruposTrabajo g WHERE g.id_proyecto = p.id_proyecto)
    `);
    if (candidates.recordset.length > 1) {
      throw new HttpError(409, 'Hay varios proyectos compatibles con este grupo; resuelve la asignación antes de continuar');
    }
    let projectId: number;
    if (candidates.recordset.length === 1) {
      projectId = candidates.recordset[0].id_proyecto as number;
    } else {
      const project = await transaction.request().input('title', `Trabajo de grado - ${name}`)
        .input('description', `Proyecto académico compartido del grupo ${name}`)
        .input('studentId', studentIds[0]).input('tutorId', tutorId).query(`
          INSERT INTO Proyectos (titulo, descripcion, id_estudiante, id_tutor, estado, fecha_inicio)
          OUTPUT INSERTED.id_proyecto
          VALUES (@title, @description, @studentId, @tutorId, 'ACTIVO', CAST(GETDATE() AS DATE))
        `);
      projectId = project.recordset[0].id_proyecto as number;
    }
    await ensureProjectWeeks(transaction, projectId);
    await createGroupConversation(transaction, groupId, name, [tutorId, ...studentIds]);
    await transaction.request().input('groupId', groupId).input('projectId', projectId).query(`
      UPDATE GruposTrabajo SET id_proyecto = @projectId, activo = 1 WHERE id_grupo = @groupId
    `);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  for (const studentId of studentIds) await createNotification({ userId: studentId, title: 'Asignación de grupo', message: `Has sido asignado al grupo ${name}.`, type: 'INFO' });
  await createNotification({ userId: tutorId, title: 'Asignación como tutor', message: `Has sido asignado como tutor del grupo ${name}.`, type: 'INFO' });
  await logActivity(tutorId, null, 'GRUPO_CREADO', `Se creó el grupo ${name}`);
  return getGroup(groupId);
}

export async function updateGroup(groupId: number, input: Pick<GroupInput, 'nombre'>) {
  const pool = await connectDatabase();
  const name = typeof input.nombre === 'string' ? input.nombre.trim() || null : null;
  const result = await pool.request().input('groupId', groupId).input('name', name).query(`
    UPDATE GruposTrabajo SET nombre = COALESCE(@name, nombre)
    OUTPUT INSERTED.id_grupo WHERE id_grupo = @groupId
  `);
  if (!result.recordset[0]) throw new HttpError(404, 'Grupo no encontrado');
  return getGroup(groupId);
}

export async function addStudent(groupId: number, studentId: number) {
  const pool = await connectDatabase();
  const transaction = pool.transaction();
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const group = await transaction.request().input('groupId', groupId).query('SELECT activo FROM GruposTrabajo WITH (UPDLOCK, HOLDLOCK) WHERE id_grupo = @groupId');
    if (!group.recordset[0]) throw new HttpError(404, 'Grupo no encontrado');
    if (!group.recordset[0].activo) throw new HttpError(409, 'No se puede modificar un grupo inactivo');
    const student = await transaction.request().input('studentId', studentId).query("SELECT id_usuario FROM Usuarios WHERE id_usuario = @studentId AND rol = 'ESTUDIANTE' AND activo = 1");
    if (!student.recordset[0]) throw new HttpError(400, 'El usuario no es un estudiante activo');
    const existing = await transaction.request().input('studentId', studentId).query(`
      SELECT TOP 1 ge.id_grupo FROM GrupoEstudiantes ge WITH (UPDLOCK, HOLDLOCK)
      JOIN GruposTrabajo g ON g.id_grupo = ge.id_grupo
      WHERE ge.id_estudiante = @studentId AND g.activo = 1
    `);
    if (existing.recordset[0]) throw new HttpError(409, 'El estudiante ya pertenece a un grupo activo');
    await transaction.request().input('groupId', groupId).input('studentId', studentId)
      .query('INSERT INTO GrupoEstudiantes (id_grupo, id_estudiante) VALUES (@groupId, @studentId)');
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  await syncGroupParticipant(groupId, studentId, true);
  const tutor = await pool.request().input('groupId', groupId).query('SELECT id_profesor FROM GruposTrabajo WHERE id_grupo = @groupId');
  await ensureDirectForUsers(tutor.recordset[0].id_profesor, studentId);
  await createNotification({ userId: studentId, projectId: undefined, title: 'Asignación de grupo', message: 'Has sido agregado a un grupo de trabajo.', type: 'INFO' });
  await logActivity(studentId, null, 'ESTUDIANTE_AGREGADO_GRUPO', `Estudiante agregado al grupo ${groupId}`);
  return getGroup(groupId);
}

export async function removeStudent(groupId: number, studentId: number) {
  const pool = await connectDatabase();
  const transaction = pool.transaction();
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  let groupName: string;
  try {
    const group = await transaction.request().input('groupId', groupId)
      .query('SELECT nombre, activo FROM GruposTrabajo WITH (UPDLOCK, HOLDLOCK) WHERE id_grupo = @groupId');
    if (!group.recordset[0]) throw new HttpError(404, 'Grupo no encontrado');
    groupName = group.recordset[0].nombre;
    const members = await transaction.request().input('groupId', groupId)
      .query('SELECT COUNT(*) AS total FROM GrupoEstudiantes WITH (UPDLOCK, HOLDLOCK) WHERE id_grupo = @groupId');
    if (group.recordset[0].activo && members.recordset[0].total <= 1) {
      throw new HttpError(409, 'Desactiva el grupo antes de retirar a su último estudiante');
    }
    const removed = await transaction.request().input('groupId', groupId).input('studentId', studentId)
      .query('DELETE FROM GrupoEstudiantes OUTPUT DELETED.id_estudiante WHERE id_grupo = @groupId AND id_estudiante = @studentId');
    if (!removed.recordset[0]) throw new HttpError(404, 'El estudiante no pertenece al grupo');
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  await syncGroupParticipant(groupId, studentId, false);
  await createNotification({ userId: studentId, title: 'Actualización de grupo', message: `Has sido retirado del grupo ${groupName}.`, type: 'WARNING' });
  await logActivity(studentId, null, 'ESTUDIANTE_RETIRADO_GRUPO', `Estudiante retirado del grupo ${groupId}`);
  return getGroup(groupId);
}

export async function changeTutor(groupId: number, tutorId: number) {
  const pool = await connectDatabase();
  const tutor = await pool.request().input('tutorId', tutorId).query("SELECT id_usuario FROM Usuarios WHERE id_usuario = @tutorId AND rol = 'PROFESOR' AND activo = 1");
  if (!tutor.recordset[0]) throw new HttpError(400, 'El tutor debe ser un profesor activo');
  const group = await pool.request().input('groupId', groupId).query('  SELECT id_profesor, nombre, activo, id_proyecto FROM GruposTrabajo WHERE id_grupo = @groupId');
  if (!group.recordset[0]) throw new HttpError(404, 'Grupo no encontrado');
  if (!group.recordset[0].activo) throw new HttpError(409, 'No se puede cambiar el tutor de un grupo inactivo');
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    await transaction.request().input('groupId', groupId).input('tutorId', tutorId)
      .query('UPDATE GruposTrabajo SET id_profesor = @tutorId WHERE id_grupo = @groupId');
    await transaction.request().input('projectId', group.recordset[0].id_proyecto).input('tutorId', tutorId)
      .query('UPDATE Proyectos SET id_tutor = @tutorId WHERE id_proyecto = @projectId');
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  await syncGroupTutor(groupId, group.recordset[0].id_profesor, tutorId);
  const students = await pool.request().input('groupId', groupId).query('SELECT id_estudiante FROM GrupoEstudiantes WHERE id_grupo = @groupId');
  for (const student of students.recordset) await ensureDirectForUsers(tutorId, student.id_estudiante);
  await createNotification({ userId: tutorId, title: 'Asignación como tutor', message: `Has sido asignado como tutor del grupo ${group.recordset[0].nombre}.`, type: 'INFO' });
  await logActivity(tutorId, null, 'TUTOR_CAMBIADO', `Tutor actualizado en el grupo ${groupId}`);
  return getGroup(groupId);
}

export async function setGroupActive(groupId: number, active: boolean, actorId: number) {
  const pool = await connectDatabase();
  const transaction = pool.transaction();
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const group = await transaction.request().input('groupId', groupId).query(`
      SELECT id_grupo FROM GruposTrabajo WITH (UPDLOCK, HOLDLOCK)
      WHERE id_grupo = @groupId
    `);
    if (!group.recordset[0]) throw new HttpError(404, 'Grupo no encontrado');
    if (active) {
      const validity = await transaction.request().input('groupId', groupId).query(`
        SELECT CASE WHEN EXISTS (SELECT 1 FROM GrupoEstudiantes WHERE id_grupo = @groupId)
                         AND EXISTS (SELECT 1 FROM GruposTrabajo WHERE id_grupo = @groupId AND id_proyecto IS NOT NULL)
                    THEN 1 ELSE 0 END AS valido
      `);
      if (!validity.recordset[0]?.valido) throw new HttpError(409, 'Un grupo activo requiere estudiantes y un proyecto asociado');
    }
    await transaction.request().input('groupId', groupId).input('active', active)
      .query('UPDATE GruposTrabajo SET activo = @active WHERE id_grupo = @groupId');
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  await pool.request().input('groupId', groupId).input('active', active).query('UPDATE Conversaciones SET activo = @active WHERE id_grupo = @groupId');
  const members = await pool.request().input('groupId', groupId).query('SELECT id_profesor AS id_usuario FROM GruposTrabajo WHERE id_grupo = @groupId UNION SELECT id_estudiante FROM GrupoEstudiantes WHERE id_grupo = @groupId');
  for (const member of members.recordset) await syncGroupParticipant(groupId, member.id_usuario, active);
  for (const member of members.recordset) await createNotification({ userId: member.id_usuario, title: active ? 'Grupo reactivado' : 'Grupo desactivado', message: active ? 'Tu grupo de trabajo volvió a estar disponible.' : 'Tu grupo de trabajo fue desactivado por coordinación.', type: active ? 'INFO' : 'WARNING' });
  await logActivity(actorId, null, active ? 'GRUPO_REACTIVADO' : 'GRUPO_DESACTIVADO', `Grupo ${groupId} ${active ? 'reactivado' : 'desactivado'}`);
  return getGroup(groupId);
}

export async function academicAccess(userId: number) {
  const pool = await connectDatabase();
  const user = await pool.request().input('userId', userId).query(`
    SELECT TOP 1 rol FROM Usuarios WHERE id_usuario = @userId AND activo = 1
  `);
  if (!user.recordset[0]) throw new HttpError(404, 'Usuario no encontrado');
  const role = user.recordset[0].rol as string;
  const group = role === 'ESTUDIANTE'
    ? await pool.request().input('userId', userId).query(`SELECT TOP 1 g.id_grupo, g.nombre, g.id_profesor, CONCAT(u.nombre, ' ', u.apellido) AS tutor_nombre FROM GrupoEstudiantes ge JOIN GruposTrabajo g ON g.id_grupo = ge.id_grupo JOIN Usuarios u ON u.id_usuario = g.id_profesor WHERE ge.id_estudiante = @userId AND g.activo = 1`)
    : await pool.request().input('userId', userId).query(`SELECT TOP 1 g.id_grupo, g.nombre, g.id_profesor, CONCAT(u.nombre, ' ', u.apellido) AS tutor_nombre FROM GruposTrabajo g JOIN Usuarios u ON u.id_usuario = g.id_profesor WHERE g.id_profesor = @userId AND g.activo = 1`);
  return { hasActiveGroup: group.recordset.length > 0, role, group: group.recordset[0] || null };
}
