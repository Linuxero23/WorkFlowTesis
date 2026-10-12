import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Project, Week, Notification, Alert, Recommendation } from '../types';
import { mockProject, mockRecommendations } from '../data/mockData';

interface AppState {
  // Autenticación
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  
  // Proyecto
  project: Project;
  updateWeek: (weekId: number, updates: Partial<Week>) => void;
  markDeliverableComplete: (weekId: number, deliverableId: string) => void;
  setWeekObservation: (weekId: number, observation: string) => void;
  
  // Notificaciones
  notifications: Notification[];
  notificationsLoading: boolean;
  notificationsError: string | null;
  replaceNotifications: (notifications: Notification[]) => void;
  setNotificationsLoading: (loading: boolean) => void;
  setNotificationsError: (error: string | null) => void;
  markNotificationRead: (id: string) => void;
  
  // Recomendaciones
  recommendations: Recommendation[];
  
  // Alertas
  alerts: Alert[];
  computeAlerts: () => void;
  
  // Dashboard
  overallProgress: number;
  currentWeek: number;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      project: mockProject,
      notifications: [],
      recommendations: mockRecommendations,
      alerts: [],
      overallProgress: 0,
      currentWeek: 1,
      notificationsLoading: false,
      notificationsError: null,

      // Guarda el usuario autenticado por el backend.
      login: (user: User) => {
        set({
          user,
          isAuthenticated: true,
          notifications: [],
          notificationsLoading: true,
          notificationsError: null,
          overallProgress: 0,
          currentWeek: 1,
        });
        get().computeAlerts();
      },

      // Logout
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          alerts: [],
          notifications: [],
          notificationsLoading: false,
          notificationsError: null,
          overallProgress: 0,
          currentWeek: 1,
        });
      },

      // Actualizar semana
      updateWeek: (weekId: number, updates: Partial<Week>) => {
        const { project } = get();
        const updatedWeeks = project.weeks.map(week => 
          week.id === weekId ? { ...week, ...updates } : week
        );
        
        const updatedProject = { ...project, weeks: updatedWeeks };
        const progress = calculateOverallProgress(updatedWeeks);
        const currentWeek = updatedProject.currentWeek;
        
        set({ 
          project: updatedProject,
          overallProgress: progress,
          currentWeek 
        });
        
        // Recalcular alertas
        get().computeAlerts();
      },

      // Marcar entregable como completo
      markDeliverableComplete: (weekId: number, deliverableId: string) => {
        const { project, updateWeek } = get();
        const week = project.weeks.find(w => w.id === weekId);
        
        if (week) {
          const updatedDeliverables = week.deliverables.map(d =>
            d.id === deliverableId ? { ...d, completed: true } : d
          );
          
          const completedCount = updatedDeliverables.filter(d => d.completed).length;
          const percentage = Math.round((completedCount / updatedDeliverables.length) * 100);
          
          const allCompleted = updatedDeliverables.every(d => d.completed);
          const newStatus: Week['status'] = allCompleted ? 'completado' : 'en_progreso';
          
          updateWeek(weekId, {
            deliverables: updatedDeliverables,
            percentage,
            status: newStatus,
          });
        }
      },

      // Establecer observación
      setWeekObservation: (weekId: number, observation: string) => {
        get().updateWeek(weekId, { observation });
      },

      // Marcar notificación como leída
      replaceNotifications: (notifications: Notification[]) => set({
        notifications,
        notificationsLoading: false,
        notificationsError: null,
      }),
      setNotificationsLoading: (loading: boolean) => set({ notificationsLoading: loading }),
      setNotificationsError: (error: string | null) => set({
        notifications: error ? [] : get().notifications,
        notificationsLoading: false,
        notificationsError: error,
      }),
      markNotificationRead: (id: string) => {
        const { notifications } = get();
        const updated = notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        );
        set({ notifications: updated });
      },

      // Calcular alertas
      computeAlerts: () => {
        const { project, overallProgress, currentWeek } = get();
        const newAlerts: Alert[] = [];
        
        // Alerta si avance < 25% después de semana 4
        if (currentWeek > 4 && overallProgress < 25) {
          newAlerts.push({
            id: 'alert-progress-1',
            type: 'warning',
            title: 'Avance bajo',
            message: 'Tu avance está por debajo del 25%. Debes contactar a tu tutor para revisar el avance.',
          });
        }
        
        // Alerta si avance < 50% después de semana 8
        if (currentWeek > 8 && overallProgress < 50) {
          newAlerts.push({
            id: 'alert-progress-2',
            type: 'error',
            title: 'Atraso crítico',
            message: 'Tu avance está por debajo del 50%. Es urgente que contactes a tu tutor.',
          });
        }
        
        // Verificar semanas atrasadas
        project.weeks.forEach(week => {
          if (week.id < currentWeek && week.status !== 'completado') {
            // Ya está marcado como atrasado o pendiente
          }
        });
        
        set({ alerts: newAlerts });
      },
    }),
    {
      name: 'polythesis-storage',
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      version: 2,
      migrate: persistedState => {
        const persisted = persistedState as Partial<AppState>;
        return {
          user: persisted.user ?? null,
          isAuthenticated: persisted.isAuthenticated ?? false,
        };
      },
    }
  )
);

function calculateOverallProgress(weeks: Week[]): number {
  if (weeks.length === 0) return 0;
  return Math.round(weeks.reduce((total, week) => total + week.percentage, 0) / weeks.length);
}