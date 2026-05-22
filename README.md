# PolyThesis - Sistema de Seguimiento de Trabajos de Grado

![PolyThesis](https://img.shields.io/badge/PolyThesis-v1.0.0-blue)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3-blue)

Plataforma web para el seguimiento de trabajos de grado/tesis para estudiantes y docentes del Politécnico Grancolombiano. Permite gestionar el avance de 16 semanas, con alertas inteligentes y recomendaciones automáticas.

## 📋 Descripción

PolyThesis es un prototipo funcional que simula una plataforma institucional de seguimiento de proyectos de grado. El sistema permite:

- **Para Estudiantes:** Visualizar el avance de su proyecto, seguir el workflow de 16 semanas, marcar entregables como completados, recibir alertas de atraso y obtener recomendaciones personalizadas.

- **Para Profesores:** Supervisar múltiples estudiantes, ver el avance individual, recibir alertas de estudiantes en riesgo, y enviar retroalimentación.

- **Para Coordinadores:** Vista general de todos los proyectos y estudiantes.

## 🛠️ Tecnologías Usadas

| Tecnología | Propósito |
|------------|-----------|
| React 18 | Framework principal |
| Vite | Build tool y servidor de desarrollo |
| TypeScript | Tipado estático |
| Tailwind CSS | Estilos y diseño responsivo |
| React Router | Navegación entre páginas |
| Zustand | Gestión de estado global |
| Lucide React | Iconos |
| Recharts | Gráficas (opcional) |
| LocalStorage | Persistencia de datos |

## 🚀 Cómo Instalar

```bash
# Clonar el repositorio o copiar los archivos
cd polythesis

# Instalar dependencias
npm install
```

## ▶️ Cómo Ejecutar

```bash
# Iniciar el servidor de desarrollo
npm run dev
```

El proyecto se abrirá en `http://localhost:5173`

## 👤 Cuentas de Demo

| Rol | Correo | Contraseraseña |
|-----|--------|-----------------|
| Estudiante | `juan.perez@poligran.edu.co` | cualquier cosa |
| Profesor | `maria.lopez@poligran.edu.co` | cualquier cosa |
| Coordinador | `roberto.castro@poligran.edu.co` | cualquier cosa |

**Nota:** La contraseña no se valida. Solo el correo debe terminar en `@poligran.edu.co`.

## 📅 Flujo de 16 Semanas

| Semana | Título | Descripción |
|--------|--------|-------------|
| 1 | Inicio y Formalización | Inicio, formalización, asignación, lluvia de ideas |
| 2 | Anteproyecto Parte 1 | Título, alcance, contexto del problema |
| 3 | Anteproyecto Parte 2 | Justificación, objetivo general, objetivos específicos |
| 4 | Anteproyecto Parte 3 | Bibliografía, cronograma, entregables, formato completo |
| 5 | Marco Teórico | Desarrollo del marco teórico |
| 6 | Requerimientos Parte 1 | Análisis de requerimientos funcionales |
| 7 | Requerimientos Parte 2 | Análisis de requerimientos no funcionales |
| 8 | Diseño de Solución | Mockups y arquitectura |
| 9 | Desarrollo Propuesta Tecnológica | Actualización del diseño |
| 10 | Arquitectura de Software | Arquitectura de software, datos y comunicaciones |
| 11 | Documentación Arquitectura | Documentación completa |
| 12 | Documentación Pruebas | Documentación de pruebas |
| 13 | Ejecución de Pruebas | Ejecución de pruebas del sistema |
| 14 | Documentación de Pruebas | Resultados de pruebas |
| 15 | Conclusión del Proyecto | Conclusiones y recomendaciones |
| 16 | Informe Final y Retrospectiva | Informe final completo |

## ⚠️ Alertas Inteligentes

El sistema genera alertas automáticamente según las siguientes reglas:

- **Alerta Amarilla:** Si el avance general está por debajo del 25% después de la semana 4.
- **Alerta Roja:** Si el avance general está por debajo del 50% después de la semana 8.
- **Semana Atrasada:** Si una semana anterior no está completada, se marca como atrasada.
- **Mensaje:** "Debes contactar a tu tutor para revisar el avance."

## 💡 Recomendaciones Automáticas

El sistema muestra recomendaciones según el estado del proyecto:

- Si está atrasado: "Prioriza los entregables de la semana actual y agenda reunión con tu tutor."
- Si falta bibliografía: "Agrega fuentes académicas en formato APA o IEEE."
- Si falta metodología: "Define fases, herramientas, pruebas y validación."
- Si está cerca de semana 16: "Revisa conclusiones, informe final y retrospectiva."

## 🎨 Diseño

El diseño sigue la identidad visual del Politécnico Grancolombiano:

- **Colores:**
  - Azul oscuro institucional: `#003B5C`
  - Azul principal: `#005DAA`
  - Blanco: `#FFFFFF`
  - Gris claro: `#F4F6F8`
  - Verde (completado): `#22C55E`
  - Amarillo (alerta): `#F59E0B`
  - Rojo (atraso): `#EF4444`

- **Componentes:**
  - Sidebar azul oscuro
  - Cards limpias con sombras suaves
  - Barra de progreso visual
  - Estados con colores diferenciados
  - Diseño responsivo

## 🔧 Funcionalidades Implementadas

### Estudiante
- [x] Login con validación de email institucional
- [x] Dashboard con información del proyecto
- [x] Barra de progreso visual
- [x] Workflow de 16 semanas
- [x] Marcar entregables como completados
- [x] Sistema de alertas
- [x] Recomendaciones automáticas
- [x] Vista de notificaciones

### Profesor
- [x] Dashboard con lista de estudiantes
- [x] Ver avance individual
- [x] Ver alertas de atraso
- [x] Enviar retroalimentación
- [x] Panel de notificaciones

## 📝 Lo que Se Implementaría en Producción

- **Backend:** API REST con Node.js/Express o NestJS
- **Base de Datos:** PostgreSQL o MongoDB
- **Autenticación:** Microsoft Azure AD o Google Workspace
- **Notificaciones:** Correo electrónico, push notifications
- **Integración:** Conexión con LMS (Canvas, Moodle)
- **Reportes:** Exportar a PDF/Excel
- **Validaciones:** Formularios con validación robusta
- **Seguridad:** JWT, HTTPS, protección CSRF

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── App.tsx
│   └── router.tsx
├── components/
│   ├── Layout.tsx
│   ├── Sidebar.tsx
│   ├── Navbar.tsx
│   ├── ProgressBar.tsx
│   ├── AlertCard.tsx
│   ├── WeekCard.tsx
│   ├── RoleBadge.tsx
│   └── RecommendationCard.tsx
├── data/
│   └── mockData.ts
├── pages/
│   ├── Login.tsx
│   ├── DashboardStudent.tsx
│   ├── DashboardProfessor.tsx
│   ├── Workflow.tsx
│   ├── Deliverables.tsx
│   ├── Notifications.tsx
│   ├── Recommendations.tsx
│   └── Students.tsx
├── types/
│   └── index.ts
├── utils/
│   ├── progress.ts
│   └── alerts.ts
├── store/
│   └── useStore.ts
├── index.css
└── main.tsx
```

## 📄 Licencia

Este proyecto es un prototipo educativo. Todos los derechos reservados al Politécnico Grancolombiano.

---

**Desarrollado con ❤️ para facilitar el seguimiento de trabajos de grado**