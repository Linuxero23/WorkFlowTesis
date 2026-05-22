import { CheckCircle, Circle, Clock, AlertTriangle } from 'lucide-react';
import { Week } from '../types';
import { getWeekStatusColor, getWeekStatusLabel } from '../utils/progress';

interface WeekCardProps {
  week: Week;
  isCurrentWeek: boolean;
  onMarkComplete?: () => void;
  onObservationChange?: (observation: string) => void;
}

export function WeekCard({ week, isCurrentWeek, onMarkComplete, onObservationChange }: WeekCardProps) {
  const getStatusIcon = () => {
    switch (week.status) {
      case 'completado':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'en_progreso':
        return <Clock className="w-5 h-5 text-primary" />;
      case 'atrasado':
        return <AlertTriangle className="w-5 h-5 text-error" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };
  
  const completedDeliverables = week.deliverables.filter(d => d.completed).length;
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 ${isCurrentWeek ? 'border-primary' : 'border-transparent'} p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
            {week.id}
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{week.title}</h3>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getWeekStatusColor(week.status)}`}>
              {getWeekStatusLabel(week.status)}
            </span>
          </div>
        </div>
        {getStatusIcon()}
      </div>
      
      <p className="text-sm text-text-secondary mb-3">{week.description}</p>
      
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-text-muted">Entregables</span>
          <span className="font-medium text-text-primary">{completedDeliverables}/{week.deliverables.length}</span>
        </div>
        <div className="space-y-2">
          {week.deliverables.map(deliverable => (
            <div key={deliverable.id} className="flex items-center gap-2 text-sm">
              {deliverable.completed ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300" />
              )}
              <span className={deliverable.completed ? 'text-text-secondary line-through' : 'text-text-primary'}>
                {deliverable.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-text-muted">Avance</span>
          <span className="font-semibold text-primary">{week.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${week.percentage}%` }}
          />
        </div>
      </div>
      
      {week.observation && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
          <span className="font-medium text-text-muted">Observación: </span>
          <span className="text-text-secondary">{week.observation}</span>
        </div>
      )}
      
      {week.tutorFeedback && (
        <div className="mb-3 p-2 bg-primary/5 rounded text-sm">
          <span className="font-medium text-primary">Retroalimentación del tutor: </span>
          <span className="text-text-secondary">{week.tutorFeedback}</span>
        </div>
      )}
      
      {week.status !== 'completado' && onMarkComplete && (
        <button
          onClick={onMarkComplete}
          className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors font-medium"
        >
          Marcar semana como completada
        </button>
      )}
    </div>
  );
}