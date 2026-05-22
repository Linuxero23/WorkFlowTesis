import { useState } from 'react';
import { useStore } from '../store/useStore';
import { WeekCard } from '../components/WeekCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Workflow() {
  const { project, updateWeek, markDeliverableComplete } = useStore();
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  
  const currentWeek = project.currentWeek;
  const weeks = project.weeks;
  
  const handleMarkComplete = (weekId: number) => {
    // Marcar todos los entregables como completados
    const week = weeks.find(w => w.id === weekId);
    if (week) {
      week.deliverables.forEach(d => {
        markDeliverableComplete(weekId, d.id);
      });
    }
  };
  
  const selectedWeekData = selectedWeek ? weeks.find(w => w.id === selectedWeek) : null;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Workflow de 16 Semanas</h1>
        <p className="text-text-secondary">
          Sigue el avance de tu proyecto de grado semana a semana. Haz clic en una semana para ver los detalles.
        </p>
      </div>
      
      {/* Timeline */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Línea de Tiempo</h2>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {weeks.map(week => (
            <button
              key={week.id}
              onClick={() => setSelectedWeek(week.id)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center transition-all ${
                selectedWeek === week.id
                  ? 'bg-primary text-white'
                  : week.id === currentWeek
                  ? 'bg-primary/20 text-primary border-2 border-primary'
                  : week.status === 'completado'
                  ? 'bg-success/20 text-success'
                  : week.status === 'atrasado'
                  ? 'bg-error/20 text-error'
                  : 'bg-gray-100 text-text-muted hover:bg-gray-200'
              }`}
            >
              <span className="text-xs font-bold">{week.id}</span>
              <span className="text-[10px] mt-0.5">{week.percentage}%</span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
          <span>Semana 1</span>
          <span>Semana 8</span>
          <span>Semana 16</span>
        </div>
      </div>
      
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedWeek(Math.max(1, (selectedWeek || currentWeek) - 1))}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-border hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>
        <span className="text-lg font-semibold text-text-primary">
          {selectedWeek ? `Semana ${selectedWeek}` : `Semana Actual: ${currentWeek}`}
        </span>
        <button
          onClick={() => setSelectedWeek(Math.min(16, (selectedWeek || currentWeek) + 1))}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-border hover:bg-gray-50 transition-colors"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Selected Week Details */}
      {selectedWeekData ? (
        <WeekCard
          week={selectedWeekData}
          isCurrentWeek={selectedWeekData.id === currentWeek}
          onMarkComplete={() => handleMarkComplete(selectedWeekData.id)}
        />
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border text-center py-12">
          <p className="text-text-muted">Selecciona una semana para ver sus detalles</p>
        </div>
      )}
      
      {/* All Weeks Grid */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Todas las Semanas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {weeks.map(week => (
            <div
              key={week.id}
              onClick={() => setSelectedWeek(week.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedWeek === week.id
                  ? 'border-primary bg-primary/5'
                  : week.id === currentWeek
                  ? 'border-primary/50 bg-gray-50'
                  : week.status === 'completado'
                  ? 'border-success/30 bg-success/5'
                  : week.status === 'atrasado'
                  ? 'border-error/30 bg-error/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-text-primary">Semana {week.id}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  week.status === 'completado' ? 'bg-success text-white' :
                  week.status === 'en_progreso' ? 'bg-primary text-white' :
                  week.status === 'atrasado' ? 'bg-error text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {week.percentage}%
                </span>
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">{week.title}</p>
              <p className="text-xs text-text-muted line-clamp-2">{week.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}