import { useStore } from '../store/useStore';
import { ProgressBar } from '../components/ProgressBar';
import { AlertCard } from '../components/AlertCard';
import { RecommendationCard } from '../components/RecommendationCard';
import { Calendar, Clock, User, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockUsers } from '../data/mockData';

export function DashboardStudent() {
  const { user, project, overallProgress, alerts, recommendations } = useStore();
  
  const tutor = mockUsers.find(u => u.id === project.tutorId);
  
  // Obtener próximas tareas (próximas 2 semanas)
  const upcomingWeeks = project.weeks
    .filter(w => w.id >= project.currentWeek && w.id <= project.currentWeek + 2)
    .slice(0, 3);
  
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          ¡Bienvenido, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-white/80">
          Este es tu panel de seguimiento de tesis. Aquí verás tu progreso y las tareas pendientes.
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-text-muted">Proyecto</span>
          </div>
          <p className="font-semibold text-text-primary line-clamp-2">{project.title}</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-text-muted">Tutor</span>
          </div>
          <p className="font-semibold text-text-primary">{tutor?.name || 'No asignado'}</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="w-5 h-5 text-warning" />
            </div>
            <span className="text-sm text-text-muted">Semana Actual</span>
          </div>
          <p className="font-semibold text-text-primary">Semana {project.currentWeek} de 16</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-text-muted">Estado</span>
          </div>
          <p className="font-semibold text-success">En Progreso</p>
        </div>
      </div>
      
      {/* Progress Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Progreso General</h2>
        <ProgressBar progress={overallProgress} size="lg" />
      </div>
      
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Alertas</h2>
          <div className="space-y-3">
            {alerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Próximas Tareas</h2>
            <Link to="/workflow" className="text-sm text-primary hover:text-primary-dark flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingWeeks.map(week => (
              <div key={week.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {week.id}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{week.title}</p>
                  <p className="text-sm text-text-muted">{week.deliverables.length} entregables</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  week.status === 'en_progreso' ? 'bg-primary/10 text-primary' :
                  week.status === 'completado' ? 'bg-success/10 text-success' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {week.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recommendations */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Recomendaciones</h2>
            <Link to="/recommendations" className="text-sm text-primary hover:text-primary-dark flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recommendations.slice(0, 3).map(rec => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/workflow"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <p className="font-medium text-text-primary">Ver Workflow</p>
              <p className="text-sm text-text-muted">16 semanas</p>
            </div>
          </Link>
          <Link
            to="/deliverables"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <p className="font-medium text-text-primary">Entregables</p>
              <p className="text-sm text-text-muted">Ver pendientes</p>
            </div>
          </Link>
          <Link
            to="/notifications"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Clock className="w-8 h-8 text-primary" />
            <div>
              <p className="font-medium text-text-primary">Notificaciones</p>
              <p className="text-sm text-text-muted">Ver mensajes</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}