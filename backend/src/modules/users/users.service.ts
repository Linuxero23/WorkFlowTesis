import { connectDatabase } from '../../config/database';

export async function listUsers(role?: string) {
  const pool = await connectDatabase();
  const request = pool.request().input('role', role || null);
  const result = await request.query(`
    SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.rol, u.activo, u.fecha_registro,
           COUNT(DISTINCT CASE WHEN u.rol = 'PROFESOR' THEN g.id_grupo END) AS grupos_tutorizados,
           COUNT(DISTINCT CASE WHEN u.rol = 'PROFESOR' THEN ge.id_estudiante END) AS estudiantes_asignados,
           COUNT(DISTINCT CASE WHEN u.rol = 'ESTUDIANTE' THEN ge.id_grupo END) AS grupos_activos,
           MAX(CASE WHEN u.rol = 'ESTUDIANTE' THEN CONCAT(t.nombre, ' ', t.apellido) END) AS tutor_nombre,
           MAX(CASE WHEN u.rol = 'ESTUDIANTE' THEN p.titulo END) AS proyecto_titulo
    FROM Usuarios u
    LEFT JOIN GruposTrabajo g ON g.id_profesor = u.id_usuario AND g.activo = 1
    LEFT JOIN GrupoEstudiantes ge ON ge.id_grupo = g.id_grupo
    LEFT JOIN Proyectos p ON p.id_estudiante = u.id_usuario
    LEFT JOIN Usuarios t ON t.id_usuario = p.id_tutor
    WHERE (@role IS NULL OR (u.rol = @role AND u.activo = 1))
    GROUP BY u.id_usuario, u.nombre, u.apellido, u.correo, u.rol, u.activo, u.fecha_registro
    ORDER BY u.apellido, u.nombre
  `);
  return result.recordset;
}

export async function coordinatorStats() {
  const pool = await connectDatabase();
  const result = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM Usuarios WHERE rol = 'ESTUDIANTE' AND activo = 1) AS total_estudiantes,
      (SELECT COUNT(*) FROM Usuarios WHERE rol = 'PROFESOR' AND activo = 1) AS total_profesores,
      (SELECT COUNT(*) FROM GruposTrabajo WHERE activo = 1) AS grupos_activos,
      (SELECT COUNT(*) FROM Usuarios u WHERE u.rol = 'ESTUDIANTE' AND u.activo = 1 AND NOT EXISTS (
        SELECT 1 FROM GrupoEstudiantes ge JOIN GruposTrabajo g ON g.id_grupo = ge.id_grupo
        WHERE ge.id_estudiante = u.id_usuario AND g.activo = 1
      )) AS estudiantes_sin_grupo,
      (SELECT COUNT(*) FROM Notificaciones WHERE leida = 0) AS notificaciones_pendientes
  `);
  return result.recordset[0];
}
