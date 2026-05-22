# SPEC.md - Sistema de Seguimiento de Tesis/Trabajos de Grado

## 1. Project Overview

**Project Name:** PolyThesis - Sistema de Seguimiento de Trabajos de Grado

**Project Type:** Web Application (SPA)

**Core Functionality:** Plataforma web para el seguimiento de trabajos de grado/tesis para estudiantes y docentes del Politécnico Grancolombiano. Permite gestionar el avance de 16 semanas, con alertas inteligentes y recomendaciones automáticas.

**Target Users:**
- Estudiantes (principal)
- Profesores/Tutores
- Coordinadores

---

## 2. UI/UX Specification

### Layout Structure

**App Shell:**
- Sidebar fija a la izquierda (240px width)
- Navbar superior (64px height)
- Contenido principal con padding de 24px
- Footer opcional en algunas vistas

**Responsive Breakpoints:**
- Mobile: < 768px (sidebar colapsa a menú hamburguesa)
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Visual Design

**Color Palette:**
- Primary Dark: #003B5C (sidebar, headers)
- Primary: #005DAA (botones principales, acentos)
- Primary Light: #0077C0
- White: #FFFFFF
- Background: #F4F6F8
- Text Primary: #1A1A2E
- Text Secondary: #4A4A4A
- Text Muted: #6B7280
- Success: #22C55E
- Warning: #F59E0B
- Error: #EF4444
- Info: #3B82F6
- Border: #E5E7EB

**Typography:**
- Font Family: 'Inter', system-ui, sans-serif
- Headings:
  - H1: 32px, font-weight 700
  - H2: 24px, font-weight 600
  - H3: 20px, font-weight 600
  - H4: 16px, font-weight 600
- Body: 14px, font-weight 400
- Small: 12px, font-weight 400

**Spacing System:**
- Base unit: 4px
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px

**Visual Effects:**
- Card shadows: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
- Hover shadows: 0 4px 6px rgba(0,0,0,0.1)
- Border radius: 8px (cards), 6px (buttons), 4px (inputs)
- Transitions: 150ms ease-in-out

### Components

**1. Sidebar:**
- Logo institucional en header
- Navigation items con iconos
- Items activos con highlight azul
- User info en footer
- Cerrar sesión

**2. Navbar:**
- Breadcrumb o título de página
- Usuario actual con avatar
- Rol badge
- Notificaciones (icono)

**3. ProgressBar:**
- Barra grande visual (altura 24px)
- Porcentaje texto dentro
- Colores según estado (verde > 75%, amarillo 50-75%, rojo < 50%)

**4. AlertCard:**
- Icono según tipo (warning/error/info)
- Título y descripción
- Color de borde según tipo
- Botón de acción opcional

**5. WeekCard:**
- Número de semana
- Título y descripción
- Lista de entregables con checkboxes
- Estado badge
- Porcentaje
- Campo de observación
- Botón para completar

**6. RoleBadge:**
- Colores según rol:
  - Estudiante: #005DAA
  - Profesor: #7C3AED
  - Coordinador: #059669

**7. RecommendationCard:**
- Icono de luz/idea
- Recomendación text
- Prioridad indicator

---

## 3. Functionality Specification

### Core Features

**1. Authentication (Simulated):**
- Login page con selector de rol
- Validación de email: debe terminar en @poligran.edu.co
- Sesión guardada en localStorage
- Logout limpia sesión

**2. Dashboard Estudiante:**
- Información del proyecto (título, tutor)
- Semana actual del workflow
- Porcentaje general de avance
- Barra de progreso visual
- Alertas (si aplica)
- Próximas tareas (próximas 2 semanas)
- Recomendaciones automáticas

**3. Workflow de 16 Semanas:**
- Vista de timeline con las 16 semanas
- Click en semana para ver detalles
- Cada semana tiene:
  - Título
  - Descripción
  - Entregables (lista)
  - Estado (pendiente/en progreso/completado/atrasado)
  - Porcentaje
  - Bitácora/observación
  - Retroalimentación del tutor

**4. Sistema de Alertas:**
- Alerta amarilla: avance < 25% después de semana 4
- Alerta roja: avance < 50% después de semana 8
- Semana anterior no completada = atrasada
- Mensaje: "Debes contactar a tu tutor para revisar el avance."
- Notificación simulada al profesor

**5. Dashboard Profesor:**
- Lista de estudiantes asignados
- Ver avance individual
- Ver alertas de atraso
- Ver entregables pendientes
- Enviar retroalimentación (simulada)
- Panel de notificaciones

**6. Recomendaciones Automáticas:**
- Si atrasado: "Prioriza los entregables de la semana actual y agenda reunión con tu tutor."
- Si falta bibliografía: "Agrega fuentes académicas en formato APA o IEEE."
- Si falta metodología: "Define fases, herramientas, pruebas y validación."
- Si cerca de semana 16: "Revisa conclusiones, informe final y retrospectiva."

### Data Handling

- Mock data en memoria (mockData.ts)
- Persistencia en localStorage
- Estados gestionados con Zustand
- No hay backend

### Edge Cases

- Usuario sin sesión → redirigir a login
- Email inválido → mostrar error
- Semana ya completada → no permitir editar estado
- Workflow terminado → mostrar mensaje de felicitación

---

## 4. Acceptance Criteria

### Visual Checkpoints

- [ ] Login se ve profesional con colores institucionales
- [ ] Sidebar azul oscuro (#003B5C) con navegación clara
- [ ] Dashboard muestra barra de progreso grande y visual
- [ ] Las 16 semanas se muestran en timeline
- [ ] Alertas tienen colores apropiados (amarillo/rojo)
- [ ] Cards son limpias con sombras suaves
- [ ] Responsive funciona en mobile

### Functional Checkpoints

- [ ] Login acepta email @poligran.edu.co
- [ ] Login rechaza otros emails
- [ ] Sesión persiste en localStorage
- [ ] Estudiante puede ver su dashboard
- [ ] Estudiante puede navegar workflow
- [ ] Estudiante puede marcar semana como completada
- [ ] Alertas se muestran según reglas
- [ ] Recomendaciones se muestran según estado
- [ ] Profesor puede ver lista de estudiantes
- [ ] Profesor puede ver alertas
- [ ] Logout funciona correctamente

---

## 5. Technical Stack

- React 18 + Vite
- TypeScript
- Tailwind CSS
- React Router DOM
- Zustand (state management)
- Lucide React (iconos)
- Recharts (gráficas opcionales)
- LocalStorage (persistencia)

---

## 6. File Structure

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
│   └── Recommendations.tsx
├── types/
│   └── index.ts
├── utils/
│   ├── progress.ts
│   └── alerts.ts
├── store/
│   └── useStore.ts
└── main.tsx
```