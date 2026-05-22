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
    if (path === '/projects') return 'Proyectos';
    return 'PolyThesis';
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <span>PolyThesis</span>
        <ChevronRight className="w-4 h-4" />
        <span className="font-medium text-text-primary">{getPageTitle()}</span>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Link 
          to="/notifications"
          className="relative p-2 text-text-secondary hover:text-primary transition-colors"
        >
          <Bell className="w-5 h-5" />
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