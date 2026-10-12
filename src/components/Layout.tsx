import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useStore } from '../store/useStore';
import { fetchNotifications } from '../utils/notifications';

export function Layout() {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const user = useStore(state => state.user);
  const logout = useStore(state => state.logout);
  const replaceNotifications = useStore(state => state.replaceNotifications);
  const setNotificationsError = useStore(state => state.setNotificationsError);
  const setNotificationsLoading = useStore(state => state.setNotificationsLoading);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    let timer: number;
    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        logout();
        navigate('/login', { replace: true });
      }, 10 * 60 * 1000);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart',
      'pointerdown',
    ];
    activityEvents.forEach(eventName => window.addEventListener(eventName, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      window.clearTimeout(timer);
      activityEvents.forEach(eventName => window.removeEventListener(eventName, resetTimer));
    };
  }, [isAuthenticated, logout, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    let inFlight = false;
    let firstLoad = true;

    const refreshNotifications = async () => {
      if (inFlight) return;
      inFlight = true;
      if (firstLoad) setNotificationsLoading(true);
      try {
        const notifications = await fetchNotifications(user);
        if (active) replaceNotifications(notifications);
      } catch (error) {
        if (active) {
          setNotificationsError(error instanceof Error ? error.message : 'No se pudieron cargar las notificaciones');
        }
      } finally {
        inFlight = false;
        firstLoad = false;
      }
    };

    void refreshNotifications();
    const interval = window.setInterval(() => void refreshNotifications(), 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user, replaceNotifications, setNotificationsError, setNotificationsLoading]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-60">
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(ellipse_at_top_right,rgba(25,169,209,0.06),transparent_38%),linear-gradient(145deg,#f4f8fb_0%,#f3f6fa_55%,#edf5f8_100%)] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}