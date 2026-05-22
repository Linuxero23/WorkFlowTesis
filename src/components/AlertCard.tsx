import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Alert } from '../types';
import { getAlertColor, getAlertIconColor } from '../utils/alerts';

interface AlertCardProps {
  alert: Alert;
  onAction?: () => void;
}

export function AlertCard({ alert, onAction }: AlertCardProps) {
  const getIcon = () => {
    switch (alert.type) {
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
    }
  };
  
  return (
    <div className={`p-4 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}>
      <div className="flex items-start gap-3">
        <div className={getAlertIconColor(alert.type)}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-text-primary">{alert.title}</h4>
          <p className="text-sm text-text-secondary mt-1">{alert.message}</p>
          {onAction && (
            <button
              onClick={onAction}
              className="mt-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Ver detalles →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}