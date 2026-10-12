import { useStore } from '../store/useStore';
import { RecommendationCard } from '../components/RecommendationCard';
import { Lightbulb, AlertTriangle, BookOpen, ClipboardList, FileCheck } from 'lucide-react';

export function Recommendations() {
  const { recommendations, overallProgress, currentWeek, project } = useStore();
  
  // Generar recomendaciones dinámicas basadas en el estado
  const dynamicRecommendations = [...recommendations];
  
  // Agregar recomendaciones según el estado del proyecto
  if (currentWeek >= 4 && overallProgress < 25) {
    dynamicRecommendations.push({
      id: 'rec-dynamic-1',
      text: 'Tu avance está por debajo de lo esperado. Agenda una reunión con tu tutor lo antes posible.',
      priority: 'high',
      category: 'urgente',
    });
  }
  
  if (currentWeek >= 8 && overallProgress < 50) {
    dynamicRecommendations.push({
      id: 'rec-dynamic-2',
      text: 'Estás en la semana 8 o más y tu avance es menor al 50%. Es crítico que aceleres el ritmo.',
      priority: 'high',
      category: 'urgente',
    });
  }
  
  // Verificar si falta bibliografía
  const week5 = project.weeks.find(w => w.id === 5);
  if (week5 && week5.status !== 'completado') {
    dynamicRecommendations.push({
      id: 'rec-dynamic-3',
      text: 'Se acerca la semana del Marco Teórico. Asegúrate de tener al menos 15 fuentes académicas en formato APA.',
      priority: 'medium',
      category: 'bibliografia',
    });
  }
  
  // Verificar si falta metodología
  if (currentWeek >= 6 && currentWeek <= 7) {
    dynamicRecommendations.push({
      id: 'rec-dynamic-4',
      text: 'En las próximas semanas debes definir claramente la metodología: fases, herramientas, pruebas y validación.',
      priority: 'medium',
      category: 'metodologia',
    });
  }
  
  // Si está cerca de la semana 16
  if (currentWeek >= 14) {
    dynamicRecommendations.push({
      id: 'rec-dynamic-5',
      text: 'Estás en las últimas semanas. Revisa las conclusiones, el informe final y la retrospectiva del proyecto.',
      priority: 'high',
      category: 'final',
    });
  }
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'urgente':
        return <AlertTriangle className="w-5 h-5" />;
      case 'bibliografia':
        return <BookOpen className="w-5 h-5" />;
      case 'metodologia':
        return <ClipboardList className="w-5 h-5" />;
      case 'final':
        return <FileCheck className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };
  
  const categories = [
    { id: 'urgente', label: 'Urgente', color: 'text-error', bg: 'bg-red-50' },
    { id: 'bibliografia', label: 'Bibliografía', color: 'text-info', bg: 'bg-blue-50' },
    { id: 'metodologia', label: 'Metodología', color: 'text-navy', bg: 'bg-slate-100' },
    { id: 'final', label: 'Final', color: 'text-success', bg: 'bg-green-50' },
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-warning/10 rounded-full">
            <Lightbulb className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Recomendaciones</h1>
            <p className="text-text-secondary">
              Consejos personalizados para mejorar tu avance
            </p>
          </div>
        </div>
      </div>
      
      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map(cat => {
          const count = dynamicRecommendations.filter(r => r.category === cat.id).length;
          return (
            <div key={cat.id} className={`p-4 rounded-xl ${cat.bg}`}>
              <div className={`${cat.color} mb-2`}>
                {getCategoryIcon(cat.id)}
              </div>
              <p className="font-semibold text-text-primary">{cat.label}</p>
              <p className="text-2xl font-bold text-text-primary">{count}</p>
            </div>
          );
        })}
      </div>
      
      {/* Recommendations List */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Todas las Recomendaciones ({dynamicRecommendations.length})
        </h2>
        <div className="space-y-3">
          {dynamicRecommendations.map(rec => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      </div>
      
      {/* Tips Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Consejos Generales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-text-primary mb-2">📅 Organízate</h3>
            <p className="text-sm text-text-secondary">
              Dedica al menos 10 horas semanales a tu proyecto. Usa un calendario para planificar tus sesiones de trabajo.
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-text-primary mb-2">📚 Cita correctamente</h3>
            <p className="text-sm text-text-secondary">
              Usa formato APA o IEEE para todas tus referencias. Herramientas como Zotero pueden ayudarte.
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-text-primary mb-2">💬 Comunica</h3>
            <p className="text-sm text-text-secondary">
              Mantén comunicación regular con tu tutor. Envía actualizaciones semanales aunque no haya avances grandes.
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-text-primary mb-2">✅ Entrega a tiempo</h3>
            <p className="text-sm text-text-secondary">
              Completa los entregables al menos 2 días antes del plazo para tener margen de corrección.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}