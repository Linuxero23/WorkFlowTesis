import { Lightbulb } from 'lucide-react';
import { Recommendation } from '../types';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case 'high':
        return 'text-error bg-red-50';
      case 'medium':
        return 'text-warning bg-amber-50';
      case 'low':
        return 'text-success bg-green-50';
    }
  };
  
  const getPriorityLabel = () => {
    switch (recommendation.priority) {
      case 'high':
        return 'Urgente';
      case 'medium':
        return 'Recomendación';
      case 'low':
        return 'Sugerencia';
    }
  };
  
  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
        <Lightbulb className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${getPriorityColor()}`}>
            {getPriorityLabel()}
          </span>
        </div>
        <p className="text-sm text-text-primary">{recommendation.text}</p>
      </div>
    </div>
  );
}