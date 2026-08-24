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
import { useStore } from '../store/useStore';

// Componente para proteger rutas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const user = useStore(state => state.user);
  
  if (!isAuthenticated || !user) {
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
  
  return <DashboardProfessor />;
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
            <Workflow />
          </ProtectedRoute>
        ),
      },
      {
        path: 'deliverables',
        element: (
          <ProtectedRoute>
            <Deliverables />
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
            <Recommendations />
          </ProtectedRoute>
        ),
      },
      {
        path: 'students',
        element: (
          <ProtectedRoute>
            <Students />
          </ProtectedRoute>
        ),
      },
      {
        path: 'projects',
        element: (
          <ProtectedRoute>
            <DashboardProfessor />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);