// Tipos de la aplicación

export type Role = 'estudiante' | 'profesor' | 'coordinador';

export type WeekStatus = 'pendiente' | 'en_progreso' | 'completado' | 'atrasado';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
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