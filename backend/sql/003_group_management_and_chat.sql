-- PoliThesis / SynesisDB
-- Ejecutar manualmente. No ejecuta DROP ni elimina historial.

IF OBJECT_ID('dbo.Conversaciones', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Conversaciones (
    id_conversacion INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Conversaciones PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL,
    id_grupo INT NULL,
    nombre VARCHAR(150) NULL,
    activo BIT NOT NULL CONSTRAINT DF_Conversaciones_activo DEFAULT (1),
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_Conversaciones_fecha_creacion DEFAULT (GETDATE()),
    CONSTRAINT CK_Conversaciones_tipo CHECK (tipo IN ('DIRECTA', 'GRUPO')),
    CONSTRAINT CK_Conversaciones_grupo CHECK ((tipo = 'GRUPO' AND id_grupo IS NOT NULL) OR (tipo = 'DIRECTA' AND id_grupo IS NULL)),
    CONSTRAINT FK_Conversaciones_Grupo FOREIGN KEY (id_grupo) REFERENCES dbo.GruposTrabajo(id_grupo)
  );
END;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'UX_Conversaciones_grupo' AND object_id = OBJECT_ID('dbo.Conversaciones')
)
BEGIN
  CREATE UNIQUE INDEX UX_Conversaciones_grupo
    ON dbo.Conversaciones(id_grupo)
    WHERE tipo = 'GRUPO' AND id_grupo IS NOT NULL;
END;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.check_constraints
  WHERE name = 'CK_Conversaciones_grupo'
    AND parent_object_id = OBJECT_ID('dbo.Conversaciones')
)
BEGIN
  ALTER TABLE dbo.Conversaciones
    ADD CONSTRAINT CK_Conversaciones_grupo
    CHECK ((tipo = 'GRUPO' AND id_grupo IS NOT NULL) OR (tipo = 'DIRECTA' AND id_grupo IS NULL));
END;
GO

IF OBJECT_ID('dbo.ConversacionParticipantes', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.ConversacionParticipantes (
    id_conversacion INT NOT NULL,
    id_usuario INT NOT NULL,
    fecha_union DATETIME2 NOT NULL CONSTRAINT DF_ConversacionParticipantes_fecha_union DEFAULT (GETDATE()),
    activo BIT NOT NULL CONSTRAINT DF_ConversacionParticipantes_activo DEFAULT (1),
    ultima_lectura DATETIME2 NULL,
    CONSTRAINT PK_ConversacionParticipantes PRIMARY KEY (id_conversacion, id_usuario),
    CONSTRAINT FK_ConversacionParticipantes_Conversacion FOREIGN KEY (id_conversacion) REFERENCES dbo.Conversaciones(id_conversacion),
    CONSTRAINT FK_ConversacionParticipantes_Usuario FOREIGN KEY (id_usuario) REFERENCES dbo.Usuarios(id_usuario)
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ConversacionParticipantes_usuario_activo' AND object_id = OBJECT_ID('dbo.ConversacionParticipantes'))
  CREATE INDEX IX_ConversacionParticipantes_usuario_activo ON dbo.ConversacionParticipantes(id_usuario, activo, id_conversacion);
GO

IF OBJECT_ID('dbo.Mensajes', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Mensajes (
    id_mensaje INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Mensajes PRIMARY KEY,
    id_conversacion INT NOT NULL,
    id_emisor INT NOT NULL,
    mensaje VARCHAR(1500) NULL,
    archivo_url VARCHAR(500) NULL,
    leido BIT NOT NULL CONSTRAINT DF_Mensajes_leido DEFAULT (0),
    fecha_lectura DATETIME2 NULL,
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_Mensajes_fecha_creacion DEFAULT (GETDATE()),
    CONSTRAINT FK_Mensajes_Conversacion FOREIGN KEY (id_conversacion) REFERENCES dbo.Conversaciones(id_conversacion),
    CONSTRAINT FK_Mensajes_Emisor FOREIGN KEY (id_emisor) REFERENCES dbo.Usuarios(id_usuario),
    CONSTRAINT CK_Mensajes_contenido CHECK (NULLIF(LTRIM(RTRIM(mensaje)), '') IS NOT NULL OR NULLIF(LTRIM(RTRIM(archivo_url)), '') IS NOT NULL)
  );
END;
GO

IF COL_LENGTH('dbo.Mensajes', 'id_conversacion') IS NULL
BEGIN
  ALTER TABLE dbo.Mensajes ADD id_conversacion INT NULL;
END;
GO

-- Compatibilidad no destructiva con la tabla Mensajes creada por 001_academic_flow.sql.
-- El nuevo modelo usa id_conversacion; los campos legacy se conservan, pero dejan
-- de ser obligatorios para que los mensajes nuevos no tengan que duplicar relaciones.
IF COL_LENGTH('dbo.Mensajes', 'id_proyecto') IS NOT NULL
BEGIN
  ALTER TABLE dbo.Mensajes ALTER COLUMN id_proyecto INT NULL;
END;
GO

IF COL_LENGTH('dbo.Mensajes', 'id_receptor') IS NOT NULL
BEGIN
  ALTER TABLE dbo.Mensajes ALTER COLUMN id_receptor INT NULL;
END;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys
  WHERE name = 'FK_Mensajes_Conversacion' AND parent_object_id = OBJECT_ID('dbo.Mensajes')
)
AND COL_LENGTH('dbo.Mensajes', 'id_conversacion') IS NOT NULL
BEGIN
  ALTER TABLE dbo.Mensajes ADD CONSTRAINT FK_Mensajes_Conversacion FOREIGN KEY (id_conversacion) REFERENCES dbo.Conversaciones(id_conversacion);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Mensajes_conversacion_fecha' AND object_id = OBJECT_ID('dbo.Mensajes'))
  CREATE INDEX IX_Mensajes_conversacion_fecha ON dbo.Mensajes(id_conversacion, fecha_creacion);
GO

-- Si HistorialActividad ya tiene CK_Historial_Tipo, alinea sus acciones con
-- backend/sql/006_historial_activity_types.sql después de ejecutar esta migración.
