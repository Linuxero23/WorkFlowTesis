# Instalación del esquema PolyThesis

1. Crea una base de datos vacía en SQL Server y configúrala como `DB_DATABASE`.
2. Selecciona esa base de datos en SQL Server Management Studio o en la herramienta de línea de comandos.
3. Ejecuta en orden:
   - `000_core_schema.sql`
   - `001_academic_flow.sql`
   - `002_coordinator_groups.sql`
   - `003_group_management_and_chat.sql`
   - `004_academic_workflow.sql`
   - `005_delivery_grade_compat.sql`

Si la instalación define `CK_Historial_Tipo`, revisa y ejecuta manualmente
`006_historial_activity_types.sql` después de las migraciones anteriores. Esta
migración no se ejecuta automáticamente al arrancar el backend.

Los scripts usan comprobaciones de existencia para poder repetirse y no contienen
operaciones `DROP`, truncado ni borrado de datos. `000_core_schema.sql` crea las
tablas base requeridas por el backend y comprueba columnas esenciales en bases
heredadas. Si una tabla existente no es compatible, detén la migración y adapta
su esquema tras hacer una copia de seguridad; no borres ni recrees la tabla.

`004_academic_workflow.sql` vincula proyectos a grupos, conserva proyectos y
entregas existentes, y asegura una actividad base persistida para cada semana
1–16 de cada proyecto. En grupos con estudiantes y sin proyecto compatible crea
el proyecto durante la migración. Se detendrá revirtiendo la transacción
principal si encuentra grupos activos sin estudiantes o asociaciones de
proyecto ambiguas; resuelve esos casos antes de reintentarla. Puede ejecutarse
de nuevo sin duplicar semanas ni proyectos asociados a un grupo.

`005_delivery_grade_compat.sql` agrega la calificación con rango de 0 a 5 y
adapta el esquema para los mensajes.

`006_historial_activity_types.sql` reemplaza `CK_Historial_Tipo` dentro de una
transacción, incluye las acciones usadas actualmente por el backend y conserva
cualquier tipo que ya esté guardado en el historial. Requiere permiso `ALTER`
en `dbo.HistorialActividad`. Lee el script antes de ejecutarlo en SSMS; si la
base tiene una variante local de la restricción, valida el conjunto de acciones
antes de aplicarlo.

Ejecútala completa desde SSMS (no solo un bloque seleccionado): el `GO` separa
la transacción de alta idempotente de las columnas nuevas de la transacción que
las referencia. Si la segunda transacción falla, sus cambios se revierten; las
columnas estructurales del primer bloque pueden permanecer y el script se puede
volver a ejecutar.

Para nuevas asignaciones, el endpoint de creación de grupo requiere al menos un
estudiante y crea/reutiliza el proyecto y sus actividades semanales en la misma
transacción SQL.

`password_hash` se agrega como nullable únicamente si una tabla `Usuarios`
heredada no lo tenía. Esas cuentas no podrán iniciar sesión hasta recibir un
restablecimiento seguro de contraseña. Las contraseñas nuevas se guardan con
bcrypt.

El registro público permite crear estudiantes y profesores. Para dar el rol
coordinador/administrador a una cuenta, un operador autorizado debe asignarlo
por un proceso administrativo controlado, por ejemplo:

```sql
UPDATE dbo.Usuarios
SET rol = 'COORDINADOR'
WHERE correo = 'cuenta.institucional@poligran.edu.co'
  AND activo = 1;
```

Tras cambiar el rol, los tokens emitidos antes del cambio dejan de ser válidos
y la persona debe iniciar sesión de nuevo.
