# PoliThesis

PoliThesis (también referido como SynThesis en el proyecto) es una plataforma académica para coordinar y acompañar trabajos de grado durante un flujo de 16 semanas. Centraliza grupos, tutorías, entregas, revisiones, progreso individual, notificaciones y conversaciones en una aplicación web conectada a SQL Server.

## Tecnologías y arquitectura

- **Frontend:** React 18, TypeScript, Vite, React Router, Zustand, Tailwind CSS y Lucide.
- **Backend:** Node.js, Express 5 y TypeScript.
- **Persistencia:** Microsoft SQL Server mediante `mssql`.
- **Autenticación:** JWT firmado por el backend y contraseñas con bcrypt.
- **Archivos:** almacenamiento local en `backend/uploads`, servido únicamente mediante endpoints autenticados.

El navegador consume `/api`; las reglas de roles y acceso a proyectos, grupos, conversaciones y archivos se vuelven a validar en el servidor. SQL Server es la fuente de verdad de los datos académicos. El almacenamiento Zustand conserva la sesión necesaria para el cliente, no sustituye la persistencia académica.

## Roles

- **Coordinador:** consulta directorios, administra profesores y estudiantes, y crea/edita grupos, integrantes y tutor asignado. Al crear un grupo se crean o asocian su proyecto académico y las 16 actividades.
- **Profesor:** consulta sus proyectos y estudiantes asignados, administra la disponibilidad grupal de actividades, revisa entregas y usa notificaciones y chat autorizado.
- **Estudiante:** accede a su progreso y entregas individuales, archivos, calificaciones y retroalimentación, además de las notificaciones y conversaciones en las que participa. Sin grupo activo, las rutas académicas quedan limitadas.
- **Administrador:** rol privilegiado de backend para operaciones administrativas; no se asigna desde el registro público.

El registro público admite únicamente estudiantes y profesores con correo institucional. La asignación de roles coordinador/administrador se realiza mediante un proceso administrativo controlado.

## Funcionalidades principales

- Dashboard diferenciado por rol.
- Gestión de grupos, estudiantes, profesores y tutor asignado.
- Workflow de 16 semanas por proyecto; disponibilidad de entrega compartida y progreso/revisión individual por estudiante.
- Entregas con archivos privados, descarga autenticada, revisión, calificación y retroalimentación.
- Notificaciones persistidas y chat directo/grupal con control de participantes.
- Cierre de sesión por 10 minutos de inactividad en el cliente.

El progreso se calcula a partir de las entregas aprobadas de cada estudiante; aprobar a una persona no completa la semana para el resto del grupo. El módulo **Recomendaciones** es opcional y no forma parte de la fuente de verdad académica. La administración independiente de proyectos (fuera del flujo de creación de grupos) y las integraciones SSO, LMS, correo/push y exportación de reportes no están incluidas.

## Requisitos

- Node.js compatible con los paquetes del proyecto (recomendado Node.js 20 LTS o posterior).
- SQL Server accesible desde el backend.
- Una base de datos vacía o existente compatible con las migraciones. Haz un respaldo antes de aplicar cambios sobre una base con datos.

## Configuración de SQL Server

1. Crea/selecciona la base de datos y configura los valores en `backend/.env`.
2. Ejecuta los scripts completos, en este orden, desde SSMS o una herramienta compatible:
   1. `backend/sql/000_core_schema.sql`
   2. `backend/sql/001_academic_flow.sql`
   3. `backend/sql/002_coordinator_groups.sql`
   4. `backend/sql/003_group_management_and_chat.sql`
   5. `backend/sql/004_academic_workflow.sql`
   6. `backend/sql/005_delivery_grade_compat.sql`
3. `backend/sql/006_historial_activity_types.sql` es una migración adicional para instalaciones donde exista `CK_Historial_Tipo`; revisa primero sus instrucciones y ejecútala manualmente. No se ejecuta al arrancar la aplicación.

Las migraciones 000–005 son aditivas y están preparadas para repetirse cuando el esquema ya es compatible. No eliminan tablas ni datos. Detén el proceso si una migración informa incompatibilidad o ambigüedad y resuélvela sobre una copia de seguridad; no recrees tablas para eludir el error. Consulta [backend/sql/README.md](./backend/sql/README.md) para detalles.

## Variables de entorno

### Frontend (`.env`)

Copia `.env.example` a `.env`:

| Variable | Uso |
|---|---|
| `VITE_API_URL` | URL base del API, por defecto `http://localhost:3000/api`. |

### Backend (`backend/.env`)

Copia `backend/.env.example` a `backend/.env` y completa los valores locales:

| Variable | Uso |
|---|---|
| `PORT` | Puerto HTTP del backend (por defecto 3000). |
| `CORS_ORIGINS` | Lista separada por comas de orígenes frontend autorizados. Obligatoria en producción. |
| `JWT_SECRET` | Secreto local aleatorio de al menos 32 caracteres; nunca lo publiques. |
| `JWT_EXPIRES_IN_SECONDS` | Duración máxima del JWT; el ejemplo usa 8 horas. |
| `DB_SERVER`, `DB_PORT`, `DB_DATABASE` | Dirección, puerto y base de SQL Server. |
| `DB_USER`, `DB_PASSWORD` | Credenciales de SQL Server con permisos mínimos necesarios. |
| `DB_ENCRYPT` | Habilita cifrado de la conexión SQL (en producción debe ser `true`). |
| `DB_TRUST_SERVER_CERTIFICATE` | Confianza del certificado SQL; en producción debe ser `false`. |

Genera el secreto localmente sin incluirlo en el repositorio:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

No hay contraseñas de demostración publicadas ni cuentas iniciales garantizadas en una instalación limpia. Crea cuentas desde el registro y asigna roles privilegiados mediante el procedimiento administrativo autorizado. Nunca guardes contraseñas en README, scripts, commits o capturas.

## Instalación y ejecución

Desde la raíz, instala y arranca el frontend:

```powershell
npm install
npm run dev
```

En otra terminal, instala y arranca el backend:

```powershell
cd backend
npm install
npm run dev
```

El frontend queda disponible normalmente en `http://localhost:5173`; el API en `http://localhost:3000`. La comprobación de salud pública es `GET /api/health`; el resto de endpoints requiere JWT.

Para validar o iniciar en producción:

```powershell
# Desde la raíz
npm run build
npm run preview

# Desde backend
npm run build
npm start
```

## Seguridad y sesión

- JWT firmado/verificado por el servidor; el ID y el rol autenticados no se aceptan desde headers de identidad del cliente.
- Contraseñas con bcrypt; el registro público rechaza roles privilegiados.
- CORS restringido a `CORS_ORIGINS`; SQL parametrizado y controles de acceso por recurso.
- Archivos privados: descarga por endpoints autenticados, con autorización y validación de ruta; no se publica `uploads`.
- Las rutas privadas requieren token vigente. El frontend cierra la sesión tras 10 minutos sin actividad; el token tiene además la expiración configurada por `JWT_EXPIRES_IN_SECONDS`.

## Estructura principal

```text
src/
  app/             rutas y arranque React
  components/      layout, navegación y componentes académicos
  hooks/           acceso y carga de datos académicos
  pages/           pantallas por rol y funcionalidad
  store/           estado de sesión/cliente
  utils/           cliente API y notificaciones
backend/
  src/config/      entorno y conexión SQL Server
  src/modules/     auth, usuarios, grupos, proyectos, actividades,
                   entregas, archivos, notificaciones, chat y feedback
  sql/             migraciones ordenadas
  uploads/         archivos privados gestionados por el backend
```

## Comprobaciones de desarrollo

```powershell
# Raíz
npm run build
cd backend
npm run build
```

El script `npm run lint` está declarado, pero ESLint 9 requiere un archivo
`eslint.config.js` que aún no está incluido; no se considera una validación
disponible hasta configurar ese archivo.

Las funciones de correo/push, SSO institucional, LMS, reportes y administración independiente de proyectos requieren trabajo adicional antes de considerarlas parte de una entrega productiva.
