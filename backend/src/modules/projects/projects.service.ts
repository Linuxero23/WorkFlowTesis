import { connectDatabase } from '../../config/database';
import { HttpError, projectAccess } from '../shared/academic';

const projectSelect = (progressStudentId: string) => `
  SELECT p.id_proyecto, g.id_grupo, p.titulo, p.descripcion, p.id_estudiante, p.id_tutor,
         p.estado, p.fecha_inicio, p.fecha_fin_estimada,
         CONCAT(s.nombre, ' ', s.apellido) AS estudiante_nombre,
         CONCAT(t.nombre, ' ', t.apellido) AS tutor_nombre,
         (SELECT COUNT(*) FROM Actividades activity
          WHERE activity.id_proyecto = p.id_proyecto AND activity.es_semana_base = 1) AS total_actividades,
         (SELECT COUNT(DISTINCT delivery.id_actividad)
          FROM Entregas delivery
          JOIN Actividades activity ON activity.id_actividad = delivery.id_actividad
          WHERE activity.id_proyecto = p.id_proyecto AND activity.es_semana_base = 1
            AND delivery.id_estudiante = ${progressStudentId}
            AND delivery.estado_revision = 'APROBADA') AS actividades_completadas,
         CASE WHEN (SELECT COUNT(*) FROM Actividades activity
                    WHERE activity.id_proyecto = p.id_proyecto AND activity.es_semana_base = 1) = 0 THEN 0
              ELSE ROUND(100.0 * (SELECT COUNT(DISTINCT delivery.id_actividad)
                FROM Entregas delivery
                JOIN Actividades activity ON activity.id_actividad = delivery.id_actividad
                WHERE activity.id_proyecto = p.id_proyecto AND activity.es_semana_base = 1
                  AND delivery.id_estudiante = ${progressStudentId}
                  AND delivery.estado_revision = 'APROBADA') /
                NULLIF((SELECT COUNT(*) FROM Actividades activity
                  WHERE activity.id_proyecto = p.id_proyecto AND activity.es_semana_base = 1), 0), 0)
         END AS progreso
  FROM Proyectos p
  JOIN Usuarios s ON s.id_usuario = p.id_estudiante
  JOIN Usuarios t ON t.id_usuario = p.id_tutor
  LEFT JOIN GruposTrabajo g ON g.id_proyecto = p.id_proyecto
`;

const projectGroupBy = `
  GROUP BY p.id_proyecto, g.id_grupo, p.titulo, p.descripcion, p.id_estudiante, p.id_tutor,
           p.estado, p.fecha_inicio, p.fecha_fin_estimada,
           s.nombre, s.apellido, t.nombre, t.apellido
`;

export async function getStudentProject(userId: number) {
  const pool = await connectDatabase();
  const result = await pool.request().input('userId', userId).query(`
    ${projectSelect('@userId')}
    WHERE EXISTS (
      SELECT 1 FROM GruposTrabajo assignedGroup
      JOIN GrupoEstudiantes ge ON ge.id_grupo = assignedGroup.id_grupo
      WHERE assignedGroup.id_proyecto = p.id_proyecto
        AND ge.id_estudiante = @userId AND assignedGroup.activo = 1
    )
    ${projectGroupBy}
  `);
  if (result.recordset.length > 1) throw new HttpError(409, 'Tu cuenta tiene más de un grupo activo; solicita a coordinación que resuelva la asignación');
  if (!result.recordset[0]) throw new HttpError(404, 'No tienes un proyecto asignado');
  return result.recordset[0];
}

export async function getTutorProjects(userId: number) {
  const pool = await connectDatabase();
  const result = await pool.request().input('userId', userId).query(`
    ${projectSelect('p.id_estudiante')}
    WHERE p.id_tutor = @userId
       OR EXISTS (
         SELECT 1 FROM GruposTrabajo g
         WHERE g.id_proyecto = p.id_proyecto AND g.id_profesor = @userId AND g.activo = 1
       )
       OR EXISTS (
         SELECT 1 FROM Usuarios
         WHERE id_usuario = @userId AND rol IN ('COORDINADOR', 'ADMINISTRADOR')
       )
    ${projectGroupBy}
    ORDER BY p.id_proyecto DESC
  `);
  return result.recordset;
}

export async function getProjectStudentProgress(projectId: number, userId: number, role: string) {
  const access = await projectAccess(projectId, userId);
  const pool = await connectDatabase();
  const groupFilter = access.id_grupo === null
    ? 'student.id_usuario = @studentId'
    : `EXISTS (
        SELECT 1 FROM GrupoEstudiantes membership
        WHERE membership.id_grupo = @groupId
          AND membership.id_estudiante = student.id_usuario
      )`;
  const result = await pool.request()
    .input('projectId', projectId)
    .input('studentId', userId)
    .input('groupId', access.id_grupo)
    .input('role', role)
    .query(`
      SELECT
        student.id_usuario,
        student.nombre,
        student.apellido,
        student.correo,
        activity.id_actividad,
        activity.numero_semana,
        activity.titulo,
        activity.descripcion,
        activity.fecha_inicio,
        activity.fecha_limite,
        activity.estado AS estado_actividad,
        activity.bloqueada,
        activity.es_semana_base,
        latest.id_entrega,
        latest.estado_revision AS estado_entrega,
        latest.calificacion,
        latest.fecha_entrega,
        latest.comentario_estudiante,
        latest.nombre_archivo,
        latest.url_externa,
        latest.retroalimentacion,
        latest.fecha_retroalimentacion,
        CAST(CASE WHEN EXISTS (
          SELECT 1 FROM Entregas approved
          WHERE approved.id_actividad = activity.id_actividad
            AND approved.id_estudiante = student.id_usuario
            AND approved.estado_revision = 'APROBADA'
        ) THEN 1 ELSE 0 END AS bit) AS aprobada
      FROM Proyectos p
      JOIN Usuarios student ON ${groupFilter}
      LEFT JOIN Actividades activity
        ON activity.id_proyecto = p.id_proyecto AND activity.es_semana_base = 1
      OUTER APPLY (
        SELECT TOP (1)
          delivery.id_entrega,
          delivery.estado_revision,
          delivery.calificacion,
          delivery.fecha_entrega,
          delivery.comentario_estudiante,
          delivery.nombre_archivo,
          delivery.url_externa,
          feedback.comentario AS retroalimentacion,
          feedback.fecha_creacion AS fecha_retroalimentacion
        FROM Entregas delivery
        OUTER APPLY (
          SELECT TOP (1) review.comentario, review.fecha_creacion
          FROM Retroalimentaciones review
          WHERE review.id_entrega = delivery.id_entrega
          ORDER BY review.fecha_creacion DESC, review.id_retroalimentacion DESC
        ) feedback
        WHERE delivery.id_actividad = activity.id_actividad
          AND delivery.id_estudiante = student.id_usuario
        ORDER BY CASE WHEN delivery.estado_revision = 'APROBADA' THEN 0 ELSE 1 END,
                 delivery.fecha_entrega DESC, delivery.id_entrega DESC
      ) latest
      WHERE p.id_proyecto = @projectId
        AND student.rol = 'ESTUDIANTE'
        AND student.activo = 1
        AND (
          (@role = 'ESTUDIANTE' AND student.id_usuario = @studentId)
          OR @role = 'PROFESOR'
          OR @role IN ('COORDINADOR', 'ADMINISTRADOR')
        )
      ORDER BY student.apellido, student.nombre, activity.numero_semana
    `);

  const students = new Map<number, {
    id_usuario: number;
    nombre: string;
    apellido: string;
    correo: string;
    semanas: Record<string, unknown>[];
  }>();
  for (const row of result.recordset) {
    let student = students.get(row.id_usuario);
    if (!student) {
      student = {
        id_usuario: row.id_usuario,
        nombre: row.nombre,
        apellido: row.apellido,
        correo: row.correo,
        semanas: []
      };
      students.set(row.id_usuario, student);
    }
    if (row.id_actividad !== null) {
      student.semanas.push({
        id_actividad: row.id_actividad,
        numero_semana: row.numero_semana,
        titulo: row.titulo,
        descripcion: row.descripcion,
        fecha_inicio: row.fecha_inicio,
        fecha_limite: row.fecha_limite,
        estado_actividad: row.estado_actividad,
        bloqueada: row.bloqueada,
        es_semana_base: row.es_semana_base,
        id_entrega: row.id_entrega,
        estado_entrega: row.estado_entrega,
        calificacion: row.calificacion,
        fecha_entrega: row.fecha_entrega,
        comentario_estudiante: row.comentario_estudiante,
        nombre_archivo: row.nombre_archivo,
        url_externa: row.url_externa,
        retroalimentacion: row.retroalimentacion,
        fecha_retroalimentacion: row.fecha_retroalimentacion,
        aprobada: Boolean(row.aprobada)
      });
    }
  }

  return [...students.values()].map(student => {
    const approved = student.semanas.filter(week => week.aprobada).length;
    const pending = student.semanas.filter(week =>
      week.id_entrega && !['APROBADA', 'RECHAZADA', 'REQUIERE_CORRECCION'].includes(String(week.estado_entrega))
    ).length;
    const reviewed = student.semanas.filter(week =>
      week.id_entrega && ['APROBADA', 'RECHAZADA', 'REQUIERE_CORRECCION'].includes(String(week.estado_entrega))
    ).length;
    const next = student.semanas.find(week =>
      !week.aprobada &&
      !week.bloqueada &&
      (!week.id_entrega || ['REQUIERE_CORRECCION', 'RECHAZADA'].includes(String(week.estado_entrega)))
    );
    const latestFeedback = student.semanas
      .filter(week => week.retroalimentacion)
      .sort((left, right) =>
        new Date(String(right.fecha_retroalimentacion)).getTime() -
        new Date(String(left.fecha_retroalimentacion)).getTime()
      )[0];
    return {
      ...student,
      id_grupo: access.id_grupo,
      aprobadas: approved,
      total_actividades: 16,
      progreso: Math.round(approved / 16 * 100),
      entregas_pendientes: pending,
      entregas_revisadas: reviewed,
      proxima_actividad: next ? {
        id_actividad: next.id_actividad,
        numero_semana: next.numero_semana,
        titulo: next.titulo,
        fecha_limite: next.fecha_limite
      } : null,
      ultima_retroalimentacion: latestFeedback ? {
        texto: latestFeedback.retroalimentacion,
        fecha: latestFeedback.fecha_retroalimentacion,
        numero_semana: latestFeedback.numero_semana
      } : null,
      semanas: student.semanas
    };
  });
}
