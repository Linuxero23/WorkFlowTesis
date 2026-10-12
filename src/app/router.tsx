import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { DashboardStudent } from '../pages/DashboardStudent';
import { DashboardProfessor } from '../pages/DashboardProfessor';
import { Workflow } from '../pages/Workflow';
import { Deliverables } from '../pages/Deliverables';
import { Notifications } from '../pages/Notifications';
import { Recommendations } from '../pages/Recommendations';
import { Students } from '../pages/Students';
import { CoordinatorDashboard } from '../pages/CoordinatorDashboard';
import { CoordinatorStudents } from '../pages/CoordinatorStudents';
import { CoordinatorProfessors } from '../pages/CoordinatorProfessors';
import { CoordinatorGroups } from '../pages/CoordinatorGroups';
import { ChatPage } from '../pages/ChatPage';
import { useAcademicAccess } from '../hooks/useAcademicAccess';
import { useStore } from '../store/useStore';

// Componente para proteger rutas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const user = useStore(state => state.user);
  
  if (!isAuthenticated || !user?.token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Componente que decide qué dashboard mostrar
function Dashboard() {
  const user = useStore(state => state.user);
  
  if (user?.role === 'estudiante') {
    return <DashboardStudent />;
  }

  if (user?.role === 'coordinador' || user?.role === 'administrador') {
    return <CoordinatorDashboard />;
  }
  
  return <DashboardProfessor />;
}

function StudentsRoute() {
  const user = useStore(state => state.user);
  if (user?.role === 'coordinador' || user?.role === 'administrador') return <CoordinatorStudents />;
  if (user?.role === 'profesor') return <Students />;
  return <Navigate to="/dashboard" replace />;
}

function CoordinatorRoute({ children }: { children: React.ReactNode }) {
  const user = useStore(state => state.user);
  if (user?.role !== 'coordinador' && user?.role !== 'administrador') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AcademicRoute({ children }: { children: React.ReactNode }) {
  const { access, loading } = useAcademicAccess();
  if (loading) return <div className="p-8 text-sm text-text-muted">Verificando acceso académico...</div>;
  return access?.hasActiveGroup ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function UnknownRoute() {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

// Router
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'workflow',
        element: (
          <ProtectedRoute>
            <AcademicRoute><Workflow /></AcademicRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'deliverables',
        element: (
          <ProtectedRoute>
            <AcademicRoute><Deliverables /></AcademicRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        ),
      },
      {
        path: 'recommendations',
        element: (
          <ProtectedRoute>
            <AcademicRoute><Recommendations /></AcademicRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'chat',
        element: (
          <ProtectedRoute>
            <AcademicRoute><ChatPage /></AcademicRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'students',
        element: (
          <ProtectedRoute>
            <StudentsRoute />
          </ProtectedRoute>
        ),
      },
      {
        path: 'professors',
        element: (
          <ProtectedRoute>
            <CoordinatorRoute><CoordinatorProfessors /></CoordinatorRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'groups',
        element: (
          <ProtectedRoute>
            <CoordinatorRoute><CoordinatorGroups /></CoordinatorRoute>
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <UnknownRoute />,
  },
]);