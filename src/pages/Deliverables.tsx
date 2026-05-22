import { useStore } from '../store/useStore';
import { CheckCircle, Circle, Clock, AlertTriangle } from 'lucide-react';

export function Deliverables() {
  const { project, markDeliverableComplete } = useStore();
  const weeks = project.weeks;
  
  const completedWeeks = weeks.filter(w => w.status === 'completado');
  const inProgressWeeks = weeks.filter(w => w.status === 'en_progreso');
  const pendingWeeks = weeks.filter(w => w.status === 'pendiente');
  const delayedWeeks = weeks.filter(w => w.status === 'atrasado');
  
  const totalDeliverables = weeks.reduce((acc, w) => acc + w.deliverables.length, 0);
  const completedDeliverables = weeks.reduce(
    (acc, w) => acc + w.deliverables.filter(d => d.completed).length, 
    0
  );
  
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Entregables</h1>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">{completedDeliverables}</p>
            <p className="text-sm text-text-muted">Completados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{inProgressWeeks.length}</p>
            <p className="text-sm text-text-muted">En Progreso</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text-muted">{pendingWeeks.length}</p>
            <p className="text-sm text-text-muted">Pendientes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-error">{delayedWeeks.length}</p>
            <p className="text-sm text-text-muted">Atrasados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">{totalDeliverables}</p>
            <p className="text-sm text-text-muted">Total</p>
          </div>
        </div>
      </div>
      
      {/* Deliverables by Week */}
      <div className="space-y-4">
        {weeks.map(week => (
          <div key={week.id} className="bg-white rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  week.status === 'completado' ? 'bg-success text-white' :
                  week.status === 'en_progreso' ? 'bg-primary text-white' :
                  week.status === 'atrasado' ? 'bg-error text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {week.id}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{week.title}</h3>
                  <p className="text-sm text-text-muted">{week.percentage}% completado</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {week.status === 'completado' && <CheckCircle className="w-5 h-5 text-success" />}
                {week.status === 'en_progreso' && <Clock className="w-5 h-5 text-primary" />}
                {week.status === 'atrasado' && <AlertTriangle className="w-5 h-5 text-error" />}
                {week.status === 'pendiente' && <Circle className="w-5 h-5 text-gray-400" />}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  week.status === 'completado' ? 'bg-success/10 text-success' :
                  week.status === 'en_progreso' ? 'bg-primary/10 text-primary' :
                  week.status === 'atrasado' ? 'bg-error/10 text-error' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {week.status === 'completado' ? 'Completado' :
                   week.status === 'en_progreso' ? 'En Progreso' :
                   week.status === 'atrasado' ? 'Atrasado' : 'Pendiente'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              {week.deliverables.map(deliverable => (
                <div 
                  key={deliverable.id} 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <button
                    onClick={() => markDeliverableComplete(week.id, deliverable.id)}
                    className="flex-shrink-0"
                  >
                    {deliverable.completed ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 hover:text-primary transition-colors" />
                    )}
                  </button>
                  <span className={`flex-1 ${
                    deliverable.completed ? 'text-text-secondary line-through' : 'text-text-primary'
                  }`}>
                    {deliverable.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}