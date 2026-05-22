import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GitBranch, 
  FileCheck, 
  Bell, 
  Lightbulb,
  LogOut,
  GraduationCap,
  Users,
  ClipboardList
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { RoleBadge } from './RoleBadge';

export function Sidebar() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const studentLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/workflow', icon: GitBranch, label: 'Workflow' },
    { to: '/deliverables', icon: FileCheck, label: 'Entregables' },
    { to: '/notifications', icon: Bell, label: 'Notificaciones' },
    { to: '/recommendations', icon: Lightbulb, label: 'Recomendaciones' },
  ];
  
  const professorLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Estudiantes' },
    { to: '/deliverables', icon: FileCheck, label: 'Entregables' },
    { to: '/notifications', icon: Bell, label: 'Notificaciones' },
  ];
  
  const coordinatorLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Estudiantes' },
    { to: '/projects', icon: ClipboardList, label: 'Proyectos' },
    { to: '/notifications', icon: Bell, label: 'Notificaciones' },
  ];
  
  const links = user?.role === 'estudiante' 
    ? studentLinks 
    : user?.role === 'profesor' 
    ? professorLinks 
    : coordinatorLinks;
  
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-primary-dark text-white flex flex-col z-50">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-bold text-lg">PolyThesis</h1>
            <p className="text-xs text-white/70">Seguimiento de Tesis</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {links.map(link => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <link.icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* User Info */}
      {user && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="font-semibold text-sm">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user.name}</p>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </aside>
  );
}