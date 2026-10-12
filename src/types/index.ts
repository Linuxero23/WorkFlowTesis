// Tipos de la aplicación

export type Role = 'estudiante' | 'profesor' | 'coordinador' | 'administrador';

export type WeekStatus = 'pendiente' | 'en_progreso' | 'completado' | 'atrasado';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  token?: string;
  avatar?: string;
}

export interface Deliverable {
  id: string;
  name: string;
  completed: boolean;
}

export interface Week {
  id: number;
  title: string;
  description: string;
  deliverables: Deliverable[];
  status: WeekStatus;
  percentage: number;
  observation?: string;
  tutorFeedback?: string;
}

export interface Project {
  id: string;
  title: string;
  studentId: string;
  tutorId: string;
  startDate: string;
  currentWeek: number;
  weeks: Week[];
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  weekId?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
}

export interface Recommendation {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  category: 'urgente' | 'bibliografia' | 'metodologia' | 'final';
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  projectTitle: string;
  overallProgress: number;
  currentWeek: number;
  alerts: Alert[];
  lastUpdate: string;
}

export interface AcademicProject {
  id_proyecto: number;
  id_grupo: number | null;
  titulo: string;
  descripcion?: string;
  id_estudiante: number;
  id_tutor: number;
  estudiante_nombre: string;
  tutor_nombre: string;
  total_actividades: number;
  actividades_completadas: number;
  progreso: number;
}

export interface Activity {
  id_actividad: number;
  id_proyecto: number;
  numero_semana: number;
  titulo: string;
  descripcion?: string;
  fecha_inicio?: string;
  fecha_limite?: string;
  estado: 'PENDIENTE' | 'EN_PROGRESO' | 'EN_REVISION' | 'COMPLETADA' | 'ATRASADA';
  bloqueada: boolean;
  es_semana_base: boolean;
}

export type IndividualDeliveryStatus =
  | 'NO_ENTREGADO'
  | 'ENVIADA'
  | 'EN_REVISION'
  | 'REQUIERE_CORRECCION'
  | 'APROBADA'
  | 'RECHAZADA';

export interface StudentActivityProgress {
  id_actividad: number;
  numero_semana: number;
  titulo: string;
  descripcion?: string;
  fecha_inicio?: string | null;
  fecha_limite?: string | null;
  estado_actividad: Activity['estado'];
  bloqueada: boolean;
  es_semana_base: boolean;
  id_entrega: number | null;
  estado_entrega: string | null;
  calificacion: number | null;
  fecha_entrega: string | null;
  comentario_estudiante: string | null;
  nombre_archivo: string | null;
  url_externa: string | null;
  retroalimentacion: string | null;
  fecha_retroalimentacion: string | null;
  aprobada: boolean;
}

export interface StudentAcademicProgress {
  id_usuario: number;
  id_grupo: number | null;
  nombre: string;
  apellido: string;
  correo: string;
  aprobadas: number;
  total_actividades: number;
  progreso: number;
  entregas_pendientes: number;
  entregas_revisadas: number;
  proxima_actividad: {
    id_actividad: number;
    numero_semana: number;
    titulo: string;
    fecha_limite: string | null;
  } | null;
  ultima_retroalimentacion: {
    texto: string;
    fecha: string;
    numero_semana: number;
  } | null;
  semanas: StudentActivityProgress[];
}

export interface Delivery {
  id_entrega: number;
  id_actividad: number;
  id_estudiante: number;
  comentario_estudiante?: string;
  url_externa?: string;
  nombre_archivo?: string;
  ruta_archivo?: string;
  estado_revision: string;
  calificacion?: number;
  fecha_entrega: string;
  estudiante_nombre?: string;
  retroalimentacion?: string | null;
  tipo_retroalimentacion?: string | null;
  fecha_retroalimentacion?: string | null;
}

export interface Message {
  id_mensaje: number;
  id_emisor: number;
  id_receptor: number;
  mensaje?: string;
  archivo_url?: string;
  leido: boolean;
  fecha_creacion: string;
}

export interface DirectoryUser {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  activo: boolean;
  fecha_registro: string;
  grupos_tutorizados?: number;
  estudiantes_asignados?: number;
  tutor_nombre?: string;
  proyecto_titulo?: string;
  grupos_activos?: number;
}

export interface CoordinatorStats {
  total_estudiantes: number;
  total_profesores: number;
  grupos_activos: number;
  estudiantes_sin_grupo: number;
  notificaciones_pendientes: number;
}

export interface WorkGroup {
  id_grupo: number;
  nombre: string;
  id_profesor: number;
  profesor_nombre: string;
  activo: boolean;
  fecha_creacion: string;
  cantidad_estudiantes: number;
  estudiantes?: DirectoryUser[];
}

export interface AcademicAccess {
  hasActiveGroup: boolean;
  role: string;
  group: { id_grupo: number; nombre: string; id_profesor: number; tutor_nombre: string } | null;
}

export interface ConversationSummary {
  id_conversacion: number;
  tipo: 'DIRECTA' | 'GRUPO';
  id_grupo?: number;
  nombre: string;
  ultimo_mensaje?: string;
  fecha_ultimo_mensaje?: string;
  no_leidos: number;
}