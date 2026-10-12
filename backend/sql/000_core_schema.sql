-- PolyThesis / SynesisDB
-- Base idempotente para instalaciones nuevas. No elimina ni trunca tablas o datos.
-- Ejecutar en la base de datos vacía antes de 001, 002 y 003.

IF OBJECT_ID('dbo.Usuarios', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Usuarios (
    id_usuario INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Usuarios PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    apellido NVARCHAR(100) NOT NULL,
    correo NVARCHAR(254) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    activo BIT NOT NULL CONSTRAINT DF_Usuarios_activo DEFAULT (1),
    fecha_registro DATETIME2 NOT NULL CONSTRAINT DF_Usuarios_fecha_registro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Usuarios_rol CHECK (rol IN ('ESTUDIANTE', 'PROFESOR', 'COORDINADOR', 'ADMINISTRADOR'))
  );
END;
GO

-- Compatibilidad aditiva: cuentas antiguas sin hash deben restablecer su contraseña
-- antes de iniciar sesión; no se inventa ni se almacena una contraseña por defecto.
IF OBJECT_ID('dbo.Usuarios', 'U') IS NOT NULL AND COL_LENGTH('dbo.Usuarios', 'password_hash') IS NULL
BEGIN
  ALTER TABLE dbo.Usuarios ADD password_hash NVARCHAR(255) NULL;
END;
GO

IF OBJECT_ID('dbo.Usuarios', 'U') IS NOT NULL AND COL_LENGTH('dbo.Usuarios', 'activo') IS NULL
BEGIN
  ALTER TABLE dbo.Usuarios ADD activo BIT NOT NULL
    CONSTRAINT DF_Usuarios_activo_migration DEFAULT (1) WITH VALUES;
END;
GO

IF OBJECT_ID('dbo.Usuarios', 'U') IS NOT NULL AND COL_LENGTH('dbo.Usuarios', 'fecha_registro') IS NULL
BEGIN
  ALTER TABLE dbo.Usuarios ADD fecha_registro DATETIME2 NOT NULL
    CONSTRAINT DF_Usuarios_fecha_registro_migration DEFAULT (SYSUTCDATETIME()) WITH VALUES;
END;
GO

IF OBJECT_ID('dbo.Proyectos', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Proyectos (
    id_proyecto INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Proyectos PRIMARY KEY,
    titulo NVARCHAR(200) NOT NULL,
    descripcion NVARCHAR(MAX) NULL,
    id_estudiante INT NOT NULL,
    id_tutor INT NOT NULL,
    estado VARCHAR(30) NOT NULL CONSTRAINT DF_Proyectos_estado DEFAULT ('ACTIVO'),
    fecha_inicio DATE NULL,
    fecha_fin_estimada DATE NULL,
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_Proyectos_fecha_creacion DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Proyectos_Estudiante FOREIGN KEY (id_estudiante) REFERENCES dbo.Usuarios(id_usuario),
    CONSTRAINT FK_Proyectos_Tutor FOREIGN KEY (id_tutor) REFERENCES dbo.Usuarios(id_usuario),
    CONSTRAINT CK_Proyectos_fechas CHECK (fecha_fin_estimada IS NULL OR fecha_inicio IS NULL OR fecha_fin_estimada >= fecha_inicio)
  );
END;
GO

IF OBJECT_ID('dbo.Actividades', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Actividades (
    id_actividad INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Actividades PRIMARY KEY,
    id_proyecto INT NOT NULL,
    numero_semana TINYINT NOT NULL,
    titulo NVARCHAR(200) NOT NULL,
    descripcion NVARCHAR(MAX) NULL,
    fecha_inicio DATE NULL,
    fecha_limite DATE NULL,
    estado VARCHAR(30) NOT NULL CONSTRAINT DF_Actividades_estado DEFAULT ('PENDIENTE'),
    fecha_completada DATETIME2 NULL,
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_Actividades_fecha_creacion DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Actividades_Proyecto FOREIGN KEY (id_proyecto) REFERENCES dbo.Proyectos(id_proyecto),
    CONSTRAINT CK_Actividades_semana CHECK (numero_semana BETWEEN 1 AND 16),
    CONSTRAINT CK_Actividades_estado CHECK (estado IN ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'ATRASADA')),
    CONSTRAINT CK_Actividades_fechas CHECK (fecha_limite IS NULL OR fecha_inicio IS NULL OR fecha_limite >= fecha_inicio)
  );
END;
GO

IF OBJECT_ID('dbo.Entregas', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Entregas (
    id_entrega INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Entregas PRIMARY KEY,
    id_actividad INT NOT NULL,
    id_estudiante INT NOT NULL,
    nombre_archivo NVARCHAR(255) NULL,
    ruta_archivo NVARCHAR(500) NULL,
    url_externa NVARCHAR(2048) NULL,
    comentario_estudiante NVARCHAR(MAX) NULL,
    estado_revision VARCHAR(30) NOT NULL CONSTRAINT DF_Entregas_estado_revision DEFAULT ('ENVIADA'),
    fecha_entrega DATETIME2 NOT NULL CONSTRAINT DF_Entregas_fecha_entrega DEFAULT (SYSUTCDATETIME()),
    fecha_revision DATETIME2 NULL,
    revisado_por INT NULL,
    CONSTRAINT FK_Entregas_Actividad FOREIGN KEY (id_actividad) REFERENCES dbo.Actividades(id_actividad),
    CONSTRAINT FK_Entregas_Estudiante FOREIGN KEY (id_estudiante) REFERENCES dbo.Usuarios(id_usuario),
    CONSTRAINT FK_Entregas_Revisor FOREIGN KEY (revisado_por) REFERENCES dbo.Usuarios(id_usuario),
    CONSTRAINT CK_Entregas_estado_revision CHECK (estado_revision IN ('ENVIADA', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'REQUIERE_CORRECCION')),
    CONSTRAINT CK_Entregas_contenido CHECK (
      NULLIF(LTRIM(RTRIM(comentario_estudiante)), '') IS NOT NULL
      OR NULLIF(LTRIM(RTRIM(url_externa)), '') IS NOT NULL
      OR NULLIF(LTRIM(RTRIM(ruta_archivo)), '') IS NOT NULL
    )
  );
END;
GO

IF OBJECT_ID('dbo.Notificaciones', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Notificaciones (
    id_notificacion INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Notificaciones PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_proyecto INT NULL,
    id_actividad INT NULL,
    id_entrega INT NULL,
    titulo NVARCHAR(200) NOT NULL,
    mensaje NVARCHAR(1000) NOT NULL,
    tipo VARCHAR(20) NOT NULL CONSTRAINT DF_Notificaciones_tipo DEFAULT ('INFO'),
    leida BIT NOT NULL CONSTRAINT DF_Notificaciones_leida DEFAULT (0),
    fecha_lectura DATETIME2 NULL,
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_Notificaciones_fecha_creacion DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Notificaciones_Usuario FOREIGN KEY (id_usuario) REFERENCES dbo.Usuarios(id_usuario),
    CONSTRAINT FK_Notificaciones_Proyecto FOREIGN KEY (id_proyecto) REFERENCES dbo.Proyectos(id_proyecto),
    CONSTRAINT FK_Notificaciones_Actividad FOREIGN KEY (id_actividad) REFERENCES dbo.Actividades(id_actividad),
    CONSTRAINT FK_Notificaciones_Entrega FOREIGN KEY (id_entrega) REFERENCES dbo.Entregas(id_entrega)
  );
END;
GO

IF OBJECT_ID('dbo.Retroalimentaciones', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Retroalimentaciones (
    id_retroalimentacion INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Retroalimentaciones PRIMARY KEY,
    id_entrega INT NOT NULL,
    id_autor INT NOT NULL,
    comentario NVARCHAR(MAX) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_Retroalimentaciones_fecha_creacion DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Retroalimentaciones_Entrega FOREIGN KEY (id_entrega) REFERENCES dbo.Entregas(id_entrega),
    CONSTRAINT FK_Retroalimentaciones_Autor FOREIGN KEY (id_autor) REFERENCES dbo.Usuarios(id_usuario),
    CONSTRAINT CK_Retroalimentaciones_tipo CHECK (tipo IN ('OBSERVACION', 'CORRECCION', 'APROBACION', 'RECHAZO'))
  );
END;
GO

IF OBJECT_ID('dbo.HistorialActividad', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.HistorialActividad (
    id_historial INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_HistorialActividad PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_proyecto INT NULL,
    tipo_accion VARCHAR(100) NOT NULL,
    descripcion NVARCHAR(1000) NOT NULL,
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_HistorialActividad_fecha_creacion DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_HistorialActividad_Usuario FOREIGN KEY (id_usuario) REFERENCES dbo.Usuarios(id_usuario),
    CONSTRAINT FK_HistorialActividad_Proyecto FOREIGN KEY (id_proyecto) REFERENCES dbo.Proyectos(id_proyecto)
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Usuarios_correo' AND object_id = OBJECT_ID('dbo.Usuarios'))
  CREATE UNIQUE INDEX UX_Usuarios_correo ON dbo.Usuarios(correo);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Proyectos_estudiante' AND object_id = OBJECT_ID('dbo.Proyectos'))
  CREATE INDEX IX_Proyectos_estudiante ON dbo.Proyectos(id_estudiante);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Proyectos_tutor' AND object_id = OBJECT_ID('dbo.Proyectos'))
  CREATE INDEX IX_Proyectos_tutor ON dbo.Proyectos(id_tutor);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Actividades_proyecto_semana' AND object_id = OBJECT_ID('dbo.Actividades'))
  CREATE INDEX IX_Actividades_proyecto_semana ON dbo.Actividades(id_proyecto, numero_semana);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Entregas_actividad_fecha' AND object_id = OBJECT_ID('dbo.Entregas'))
  CREATE INDEX IX_Entregas_actividad_fecha ON dbo.Entregas(id_actividad, fecha_entrega DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notificaciones_usuario_fecha' AND object_id = OBJECT_ID('dbo.Notificaciones'))
  CREATE INDEX IX_Notificaciones_usuario_fecha ON dbo.Notificaciones(id_usuario, fecha_creacion DESC);
GO

-- Los scripts posteriores requieren las columnas originales de estas tablas.
IF COL_LENGTH('dbo.Usuarios', 'id_usuario') IS NULL
BEGIN
  ;THROW 51000, 'La tabla Usuarios existente no tiene la columna requerida id_usuario.', 1;
END;
IF COL_LENGTH('dbo.Usuarios', 'nombre') IS NULL OR COL_LENGTH('dbo.Usuarios', 'apellido') IS NULL
   OR COL_LENGTH('dbo.Usuarios', 'correo') IS NULL OR COL_LENGTH('dbo.Usuarios', 'rol') IS NULL
   OR COL_LENGTH('dbo.Usuarios', 'activo') IS NULL OR COL_LENGTH('dbo.Usuarios', 'fecha_registro') IS NULL
BEGIN
  ;THROW 51001, 'La tabla Usuarios existente no cumple el esquema requerido por PolyThesis.', 1;
END;
IF COL_LENGTH('dbo.Proyectos', 'id_proyecto') IS NULL OR COL_LENGTH('dbo.Proyectos', 'id_estudiante') IS NULL
   OR COL_LENGTH('dbo.Proyectos', 'id_tutor') IS NULL
BEGIN
  ;THROW 51002, 'La tabla Proyectos existente no cumple el esquema requerido por PolyThesis.', 1;
END;
IF COL_LENGTH('dbo.Actividades', 'id_actividad') IS NULL OR COL_LENGTH('dbo.Actividades', 'numero_semana') IS NULL
   OR COL_LENGTH('dbo.Actividades', 'estado') IS NULL
BEGIN
  ;THROW 51003, 'La tabla Actividades existente no cumple el esquema requerido por PolyThesis.', 1;
END;
IF COL_LENGTH('dbo.Entregas', 'id_entrega') IS NULL OR COL_LENGTH('dbo.Entregas', 'id_actividad') IS NULL
   OR COL_LENGTH('dbo.Entregas', 'id_estudiante') IS NULL
BEGIN
  ;THROW 51004, 'La tabla Entregas existente no cumple el esquema requerido por PolyThesis.', 1;
END;
GO
