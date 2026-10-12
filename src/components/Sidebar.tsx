import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  GitBranch, 
  FileCheck, 
  Bell, 
  Lightbulb,
  LogOut,
  GraduationCap,
  Users,
  MessageSquare,
  Lock,
  Menu,
  X
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { RoleBadge } from './RoleBadge';
import { BrandLogo } from './BrandLogo';
import { useAcademicAccess } from '../hooks/useAcademicAccess';

export function Sidebar() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { access } = useAcademicAccess();

  useEffect(() => setMobileOpen(false), [location.pathname]);
  
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
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
  ];
  
  const professorLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Estudiantes' },
    { to: '/workflow', icon: GitBranch, label: 'Workflow' },
    { to: '/deliverables', icon: FileCheck, label: 'Entregables' },
    { to: '/notifications', icon: Bell, label: 'Notificaciones' },
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
  ];
  
  const coordinatorLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Estudiantes' },
    { to: '/professors', icon: GraduationCap, label: 'Profesores' },
    { to: '/groups', icon: Users, label: 'Grupos' },
    { to: '/notifications', icon: Bell, label: 'Notificaciones' },
  ];
  
  const links = user?.role === 'estudiante' 
    ? studentLinks 
    : user?.role === 'profesor' 
    ? professorLinks 
    : coordinatorLinks;
  const canUseAcademic = user?.role === 'coordinador' || access?.hasActiveGroup === true;
  const locked = (link: { to: string }) => !canUseAcademic && link.to !== '/dashboard';
  
  return (
    <>
    <button
      type="button"
      onClick={() => setMobileOpen(open => !open)}
      aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
      aria-expanded={mobileOpen}
      className="fixed left-3 top-3 z-[60] rounded-lg bg-primary-dark p-2 text-white shadow-md transition-transform hover:bg-primary active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
    >
      {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
    {mobileOpen && <button type="button" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-navy/40 md:hidden" />}
    <aside className={`fixed left-0 top-0 z-50 flex h-screen w-60 flex-col bg-primary-dark text-white shadow-xl transition-transform duration-200 motion-reduce:transition-none md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Logo */}
      <div className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="flex items-center gap-3">
          <BrandLogo variant="dark" className="max-w-28 shrink-0" />
          <p className="font-brand text-[0.68rem] font-semibold uppercase leading-tight tracking-[0.1em] text-navy">
            Seguimiento de Tesis
          </p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {links.map(link => (
            <li key={link.to}>
              {locked(link) ? <div
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-white/40"
                title="Disponible cuando tengas un grupo activo"
              >
                <link.icon className="h-5 w-5" />
                <span className="flex-1 font-medium">{link.label}</span>
                <Lock className="h-4 w-4" />
              </div> : <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `nav-item relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    isActive 
                    ? 'bg-white/15 text-white shadow-inner before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-cyan-300'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <link.icon className="nav-icon h-5 w-5" />
                <span className="font-medium">{link.label}</span>
              </NavLink>
              }
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
    </>
  );
}