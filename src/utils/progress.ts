import { Week } from '../types';

export function calculateOverallProgress(weeks: Week[]): number {
  if (weeks.length === 0) return 0;
  
  const totalPercentage = weeks.reduce((acc, week) => acc + week.percentage, 0);
  return Math.round(totalPercentage / weeks.length);
}

export function getProgressColor(progress: number): string {
  if (progress >= 75) return 'bg-success';
  if (progress >= 50) return 'bg-warning';
  return 'bg-error';
}

export function getProgressTextColor(progress: number): string {
  if (progress >= 75) return 'text-success';
  if (progress >= 50) return 'text-warning';
  return 'text-error';
}

export function getWeekStatusColor(status: Week['status']): string {
  switch (status) {
    case 'completado':
      return 'bg-success text-white';
    case 'en_progreso':
      return 'bg-primary text-white';
    case 'atrasado':
      return 'bg-error text-white';
    default:
      return 'bg-gray-200 text-gray-700';
  }
}

export function getWeekStatusLabel(status: Week['status']): string {
  switch (status) {
    case 'completado':
      return 'Completado';
    case 'en_progreso':
      return 'En Progreso';
    case 'atrasado':
      return 'Atrasado';
    default:
      return 'Pendiente';
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getCurrentWeekNumber(projectStartDate: string): number {
  const start = new Date(projectStartDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  return Math.min(diffWeeks + 1, 16);
}