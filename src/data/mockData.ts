import { Project, User, Notification, Recommendation, Week } from '../types';

// Datos de las 16 semanas del workflow
const createWeeks = (): Week[] => [
  {
    id: 1,
    title: 'Inicio y Formalización',
    description: 'Inicio del proyecto, formalización, asignación de tutor y lluvia de ideas.',
    deliverables: [
      { id: '1-1', name: 'Acta de inicio del proyecto', completed: false },
      { id: '1-2', name: 'Carta de asignación de tutor', completed: false },
      { id: '1-3', name: 'Documento de lluvia de ideas', completed: false },
    ],
    status: 'completado',
    percentage: 100,
    observation: 'Se completó la formalización del proyecto.',
    tutorFeedback: 'Excelente inicio. Continúa así.',
  },
  {
    id: 2,
    title: 'Anteproyecto Parte 1',
    description: 'Título, alcance y contexto del problema.',
    deliverables: [
      { id: '2-1', name: 'Título del proyecto', completed: false },
      { id: '2-2', name: 'Alcance del proyecto', completed: false },
      { id: '2-3', name: 'Contexto del problema', completed: false },
    ],
    status: 'completado',
    percentage: 100,
    observation: 'Título definido: "Sistema de Seguimiento para Trabajos de Grado".',
    tutorFeedback: 'Buen trabajo en la definición del alcance.',
  },
  {
    id: 3,
    title: 'Anteproyecto Parte 2',
    description: 'Justificación, objetivo general y objetivos específicos.',
    deliverables: [
      { id: '3-1', name: 'Justificación del proyecto', completed: false },
      { id: '3-2', name: 'Objetivo general', completed: false },
      { id: '3-3', name: 'Objetivos específicos', completed: false },
    ],
    status: 'completado',
    percentage: 100,
    observation: 'Objetivos bien definidos.',
    tutorFeedback: 'Los objetivos son claros y medibles.',
  },
  {
    id: 4,
    title: 'Anteproyecto Parte 3',
    description: 'Bibliografía, cronograma, entregables y formato anteproyecto completo.',
    deliverables: [
      { id: '4-1', name: 'Bibliografía inicial (mínimo 10 fuentes)', completed: false },
      { id: '4-2', name: 'Cronograma del proyecto', completed: false },
      { id: '4-3', name: 'Formato anteproyecto completo', completed: false },
    ],
    status: 'en_progreso',
    percentage: 70,
    observation: 'Falta completar bibliography y formato final.',
    tutorFeedback: 'Lleva buen ritmo. Completa la bibliografía esta semana.',
  },
  {
    id: 5,
    title: 'Marco Teórico',
    description: 'Desarrollo del marco teórico con bases sólidas.',
    deliverables: [
      { id: '5-1', name: 'Estado del arte', completed: false },
      { id: '5-2', name: 'Marco conceptual', completed: false },
      { id: '5-3', name: 'Marco legal', completed: false },
    ],
    status: 'pendiente',
    percentage: 0,
    observation: '',
  },
  {
    id: 6,
    title: 'Requerimientos Parte 1',
    description: 'Análisis de requerimientos funcionales.',
    deliverables: [
      { id: '6-1', name: 'Actores del sistema', completed: false },
      { id: '6-2', name: 'Casos de uso', completed: false },
      { id: '6-3', name: 'Requerimientos funcionales', completed: false },
    ],
    status: 'pendiente',
    percentage: 0,
    observation: '',
  },
  {
    id: 7,
    title: 'Requerimientos Parte 2',
    description: 'Análisis de requerimientos no funcionales.',
    deliverables: [
      { id: '7-1', name: 'Requerimientos no funcionales', completed: false },
      { id: '7-2', name: 'Restricciones del sistema', completed: false },
      { id: '7-3', name: 'Matriz de trazabilidad', completed: false },
    ],
    status: 'pendiente',
    percentage: 0,
    observation: '',
  },
  {
    id: 8,
    title: 'Diseño de Solución',
    description: 'Mockups y arquitectura del sistema.',
    deliverables: [
      { id: '8-1', name: 'Mockups de interfaces', completed: false },
      { id: '8-2', name: 'Arquitectura general', completed: false },
      { id: '8-3', name: 'Diagrama de componentes', completed: false },
    ],
    status: 'pendiente',
    percentage: 0,
    observation: '',
  },
  {
    id: 9,
    title: 'Desarrollo Propuesta Tecnológica',
    description: 'Actualización del diseño y arquitectura.',
    deliverables: [
      { id: '9-1', name: 'Diseño detallado', completed: false },
      { id: '9-2', name: 'Especificación técnica', completed: false },
      { id: '9-3', name: 'Plan de implementación', completed: false },
    ],
    status: 'pendiente',
    percentage: 0,
    observation: '',
  },
  {
    id: 10,
    title: 'Arquitectura de Software',
    description: 'Arquitectura de software, datos y comunicaciones.',
    deliverables: [
      { id: '10-1', name: 'Arquitectura de software', completed: false },
      { id: '10-2', name: 'Modelo de datos', completed: false },
      { id: '10-3', name: 'Diseño de API', completed: false },
    ],
    status: 'pendiente',
    percentage: 0,
    observation: '',
  },
  {
    id: 11,
    title: 'Documentación Arquitectura',
    description: 'Documentación completa de la arquitectura.',
    deliverables: [
      { id: '11-1', name: 'Documento de arquitectura', completed: false },
      { id: '11-2', name: 'Manual de usuario preliminar', completed: false },
      { id: '11-3', name: 'Guía de instalación', completed: false },
    ],
    status: 'pendiente',
    percentage: 0,
    observation: '',
  },
  {
    id: 12,
    title: 'Documentación Pruebas',
    description: 'Documentación de pruebas de desarrollo.',
    deliverables: [
      { id: '12-1', name: 'Plan de pruebas', completed: false },
      { id: '12-2', name: 'Casos de prueba', completed: false },
      { id: '12-3', name: 'Resultados de pruebas unitarias', completed: false },
    ],
    status: 'pendiente',
    percentage: 0,
    observation: '',
  },
  {
    id: 13,
    title: 'Ejecución de Pruebas',
    description: 'Ejecución de pruebas del sistema.',
    deliverables: [
      { id: '13-1', name: 'Pruebas de integración', completed: false },
      { id: '13-2', name: 'Pruebas de sistema', completed: false },
      { id: '13-3', name: 'Pruebas de aceptación', completed: false },
    ],
    status: 'pendiente',
    percentage: 0,
    observation: '',
  },
  {
    id: 14,
    title: 'Documentación de Pruebas',
    description: 'Documentación completa de resultados de pruebas.',
    deliverables: [
      { id: '14-1', name: 'Informe de pruebas', completed: false },
      { id: '14-2', name: 'Corrección de errores', completed: false },
      { id: '14-3', name: 'Certificado de pruebas', completed: false },
    ],
    status: 'pendiente',
    percentage: 0,
    observation: '',
  },
  {
    id: 15,
    title: 'Conclusión del Proyecto',
    description: 'Conclusiones y recomendaciones finales.',
    deliverables: [
      { id: '15-1', name: 'Conclusiones del proyecto', completed: false },
      { id: '15-2', name: 'Recomendaciones', completed: false },
      { id: '15-3', name: 'Trabajo futuro', completed: false },
    ],
    status: 'pendiente',
    percentage: 0,
    observation: '',
  },
  {
    id: 16,
    title: 'Informe Final y Retrospectiva',
    description: 'Informe final completo y retrospectiva del proyecto.',
    deliverables: [
      { id: '16-1', name: 'Informe final completo', completed: false },
      { id: '16-2', name: 'Retrospectiva del proyecto', completed: false },
      { id: '16-3', name: 'Entrega de código fuente', completed: false },
    ],
    status: 'pendiente',
    percentage: 0,
    observation: '',
  },
];

// Proyecto mock
export const mockProject: Project = {
  id: 'proj-1',
  title: 'Sistema de Seguimiento para Trabajos de Grado',
  studentId: 'user-1',
  tutorId: 'prof-1',
  startDate: '2026-01-15',
  currentWeek: 4,
  weeks: createWeeks(),
};

// Usuarios mock
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Juan Pérez García',
    email: 'juan.perez@poligran.edu.co',
    role: 'estudiante',
  },
  {
    id: 'prof-1',
    name: 'Dra. María López',
    email: 'maria.lopez@poligran.edu.co',
    role: 'profesor',
  },
  {
    id: 'user-2',
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@poligran.edu.co',
    role: 'estudiante',
  },
  {
    id: 'user-3',
    name: 'Ana Martínez',
    email: 'ana.martinez@poligran.edu.co',
    role: 'estudiante',
  },
  {
    id: 'user-4',
    name: 'Luis Fernando Gómez',
    email: 'luis.gomez@poligran.edu.co',
    role: 'estudiante',
  },
  {
    id: 'prof-2',
    name: 'Dr. Pedro Sánchez',
    email: 'pedro.sanchez@poligran.edu.co',
    role: 'profesor',
  },
  {
    id: 'coord-1',
    name: 'Coord. Roberto Castro',
    email: 'roberto.castro@poligran.edu.co',
    role: 'coordinador',
  },
];

// Notificaciones mock
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'Nueva retroalimentación',
    message: 'Tu tutor ha dejado comentarios en la Semana 4.',
    date: '2026-04-22',
    read: false,
    type: 'info',
  },
  {
    id: 'notif-2',
    title: 'Recordatorio de entrega',
    message: 'Recuerda completar los entregables de la Semana 4 antes del viernes.',
    date: '2026-04-21',
    read: true,
    type: 'warning',
  },
  {
    id: 'notif-3',
    title: 'Proyecto aprobado',
    message: 'Tu anteproyecto ha sido aprobado por el comité.',
    date: '2026-04-15',
    read: true,
    type: 'success',
  },
];

// Recomendaciones mock
export const mockRecommendations: Recommendation[] = [
  {
    id: 'rec-1',
    text: 'Prioriza los entregables de la semana actual y agenda reunión con tu tutor.',
    priority: 'high',
    category: 'urgente',
  },
  {
    id: 'rec-2',
    text: 'Agrega fuentes académicas en formato APA o IEEE para el marco teórico.',
    priority: 'medium',
    category: 'bibliografia',
  },
  {
    id: 'rec-3',
    text: 'Define claramente las fases, herramientas, pruebas y validación.',
    priority: 'medium',
    category: 'metodologia',
  },
];

// Lista de estudiantes para el profesor
export const mockStudentProgress = [
  {
    studentId: 'user-1',
    studentName: 'Juan Pérez García',
    projectTitle: 'Sistema de Seguimiento para Trabajos de Grado',
    overallProgress: 25,
    currentWeek: 4,
    alerts: [],
    lastUpdate: '2026-04-22',
  },
  {
    studentId: 'user-2',
    studentName: 'Carlos Rodríguez',
    projectTitle: 'Plataforma de E-learning para Ingeniería',
    overallProgress: 15,
    currentWeek: 4,
    alerts: [
      {
        id: 'alert-1',
        type: 'warning',
        title: 'Avance bajo',
        message: 'El estudiante tiene menos del 25% de avance después de la semana 4.',
      },
    ],
    lastUpdate: '2026-04-20',
  },
  {
    studentId: 'user-3',
    studentName: 'Ana Martínez',
    projectTitle: 'App Móvil de Salud Mental',
    overallProgress: 40,
    currentWeek: 6,
    alerts: [],
    lastUpdate: '2026-04-21',
  },
  {
    studentId: 'user-4',
    studentName: 'Luis Fernando Gómez',
    projectTitle: 'Sistema de IoT para Agricultura',
    overallProgress: 10,
    currentWeek: 4,
    alerts: [
      {
        id: 'alert-2',
        type: 'error',
        title: 'Atraso crítico',
        message: 'El estudiante tiene menos del 25% de avance. Debes contactar al estudiante.',
      },
    ],
    lastUpdate: '2026-04-19',
  },
];

// Funciones helper
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getProjectByStudentId = (studentId: string): Project | undefined => {
  if (mockProject.studentId === studentId) {
    return mockProject;
  }
  return undefined;
};

export const getStudentsByTutorId = (tutorId: string) => {
  return mockStudentProgress.filter(sp => {
    const student = mockUsers.find(u => u.id === sp.studentId);
    return student?.role === 'estudiante';
  });
};