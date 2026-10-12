-- PolyThesis / SynesisDB
-- Proyecto compartido por grupo y 16 actividades semanales persistidas.
-- Ejecutar después de 000_core_schema.sql, 001, 002 y 003.
-- Aditivo, idempotente y no destructivo: conserva proyectos, actividades y entregas.

-- Bootstrap estructural en su propio batch. SQL Server compila cada batch antes
-- de ejecutarlo; el batch siguiente puede resolver estas columnas normalmente.
SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;
  IF COL_LENGTH('dbo.GruposTrabajo', 'id_proyecto') IS NULL
  BEGIN
    ALTER TABLE dbo.GruposTrabajo ADD id_proyecto INT NULL;
  END;

  IF COL_LENGTH('dbo.Actividades', 'es_semana_base') IS NULL
  BEGIN
    ALTER TABLE dbo.Actividades ADD es_semana_base BIT NOT NULL
      CONSTRAINT DF_Actividades_es_semana_base DEFAULT (0) WITH VALUES;
  END;
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO

-- Desde aquí ambas columnas ya existen a nivel de esquema y son resolubles.
SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @WeekTemplates TABLE (
    numero_semana TINYINT NOT NULL PRIMARY KEY,
    titulo NVARCHAR(200) NOT NULL,
    descripcion NVARCHAR(MAX) NOT NULL
  );
  INSERT INTO @WeekTemplates (numero_semana, titulo, descripcion)
  VALUES
    (1,  N'Inicio y formalización', N'Inicio, formalización, asignación y planteamiento inicial.'),
    (2,  N'Anteproyecto parte 1', N'Título, alcance y contexto del problema.'),
    (3,  N'Anteproyecto parte 2', N'Justificación y objetivos del proyecto.'),
    (4,  N'Anteproyecto parte 3', N'Bibliografía, cronograma y entregables del anteproyecto.'),
    (5,  N'Marco teórico', N'Desarrollo del marco teórico y revisión de fuentes.'),
    (6,  N'Requerimientos parte 1', N'Análisis de requerimientos funcionales.'),
    (7,  N'Requerimientos parte 2', N'Análisis de requerimientos no funcionales.'),
    (8,  N'Diseño de solución', N'Diseño de la solución, prototipos y arquitectura inicial.'),
    (9,  N'Desarrollo de propuesta tecnológica', N'Construcción y actualización de la propuesta tecnológica.'),
    (10, N'Arquitectura de software', N'Definición de arquitectura, datos y comunicaciones.'),
    (11, N'Documentación de arquitectura', N'Documentación de la arquitectura propuesta.'),
    (12, N'Documentación de pruebas', N'Plan y documentación de pruebas.'),
    (13, N'Ejecución de pruebas', N'Ejecución y registro de pruebas del sistema.'),
    (14, N'Análisis de resultados', N'Análisis y documentación de resultados de pruebas.'),
    (15, N'Conclusión del proyecto', N'Conclusiones, recomendaciones y trabajo futuro.'),
    (16, N'Informe final y retrospectiva', N'Entrega del informe final y retrospectiva del proyecto.');

  IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_GruposTrabajo_Proyecto' AND parent_object_id = OBJECT_ID('dbo.GruposTrabajo')
  )
  BEGIN
    ALTER TABLE dbo.GruposTrabajo ADD CONSTRAINT FK_GruposTrabajo_Proyecto
      FOREIGN KEY (id_proyecto) REFERENCES dbo.Proyectos(id_proyecto);
  END;

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_GruposTrabajo_proyecto' AND object_id = OBJECT_ID('dbo.GruposTrabajo')
  )
  BEGIN
    CREATE UNIQUE INDEX UX_GruposTrabajo_proyecto
      ON dbo.GruposTrabajo(id_proyecto)
      WHERE id_proyecto IS NOT NULL;
  END;

  -- Attach legacy projects only where the tutor/student mapping identifies one group.
  IF EXISTS (
    SELECT p.id_proyecto
    FROM dbo.Proyectos p
    JOIN dbo.GrupoEstudiantes ge ON ge.id_estudiante = p.id_estudiante
    JOIN dbo.GruposTrabajo g ON g.id_grupo = ge.id_grupo AND g.id_profesor = p.id_tutor
    WHERE g.id_proyecto IS NULL
    GROUP BY p.id_proyecto
    HAVING COUNT(DISTINCT g.id_grupo) > 1
       OR EXISTS (SELECT 1 FROM dbo.GruposTrabajo linked WHERE linked.id_proyecto = p.id_proyecto)
  )
  BEGIN
    ;THROW 51023, 'Hay proyectos compatibles con varios grupos o ya asociados a otro grupo. Resuelve esos vínculos antes de ejecutar 004.', 1;
  END;

  ;WITH project_group_candidates AS (
    SELECT p.id_proyecto, g.id_grupo,
           ROW_NUMBER() OVER (PARTITION BY g.id_grupo ORDER BY p.id_proyecto) AS rn,
           COUNT(*) OVER (PARTITION BY g.id_grupo) AS candidate_count
    FROM dbo.Proyectos p
    JOIN dbo.GrupoEstudiantes ge ON ge.id_estudiante = p.id_estudiante
    JOIN dbo.GruposTrabajo g ON g.id_grupo = ge.id_grupo
    WHERE g.id_profesor = p.id_tutor
      AND g.id_proyecto IS NULL
  )
  UPDATE g SET id_proyecto = c.id_proyecto
  FROM dbo.GruposTrabajo g
  JOIN project_group_candidates c ON c.id_grupo = g.id_grupo
  WHERE c.rn = 1 AND c.candidate_count = 1;

  -- Do not guess which project belongs to a group when several compatible legacy
  -- projects exist. The coordinator must resolve the conflict before migration.
  IF EXISTS (
    SELECT g.id_grupo
    FROM dbo.GruposTrabajo g
    JOIN dbo.GrupoEstudiantes ge ON ge.id_grupo = g.id_grupo
    JOIN dbo.Proyectos p ON p.id_estudiante = ge.id_estudiante AND p.id_tutor = g.id_profesor
    WHERE g.id_proyecto IS NULL
    GROUP BY g.id_grupo
    HAVING COUNT(DISTINCT p.id_proyecto) > 1
  )
  BEGIN
    ;THROW 51020, 'Hay varios proyectos existentes candidatos para un grupo. Resuelve el vínculo antes de ejecutar 004.', 1;
  END;

  IF EXISTS (
    SELECT 1
    FROM dbo.GruposTrabajo g
    WHERE g.activo = 1
      AND NOT EXISTS (SELECT 1 FROM dbo.GrupoEstudiantes ge WHERE ge.id_grupo = g.id_grupo)
  )
  BEGIN
    ;THROW 51021, 'Hay grupos activos sin estudiantes. Asígnales al menos un estudiante o desactívalos antes de ejecutar 004.', 1;
  END;

  IF EXISTS (
    SELECT ge.id_estudiante
    FROM dbo.GrupoEstudiantes ge
    JOIN dbo.GruposTrabajo g ON g.id_grupo = ge.id_grupo AND g.activo = 1
    GROUP BY ge.id_estudiante
    HAVING COUNT(DISTINCT g.id_grupo) > 1
  )
  BEGIN
    ;THROW 51025, 'Hay estudiantes asignados a varios grupos activos. Resuelve esas asignaciones antes de ejecutar 004.', 1;
  END;

  -- Reuse a unique compatible legacy project when available; otherwise create one
  -- project for the group using its first assigned student as the reference student.
  DECLARE @CreatedGroupProjects TABLE (id_grupo INT NOT NULL PRIMARY KEY, id_proyecto INT NOT NULL);
  ;WITH missing_groups AS (
    SELECT g.id_grupo, g.nombre, g.id_profesor, MIN(ge.id_estudiante) AS id_estudiante
    FROM dbo.GruposTrabajo g
    JOIN dbo.GrupoEstudiantes ge ON ge.id_grupo = g.id_grupo
    WHERE g.id_proyecto IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM dbo.Proyectos p
        JOIN dbo.GrupoEstudiantes ge2 ON ge2.id_estudiante = p.id_estudiante AND ge2.id_grupo = g.id_grupo
        WHERE p.id_tutor = g.id_profesor
      )
    GROUP BY g.id_grupo, g.nombre, g.id_profesor
  )
  MERGE dbo.Proyectos AS target
  USING missing_groups AS source ON 1 = 0
  WHEN NOT MATCHED THEN
    INSERT (titulo, descripcion, id_estudiante, id_tutor, estado, fecha_inicio)
    VALUES (
      CONCAT(N'Trabajo de grado - ', source.nombre),
      CONCAT(N'Proyecto académico compartido del grupo ', source.nombre),
      source.id_estudiante, source.id_profesor, 'ACTIVO', CAST(GETDATE() AS DATE)
    )
  OUTPUT source.id_grupo, inserted.id_proyecto INTO @CreatedGroupProjects(id_grupo, id_proyecto);

  UPDATE g SET id_proyecto = created.id_proyecto
  FROM dbo.GruposTrabajo g
  JOIN @CreatedGroupProjects created ON created.id_grupo = g.id_grupo;

  IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_GruposTrabajo_activo_proyecto'
      AND parent_object_id = OBJECT_ID('dbo.GruposTrabajo')
  )
  BEGIN
    IF EXISTS (SELECT 1 FROM dbo.GruposTrabajo WHERE activo = 1 AND id_proyecto IS NULL)
    BEGIN
      ;THROW 51024, 'Hay grupos activos sin proyecto asociado. Resuelve la asignación antes de ejecutar 004.', 1;
    END;

    ALTER TABLE dbo.GruposTrabajo ADD CONSTRAINT CK_GruposTrabajo_activo_proyecto
      CHECK (activo = 0 OR id_proyecto IS NOT NULL);
  END;

  ;WITH ranked_activities AS (
    SELECT a.id_actividad,
           ROW_NUMBER() OVER (
             PARTITION BY a.id_proyecto, a.numero_semana
             ORDER BY a.id_actividad
           ) AS rn
    FROM dbo.Actividades a
    WHERE a.numero_semana BETWEEN 1 AND 16
  )
  UPDATE a
    SET es_semana_base = CASE WHEN r.rn = 1 THEN 1 ELSE 0 END
  FROM dbo.Actividades a
  JOIN ranked_activities r ON r.id_actividad = a.id_actividad;

  INSERT INTO dbo.Actividades
    (id_proyecto, numero_semana, titulo, descripcion, estado, bloqueada, es_semana_base)
  SELECT p.id_proyecto, w.numero_semana, w.titulo, w.descripcion, 'PENDIENTE', 1, 1
  FROM dbo.Proyectos p
  CROSS JOIN @WeekTemplates w
  WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.Actividades a
    WHERE a.id_proyecto = p.id_proyecto
      AND a.numero_semana = w.numero_semana
      AND a.es_semana_base = 1
  );

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_Actividades_semana_base'
      AND object_id = OBJECT_ID('dbo.Actividades')
  )
  BEGIN
    CREATE UNIQUE INDEX UX_Actividades_semana_base
      ON dbo.Actividades(id_proyecto, numero_semana)
      WHERE es_semana_base = 1;
  END;

  -- Normalize the workflow states while retaining rows and delivery history.
  IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_Actividades_estado_fase2'
      AND parent_object_id = OBJECT_ID('dbo.Actividades')
  )
  BEGIN
    IF EXISTS (
      SELECT 1 FROM dbo.Actividades
      WHERE estado NOT IN ('PENDIENTE', 'EN_PROGRESO', 'EN_REVISION', 'COMPLETADA', 'ATRASADA')
    )
    BEGIN
      ;THROW 51022, 'Hay actividades con estados no reconocidos. Normaliza esos estados antes de ejecutar 004.', 1;
    END;

    ALTER TABLE dbo.Actividades ADD CONSTRAINT CK_Actividades_estado_fase2
      CHECK (estado IN ('PENDIENTE', 'EN_PROGRESO', 'EN_REVISION', 'COMPLETADA', 'ATRASADA'));
  END;

  -- Add the broader check before removing the legacy narrower check. Both are
  -- enforced during this transaction, so there's no interval without validation.
  IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_Actividades_estado'
      AND parent_object_id = OBJECT_ID('dbo.Actividades')
  )
  BEGIN
    ALTER TABLE dbo.Actividades DROP CONSTRAINT CK_Actividades_estado;
  END;

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_Entregas_estudiante_actividad_fecha'
      AND object_id = OBJECT_ID('dbo.Entregas')
  )
    CREATE INDEX IX_Entregas_estudiante_actividad_fecha
      ON dbo.Entregas(id_estudiante, id_actividad, fecha_entrega DESC);

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO
