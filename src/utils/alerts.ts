import { Alert, Week } from '../types';

export function checkAlerts(weeks: Week[], currentWeek: number, overallProgress: number): Alert[] {
  const alerts: Alert[] = [];
  
  // Alerta si avance < 25% después de semana 4
  if (currentWeek > 4 && overallProgress < 25) {
    alerts.push({
      id: 'alert-progress-1',
      type: 'warning',
      title: 'Avance bajo',
      message: 'Tu avance está por debajo del 25%. Debes contactar a tu tutor para revisar el avance.',
    });
  }
  
  // Alerta si avance < 50% después de semana 8
  if (currentWeek > 8 && overallProgress < 50) {
    alerts.push({
      id: 'alert-progress-2',
      type: 'error',
      title: 'Atraso crítico',
      message: 'Tu avance está por debajo del 50%. Es urgente que contactes a tu tutor.',
    });
  }
  
  // Verificar semanas atrasadas
  weeks.forEach(week => {
    if (week.id < currentWeek && week.status === 'pendiente') {
      alerts.push({
        id: `alert-week-${week.id}`,
        type: 'warning',
        title: `Semana ${week.id} pendiente`,
        message: `La semana ${week.id} (${week.title}) no ha sido completada.`,
        weekId: week.id,
      });
    }
  });
  
  return alerts;
}

export function getAlertColor(type: Alert['type']): string {
  switch (type) {
    case 'error':
      return 'border-error bg-red-50';
    case 'warning':
      return 'border-warning bg-amber-50';
    case 'info':
      return 'border-info bg-blue-50';
    default:
      return 'border-gray-300 bg-gray-50';
  }
}

export function getAlertIconColor(type: Alert['type']): string {
  switch (type) {
    case 'error':
      return 'text-error';
    case 'warning':
      return 'text-warning';
    case 'info':
      return 'text-info';
    default:
      return 'text-gray-500';
  }
}