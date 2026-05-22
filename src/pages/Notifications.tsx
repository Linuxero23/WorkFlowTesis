import { useStore } from '../store/useStore';
import { Bell, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';
import { formatDate } from '../utils/progress';

export function Notifications() {
  const { notifications, markNotificationRead, user } = useStore();
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'info':
        return <Info className="w-5 h-5 text-info" />;
      default:
        return <Bell className="w-5 h-5 text-text-muted" />;
    }
  };
  
  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-success/10';
      case 'warning':
        return 'bg-warning/10';
      case 'info':
        return 'bg-info/10';
      default:
        return 'bg-gray-100';
    }
  };
  
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Notificaciones</h1>
            <p className="text-text-secondary">
              {unreadNotifications.length} notificaciones sin leer
            </p>
          </div>
        </div>
      </div>
      
      {/* Unread Notifications */}
      {unreadNotifications.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Nuevas</h2>
          <div className="space-y-3">
            {unreadNotifications.map(notification => (
              <div 
                key={notification.id}
                onClick={() => markNotificationRead(notification.id)}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className={`p-2 rounded-full ${getBgColor(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-text-primary">{notification.title}</h3>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(notification.date)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{notification.message}</p>
                </div>
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Read Notifications */}
      {readNotifications.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Anteriores</h2>
          <div className="space-y-3">
            {readNotifications.map(notification => (
              <div 
                key={notification.id}
                className="flex items-start gap-4 p-4 bg-white border border-border rounded-lg"
              >
                <div className={`p-2 rounded-full ${getBgColor(notification.type)} opacity-60`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-text-primary">{notification.title}</h3>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(notification.date)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{notification.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {notifications.length === 0 && (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-border text-center">
          <Bell className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No hay notificaciones</h3>
          <p className="text-text-secondary">Las notificaciones aparecerán aquí cuando existan actualizaciones.</p>
        </div>
      )}
    </div>
  );
}