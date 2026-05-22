import { useStore } from '../store/useStore';
import { ProgressBar } from '../components/ProgressBar';
import { AlertCard } from '../components/AlertCard';
import { User, FileText, AlertTriangle, Clock, Send, MessageSquare } from 'lucide-react';
import { mockStudentProgress } from '../data/mockData';
import { useState } from 'react';

export function Students() {
  const { user } = useStore();
  const students = mockStudentProgress;
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  
  const selected = students.find(s => s.studentId === selectedStudent);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Mis Estudiantes</h1>
        <p className="text-text-secondary">
          Gestiona y supervisa el avance de tus estudiantes asignados
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-text-muted">Total</span>
          </div>
          <p className="font-semibold text-text-primary text-2xl">{students.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <FileText className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-text-muted">Bien</span>
          </div>
          <p className="font-semibold text-success text-2xl">
            {students.filter(s => s.overallProgress >= 75).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <span className="text-sm text-text-muted">Regular</span>
          </div>
          <p className="font-semibold text-warning text-2xl">
            {students.filter(s => s.overallProgress >= 50 && s.overallProgress < 75).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-error/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <span className="text-sm text-text-muted">En Riesgo</span>
          </div>
          <p className="font-semibold text-error text-2xl">
            {students.filter(s => s.overallProgress < 50).length}
          </p>
        </div>
      </div>
      
      {/* Students List */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Lista de Estudiantes</h2>
        <div className="space-y-4">
          {students.map(student => (
            <div 
              key={student.studentId}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                selectedStudent === student.studentId 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedStudent(student.studentId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {student.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{student.studentName}</h3>
                    <p className="text-sm text-text-muted">{student.projectTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-48">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-text-muted">Semana {student.currentWeek}</span>
                      <span className="font-semibold text-text-primary">{student.overallProgress}%</span>
                    </div>
                    <ProgressBar progress={student.overallProgress} size="sm" showLabel={false} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    student.overallProgress >= 75 ? 'bg-success/10 text-success' :
                    student.overallProgress >= 50 ? 'bg-warning/10 text-warning' :
                    'bg-error/10 text-error'
                  }`}>
                    {student.overallProgress >= 75 ? 'Bien' : 
                     student.overallProgress >= 50 ? 'Regular' : 'En riesgo'}
                  </span>
                </div>
              </div>
              
              {/* Alerts for this student */}
              {student.alerts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  {student.alerts.map(alert => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Feedback Panel */}
      {selected && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Enviar Retroalimentación a {selected.studentName}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Mensaje
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Escribe tu retroalimentación..."
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                rows={4}
              />
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              onClick={() => {
                alert(`Retroalimentación enviada a ${selected.studentName}: "${feedbackText}"`);
                setFeedbackText('');
              }}
            >
              <Send className="w-4 h-4" />
              Enviar Retroalimentación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}