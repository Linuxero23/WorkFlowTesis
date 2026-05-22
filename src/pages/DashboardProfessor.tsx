import { useStore } from '../store/useStore';
import { ProgressBar } from '../components/ProgressBar';
import { AlertCard } from '../components/AlertCard';
import { User, FileText, AlertTriangle, Clock, ArrowRight, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockStudentProgress } from '../data/mockData';

export function DashboardProfessor() {
  const { user, notifications } = useStore();
  
  const students = mockStudentProgress;
  const atRiskStudents = students.filter(s => s.alerts.length > 0);
  const pendingDeliverables = students.filter(s => s.overallProgress < 50);
  
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          ¡Bienvenido, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-white/80">
          Este es tu panel de seguimiento de estudiantes. Aquí verás el avance de tus tutorados.
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-text-muted">Estudiantes</span>
          </div>
          <p className="font-semibold text-text-primary text-2xl">{students.length}</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <span className="text-sm text-text-muted">En Riesgo</span>
          </div>
          <p className="font-semibold text-error text-2xl">{atRiskStudents.length}</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileText className="w-5 h-5 text-warning" />
            </div>
            <span className="text-sm text-text-muted">Pendientes</span>
          </div>
          <p className="font-semibold text-warning text-2xl">{pendingDeliverables.length}</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-text-muted">Notificaciones</span>
          </div>
          <p className="font-semibold text-success text-2xl">{notifications.filter(n => !n.read).length}</p>
        </div>
      </div>
      
      {/* At Risk Students */}
      {atRiskStudents.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-error" />
            Estudiantes en Riesgo
          </h2>
          <div className="space-y-3">
            {atRiskStudents.map(student => (
              <div key={student.studentId} className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="w-12 h-12 rounded-full bg-red-200 flex items-center justify-center text-red-700 font-bold">
                  {student.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{student.studentName}</p>
                  <p className="text-sm text-text-muted">{student.projectTitle}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-error">{student.overallProgress}%</p>
                  <p className="text-xs text-text-muted">Semana {student.currentWeek}</p>
                </div>
                <button className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* All Students */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Todos los Estudiantes</h2>
          <Link to="/students" className="text-sm text-primary hover:text-primary-dark flex items-center gap-1">
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Estudiante</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Proyecto</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Semana</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Avance</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Estado</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Acción</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.studentId} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                        {student.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium text-text-primary">{student.studentName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{student.projectTitle}</td>
                  <td className="py-3 px-4 text-sm text-text-secondary">Semana {student.currentWeek}</td>
                  <td className="py-3 px-4 w-48">
                    <ProgressBar progress={student.overallProgress} size="sm" showLabel={false} />
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      student.overallProgress >= 75 ? 'bg-success/10 text-success' :
                      student.overallProgress >= 50 ? 'bg-warning/10 text-warning' :
                      'bg-error/10 text-error'
                    }`}>
                      {student.overallProgress >= 75 ? 'Bien' : student.overallProgress >= 50 ? 'Regular' : 'En riesgo'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-primary hover:text-primary-dark text-sm font-medium">
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}