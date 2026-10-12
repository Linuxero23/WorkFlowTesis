-- PolyThesis / SynesisDB
-- Alinea CK_Historial_Tipo con las acciones actuales del backend.
-- Aditiva/idempotente: conserva los tipos ya presentes en el historial.
-- Ejecutar manualmente en SSMS después de 000-005; requiere permiso ALTER.

SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID('dbo.HistorialActividad', 'U') IS NULL
  BEGIN
    ;THROW 51040, 'No existe dbo.HistorialActividad. Ejecuta primero 000_core_schema.sql.', 1;
  END;

  DECLARE @AllowedActions TABLE (
    tipo_accion VARCHAR(100) NOT NULL PRIMARY KEY
  );

  INSERT INTO @AllowedActions (tipo_accion)
  VALUES
    ('ACTIVIDAD_ACTUALIZADA'),
    ('ACTIVIDAD_BLOQUEADA'),
    ('ACTIVIDAD_DESBLOQUEADA'),
    ('ENTREGA_ENVIADA'),
    ('ENTREGA_REVISADA'),
    ('ESTUDIANTE_AGREGADO_GRUPO'),
    ('ESTUDIANTE_RETIRADO_GRUPO'),
    ('GRUPO_CREADO'),
    ('GRUPO_DESACTIVADO'),
    ('GRUPO_REACTIVADO'),
    ('RETROALIMENTACION_CREADA'),
    ('TUTOR_CAMBIADO');

  INSERT INTO @AllowedActions (tipo_accion)
  SELECT DISTINCT historial.tipo_accion
  FROM dbo.HistorialActividad historial
  WHERE NULLIF(LTRIM(RTRIM(historial.tipo_accion)), '') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM @AllowedActions allowed
      WHERE allowed.tipo_accion = historial.tipo_accion
    );

  IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_Historial_Tipo'
      AND parent_object_id = OBJECT_ID('dbo.HistorialActividad')
  )
  BEGIN
    ALTER TABLE dbo.HistorialActividad DROP CONSTRAINT CK_Historial_Tipo;
  END;

  DECLARE @ActionList NVARCHAR(MAX);
  SELECT @ActionList = STUFF((
    SELECT N',' + QUOTENAME(allowed.tipo_accion, '''')
    FROM @AllowedActions allowed
    ORDER BY allowed.tipo_accion
    FOR XML PATH(''), TYPE
  ).value('.', 'NVARCHAR(MAX)'), 1, 1, N'');

  DECLARE @ConstraintSql NVARCHAR(MAX) =
    N'ALTER TABLE dbo.HistorialActividad WITH CHECK ADD CONSTRAINT CK_Historial_Tipo '
    + N'CHECK (tipo_accion IN (' + @ActionList + N'));';
  EXEC sys.sp_executesql @ConstraintSql;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO
