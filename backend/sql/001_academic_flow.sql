-- PolyThesis / SynesisDB
-- Ejecutar manualmente. No recrea ni elimina tablas existentes.

IF COL_LENGTH('dbo.Actividades', 'bloqueada') IS NULL
BEGIN
  ALTER TABLE dbo.Actividades
    ADD bloqueada BIT NOT NULL
      CONSTRAINT DF_Actividades_bloqueada DEFAULT (1) WITH VALUES;
END;
GO

IF COL_LENGTH('dbo.Entregas', 'calificacion') IS NULL
BEGIN
  ALTER TABLE dbo.Entregas
    ADD calificacion DECIMAL(4,2) NULL;
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

IF OBJECT_ID('dbo.Mensajes', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Mensajes (
    id_mensaje INT IDENTITY(1,1) NOT NULL
      CONSTRAINT PK_Mensajes PRIMARY KEY,
    id_proyecto INT NOT NULL,
    id_emisor INT NOT NULL,
    id_receptor INT NOT NULL,
    mensaje VARCHAR(1500) NULL,
    archivo_url VARCHAR(500) NULL,
    leido BIT NOT NULL
      CONSTRAINT DF_Mensajes_leido DEFAULT (0),
    fecha_lectura DATETIME2 NULL,
    fecha_creacion DATETIME2 NOT NULL
      CONSTRAINT DF_Mensajes_fecha_creacion DEFAULT (GETDATE()),
    CONSTRAINT FK_Mensajes_Proyectos
      FOREIGN KEY (id_proyecto) REFERENCES dbo.Proyectos(id_proyecto),
    CONSTRAINT FK_Mensajes_Emisor
      FOREIGN KEY (id_emisor) REFERENCES dbo.Usuarios(id_usuario),
    CONSTRAINT FK_Mensajes_Receptor
      FOREIGN KEY (id_receptor) REFERENCES dbo.Usuarios(id_usuario),
    CONSTRAINT CK_Mensajes_contenido
      CHECK (
        NULLIF(LTRIM(RTRIM(mensaje)), '') IS NOT NULL
        OR NULLIF(LTRIM(RTRIM(archivo_url)), '') IS NOT NULL
      )
  );
END;
GO
