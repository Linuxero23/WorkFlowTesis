-- PolyThesis / SynesisDB
-- Completa la calificación de entregas en bases existentes donde faltó 001_academic_flow.sql.
-- Aditivo e idempotente: conserva las entregas y las calificaciones existentes.

IF OBJECT_ID('dbo.Entregas', 'U') IS NULL
  THROW 50001, 'No existe dbo.Entregas; ejecuta primero la migración base.', 1;
GO

IF COL_LENGTH('dbo.Entregas', 'calificacion') IS NULL
BEGIN
  ALTER TABLE dbo.Entregas ADD calificacion DECIMAL(4,2) NULL;
END;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.check_constraints
  WHERE name = 'CK_Entregas_calificacion_rango'
    AND parent_object_id = OBJECT_ID('dbo.Entregas')
)
BEGIN
  ALTER TABLE dbo.Entregas
    ADD CONSTRAINT CK_Entregas_calificacion_rango
    CHECK (calificacion IS NULL OR (calificacion >= 0.00 AND calificacion <= 5.00));
END;
GO
