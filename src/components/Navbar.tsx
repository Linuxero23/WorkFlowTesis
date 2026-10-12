import { useLocation, Link } from 'react-router-dom';
import { Bell, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { RoleBadge } from './RoleBadge';

export function Navbar() {
  const location = useLocation();
  const { user, notifications } = useStore();
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/workflow') return 'Workflow de 16 Semanas';
    if (path === '/deliverables') return 'Entregables';
    if (path === '/notifications') return 'Notificaciones';
    if (path === '/recommendations') return 'Recomendaciones';
    if (path === '/students') return 'Mis Estudiantes';
    if (path === '/professors') return 'Profesores';
    if (path === '/groups') return 'Grupos';
    if (path === '/projects') return 'Proyectos';
    return 'PoliThesis';
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-white/90 px-3 pl-14 shadow-[0_4px_16px_rgba(15,39,64,0.035)] backdrop-blur-xl sm:px-6 sm:pl-16 md:pl-6">
      <div className="flex min-w-0 items-center gap-2 truncate text-sm text-text-muted">
        <span>PoliThesis</span>
        <ChevronRight className="w-4 h-4" />
        <span className="font-medium text-text-primary">{getPageTitle()}</span>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Link 
          to="/notifications"
          aria-label={`Notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ''}`}
          className="action-button relative shrink-0 p-2 text-text-secondary hover:text-primary"
        >
          <Bell key={unreadCount} className={`h-5 w-5 ${unreadCount ? 'notification-pulse' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
        
        {/* User */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary">{user.name}</p>
              <RoleBadge role={user.role} />
            </div>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="font-semibold text-sm">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}