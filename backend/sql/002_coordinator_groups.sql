-- PoliThesis / SynesisDB
-- Ejecutar manualmente. No elimina ni recrea tablas existentes.

IF COL_LENGTH('dbo.Actividades', 'bloqueada') IS NULL
BEGIN
  ALTER TABLE dbo.Actividades
    ADD bloqueada BIT NOT NULL
      CONSTRAINT DF_Actividades_Bloqueada DEFAULT (1) WITH VALUES;
END;
GO

IF OBJECT_ID('dbo.GruposTrabajo', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GruposTrabajo (
    id_grupo INT IDENTITY(1,1) NOT NULL
      CONSTRAINT PK_GruposTrabajo PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    id_profesor INT NOT NULL,
    activo BIT NOT NULL
      CONSTRAINT DF_GruposTrabajo_activo DEFAULT (1),
    fecha_creacion DATETIME2 NOT NULL
      CONSTRAINT DF_GruposTrabajo_fecha_creacion DEFAULT (GETDATE()),
    CONSTRAINT FK_GruposTrabajo_Profesor
      FOREIGN KEY (id_profesor) REFERENCES dbo.Usuarios(id_usuario)
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GruposTrabajo_profesor_activo' AND object_id = OBJECT_ID('dbo.GruposTrabajo'))
  CREATE INDEX IX_GruposTrabajo_profesor_activo ON dbo.GruposTrabajo(id_profesor, activo);
GO

IF OBJECT_ID('dbo.GrupoEstudiantes', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GrupoEstudiantes (
    id_grupo INT NOT NULL,
    id_estudiante INT NOT NULL,
    fecha_asignacion DATETIME2 NOT NULL
      CONSTRAINT DF_GrupoEstudiantes_fecha_asignacion DEFAULT (GETDATE()),
    CONSTRAINT PK_GrupoEstudiantes PRIMARY KEY (id_grupo, id_estudiante),
    CONSTRAINT FK_GrupoEstudiantes_Grupo
      FOREIGN KEY (id_grupo) REFERENCES dbo.GruposTrabajo(id_grupo),
    CONSTRAINT FK_GrupoEstudiantes_Estudiante
      FOREIGN KEY (id_estudiante) REFERENCES dbo.Usuarios(id_usuario)
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GrupoEstudiantes_estudiante' AND object_id = OBJECT_ID('dbo.GrupoEstudiantes'))
  CREATE INDEX IX_GrupoEstudiantes_estudiante ON dbo.GrupoEstudiantes(id_estudiante, id_grupo);
GO
