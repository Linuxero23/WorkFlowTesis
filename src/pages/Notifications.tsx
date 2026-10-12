import { useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatDate } from '../utils/progress';
import { apiFetch } from '../utils/api';
import { fetchNotifications } from '../utils/notifications';

export function Notifications() {
  const user = useStore(state => state.user);
  const notifications = useStore(state => state.notifications);
  const loading = useStore(state => state.notificationsLoading);
  const error = useStore(state => state.notificationsError);
  const markNotificationRead = useStore(state => state.markNotificationRead);
  const replaceNotifications = useStore(state => state.replaceNotifications);
  const setNotificationsError = useStore(state => state.setNotificationsError);
  const setNotificationsLoading = useStore(state => state.setNotificationsLoading);
  const [actionError, setActionError] = useState('');
  const [pending, setPending] = useState(false);

  const refresh = async () => {
    if (!user || pending) return;
    setPending(true);
    setNotificationsLoading(true);
    try {
      replaceNotifications(await fetchNotifications(user));
    } catch (refreshError) {
      const message = refreshError instanceof Error ? refreshError.message : 'No se pudieron cargar las notificaciones';
      setNotificationsError(message);
    } finally {
      setPending(false);
    }
  };

  const markRead = async (id: string) => {
    if (!user) return;
    setActionError('');
    try {
      await apiFetch(`/notifications/${id}/read`, user, { method: 'PATCH' });
      markNotificationRead(id);
    } catch (readError) {
      setActionError(readError instanceof Error ? readError.message : 'No se pudo marcar la notificación como leída');
    }
  };

  const markAllRead = async () => {
    if (!user || pending) return;
    setPending(true);
    setActionError('');
    try {
      await apiFetch(`/notifications/read-all/${user.id}`, user, { method: 'PATCH' });
      replaceNotifications(await fetchNotifications(user));
    } catch (readError) {
      setActionError(readError instanceof Error ? readError.message : 'No se pudieron marcar como leídas');
    } finally {
      setPending(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'info':
        return <Info className="h-5 w-5 text-info" />;
      default:
        return <Bell className="h-5 w-5 text-text-muted" />;
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

  const unreadNotifications = notifications.filter(notification => !notification.read);
  const readNotifications = notifications.filter(notification => notification.read);

  return (
    <div className="page-stack">
      <div className="surface-card rounded-2xl border border-border bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3"><Bell className={`h-6 w-6 text-primary ${unreadNotifications.length ? 'notification-pulse' : ''}`} /></div>
            <div>
              <p className="page-kicker text-primary">Actualizaciones de tu proceso</p>
              <h1 className="mt-1 text-2xl font-bold text-text-primary">Notificaciones</h1>
              <p className="text-text-secondary">{unreadNotifications.length} notificaciones sin leer</p>
            </div>
          </div>
          {unreadNotifications.length > 0 && <button disabled={pending} onClick={() => void markAllRead()} className="action-button rounded-xl border border-border px-4 py-2.5 text-sm font-semibold disabled:opacity-50">{pending ? 'Actualizando…' : 'Marcar todas como leídas'}</button>}
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-error/30 bg-error/5 p-4 text-sm text-error">
        <p>No se pudieron cargar las notificaciones: {error}</p>
        <button onClick={() => void refresh()} disabled={pending} className="mt-2 rounded border border-error/30 px-3 py-1.5 font-medium disabled:opacity-50">Reintentar</button>
      </div>}
      {actionError && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{actionError}</p>}
      {loading && <p className="text-sm text-text-muted">Cargando notificaciones...</p>}

      {unreadNotifications.length > 0 && <section className="surface-card rounded-2xl border border-border bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Nuevas</h2>
        <div className="space-y-3">
          {unreadNotifications.map(notification => <article key={notification.id} className="metric-card flex items-start gap-4 rounded-xl border border-transparent bg-slate-50 p-4">
            <div className={`rounded-full p-2 ${getBgColor(notification.type)}`}>{getIcon(notification.type)}</div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-text-primary">{notification.title}</h3>
                <span className="flex items-center gap-1 text-xs text-text-muted"><Clock className="h-3 w-3" />{formatDate(notification.date)}</span>
              </div>
              <p className="text-sm text-text-secondary">{notification.message}</p>
            </div>
            <button onClick={() => void markRead(notification.id)} aria-label={`Marcar ${notification.title} como leída`} className="h-3 w-3 shrink-0 rounded-full bg-primary" />
          </article>)}
        </div>
      </section>}

      {readNotifications.length > 0 && <section className="surface-card rounded-2xl border border-border bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Anteriores</h2>
        <div className="space-y-3">
          {readNotifications.map(notification => <article key={notification.id} className="metric-card flex items-start gap-4 rounded-xl border border-border bg-slate-50/70 p-4">
            <div className={`rounded-full p-2 opacity-60 ${getBgColor(notification.type)}`}>{getIcon(notification.type)}</div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium text-text-primary">{notification.title}</h3>
                <span className="flex items-center gap-1 text-xs text-text-muted"><Clock className="h-3 w-3" />{formatDate(notification.date)}</span>
              </div>
              <p className="text-sm text-text-secondary">{notification.message}</p>
            </div>
          </article>)}
        </div>
      </section>}

      {!loading && !error && notifications.length === 0 && <div className="surface-card rounded-2xl border border-border bg-white p-12 text-center">
        <Bell className="mx-auto mb-4 h-12 w-12 text-text-muted" />
        <h3 className="mb-2 text-lg font-semibold text-text-primary">No hay notificaciones</h3>
        <p className="text-text-secondary">Las notificaciones aparecerán aquí cuando existan actualizaciones.</p>
      </div>}
    </div>
  );
}
