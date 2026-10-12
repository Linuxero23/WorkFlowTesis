import { useEffect, useRef, useState } from 'react';
import { Lock, Send, Unlock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Activity, AcademicProject, Delivery, Message } from '../types';
import { apiFetch } from '../utils/api';
import { DeliveryFile } from './DeliveryFile';

interface ActivityMutationResponse {
  activity: Activity;
  warnings: string[];
}

export function AcademicProfessorPanel() {
  const { user } = useStore();
  const [projects, setProjects] = useState<AcademicProject[]>([]);
  const [selected, setSelected] = useState<AcademicProject | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deliveries, setDeliveries] = useState<Record<number, Delivery[]>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [noticeIsWarning, setNoticeIsWarning] = useState(false);
  const [editingActivity, setEditingActivity] = useState<number | null>(null);
  const [activityForm, setActivityForm] = useState({ titulo: '', descripcion: '', fecha_inicio: '', fecha_limite: '' });
  const [grades, setGrades] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [locking, setLocking] = useState<Record<number, boolean>>({});
  const loadVersion = useRef(0);
  const showNotice = (text: string, isError = false, isWarning = false) => {
    setNotice(text);
    setNoticeIsError(isError);
    setNoticeIsWarning(isWarning);
  };

  const load = async () => {
    if (!user) return;
    const version = ++loadVersion.current;
    try {
      const rows = await apiFetch<AcademicProject[]>('/projects/tutored', user);
      if (version !== loadVersion.current) return;
      setProjects(rows);
      const current = selected ? rows.find(row => row.id_proyecto === selected.id_proyecto) || rows[0] : rows[0];
      setSelected(current || null);
      if (!current) {
        setActivities([]);
        setDeliveries({});
        setMessages([]);
        return;
      }
      const next = await apiFetch<Activity[]>(`/projects/${current.id_proyecto}/activities`, user);
      if (version !== loadVersion.current) return;
      setActivities(next);
      const grouped: Record<number, Delivery[]> = {};
      const deliveryErrors: string[] = [];
      await Promise.all(next.map(async activity => {
        try {
          grouped[activity.id_actividad] = await apiFetch<Delivery[]>(`/activities/${activity.id_actividad}/deliveries`, user);
        } catch (error) {
          grouped[activity.id_actividad] = [];
          deliveryErrors.push(`${activity.titulo}: ${error instanceof Error ? error.message : 'error de carga'}`);
        }
      }));
      if (version !== loadVersion.current) return;
      setDeliveries(grouped);
      if (deliveryErrors.length) {
        showNotice(`Actividades cargadas, pero fallaron algunas consultas de entregas: ${deliveryErrors.join('; ')}`, true);
      }
    } catch (error) {
      if (version === loadVersion.current) {
        showNotice(error instanceof Error ? error.message : 'No se pudo cargar la información', true);
      }
    }
  };

  const loadChat = async () => {
    if (!user || !selected) {
      setMessages([]);
      return;
    }
    try {
      const chat = await apiFetch<{ messages: Message[] }>(`/projects/${selected.id_proyecto}/messages`, user);
      setMessages(chat.messages);
    } catch (error) {
      setMessages([]);
      showNotice(error instanceof Error ? `No se pudo cargar el chat: ${error.message}` : 'No se pudo cargar el chat', true);
    }
  };

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(interval);
  }, [user, selected?.id_proyecto]);

  useEffect(() => {
    void loadChat();
  }, [user, selected?.id_proyecto]);

  const editActivity = (activity: Activity) => {
    setEditingActivity(activity.id_actividad);
    setActivityForm({
      titulo: activity.titulo,
      descripcion: activity.descripcion || '',
      fecha_inicio: activity.fecha_inicio?.slice(0, 10) || '',
      fecha_limite: activity.fecha_limite?.slice(0, 10) || ''
    });
  };

  const saveActivity = async () => {
    if (!user || editingActivity === null) return;
    try {
      const result = await apiFetch<ActivityMutationResponse>(`/activities/${editingActivity}`, user, {
        method: 'PATCH',
        body: JSON.stringify(activityForm),
      });
      setActivities(current => current.map(activity => activity.id_actividad === result.activity.id_actividad
        ? { ...activity, ...result.activity }
        : activity));
      setEditingActivity(null);
      showNotice(result.warnings.length
        ? `Actividad actualizada. ${result.warnings.join(' ')}`
        : 'Actividad actualizada y guardada', false, result.warnings.length > 0);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'No se pudo guardar la actividad', true);
    }
  };

  const lock = async (activity: Activity) => {
    if (!user || locking[activity.id_actividad]) return;
    const blocked = !activity.bloqueada;
    setLocking(current => ({ ...current, [activity.id_actividad]: true }));
    try {
      const result = await apiFetch<{ id_actividad: number; bloqueada: boolean; warnings: string[] }>(
        `/activities/${activity.id_actividad}/${blocked ? 'lock' : 'unlock'}`,
        user,
        { method: 'PATCH' }
      );
      loadVersion.current += 1;
      setActivities(current => current.map(item => item.id_actividad === result.id_actividad
        ? { ...item, bloqueada: result.bloqueada }
        : item));
      showNotice([
        result.bloqueada ? 'Actividad bloqueada' : 'Actividad desbloqueada',
        ...result.warnings,
      ].join(' '), false, result.warnings.length > 0);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'No se pudo cambiar el bloqueo', true);
    } finally {
      setLocking(current => {
        const next = { ...current };
        delete next[activity.id_actividad];
        return next;
      });
    }
  };

  const review = async (delivery: Delivery, status: string) => {
    if (!user) return;
    const rawGrade = grades[delivery.id_entrega] ?? '';
    const grade = rawGrade.trim() === '' ? undefined : Number(rawGrade);
    if (grade !== undefined && (!Number.isFinite(grade) || grade < 0 || grade > 5)) {
      showNotice('La calificación debe estar entre 0 y 5', true);
      return;
    }
    try {
      await apiFetch(`/deliveries/${delivery.id_entrega}/review`, user, {
        method: 'PATCH',
        body: JSON.stringify({
          estado_revision: status,
          calificacion: grade,
          retroalimentacion: feedback[delivery.id_entrega] || undefined
        })
      });
      setFeedback(current => ({ ...current, [delivery.id_entrega]: '' }));
      showNotice('Entrega revisada; calificación y retroalimentación guardadas');
      await load();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'No se pudo revisar la entrega', true);
    }
  };

  const sendMessage = async () => {
    if (!user || !selected || !message.trim()) return;
    try {
      await apiFetch(`/projects/${selected.id_proyecto}/messages`, user, { method: 'POST', body: JSON.stringify({ id_receptor: selected.id_estudiante, mensaje: message }) });
      setMessage('');
      await loadChat();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'No se pudo enviar el mensaje', true);
    }
  };

  return <div className="space-y-6">
    <div className="rounded-xl bg-gradient-to-r from-primary-dark to-navy p-6 text-white">
      <h1 className="text-2xl font-bold">Supervisión académica</h1>
      <p className="mt-1 text-white/80">Gestiona actividades, entregas y comunicación con tus estudiantes.</p>
    </div>
    {notice && <div role={noticeIsError ? 'alert' : 'status'} className={`rounded-lg border p-3 text-sm ${noticeIsError ? 'border-error/30 bg-error/5 text-error' : noticeIsWarning ? 'border-warning/30 bg-warning/5 text-warning' : 'border-primary/20 bg-primary/5 text-primary'}`}>{notice}</div>}
    <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
      <aside className="rounded-xl border border-border bg-white p-4">
        <h2 className="mb-3 font-semibold">Mis proyectos</h2>
        <div className="space-y-2">
          {projects.map(project => <button key={project.id_proyecto} onClick={() => setSelected(project)} className={`w-full rounded-lg p-3 text-left ${selected?.id_proyecto === project.id_proyecto ? 'bg-primary/10 text-primary' : 'bg-gray-50'}`}>
            <p className="font-semibold">{project.estudiante_nombre}</p>
            <p className="truncate text-xs text-text-muted">{project.titulo}</p>
            <p className="mt-1 text-xs">{project.progreso}% · {project.actividades_completadas}/{project.total_actividades} aprobadas</p>
          </button>)}
          {!projects.length && <p className="text-sm text-text-muted">No tienes proyectos asignados.</p>}
        </div>
      </aside>
      <main className="space-y-6">
        <section className="rounded-xl border border-border bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">{selected?.titulo || 'Selecciona un proyecto'}</h2>
            <p className="text-sm text-text-secondary">{selected?.estudiante_nombre} · Tutor: {selected?.tutor_nombre}</p>
          </div>
          <div className="space-y-3">
            {activities.map(activity => <article key={activity.id_actividad} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-primary">Semana {activity.numero_semana}</p>
                  <p className="font-semibold">{activity.titulo}</p>
                  <p className="text-sm text-text-secondary">{activity.descripcion}</p>
                  <p className="mt-1 text-xs text-text-muted">Estado: {activity.estado} · Límite: {activity.fecha_limite || 'Sin fecha'}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => editActivity(activity)} className="rounded px-2 py-1 text-xs text-primary hover:bg-primary/10">Editar</button>
                  <button disabled={Boolean(locking[activity.id_actividad])} onClick={() => void lock(activity)} className="rounded p-2 text-primary hover:bg-primary/10 disabled:opacity-50" aria-label={activity.bloqueada ? 'Desbloquear actividad' : 'Bloquear actividad'}>
                    {activity.bloqueada ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {editingActivity === activity.id_actividad && <div className="mt-3 space-y-2 rounded bg-gray-50 p-3">
                <input value={activityForm.titulo} onChange={event => setActivityForm(current => ({ ...current, titulo: event.target.value }))} maxLength={200} aria-label="Título" className="w-full rounded border border-border p-2 text-sm" />
                <textarea value={activityForm.descripcion} onChange={event => setActivityForm(current => ({ ...current, descripcion: event.target.value }))} aria-label="Descripción" rows={3} className="w-full rounded border border-border p-2 text-sm" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-text-muted">Inicio<input type="date" value={activityForm.fecha_inicio} onChange={event => setActivityForm(current => ({ ...current, fecha_inicio: event.target.value }))} className="mt-1 w-full rounded border border-border p-2 text-sm" /></label>
                  <label className="text-xs text-text-muted">Fecha límite<input type="date" value={activityForm.fecha_limite} onChange={event => setActivityForm(current => ({ ...current, fecha_limite: event.target.value }))} className="mt-1 w-full rounded border border-border p-2 text-sm" /></label>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => void saveActivity()} className="rounded bg-primary px-3 py-2 text-xs font-semibold text-white">Guardar cambios</button>
                  <button onClick={() => setEditingActivity(null)} className="rounded border border-border px-3 py-2 text-xs">Cancelar</button>
                </div>
              </div>}
              {(deliveries[activity.id_actividad] || []).map(delivery => <div key={delivery.id_entrega} className="mt-3 rounded bg-gray-50 p-3 text-sm">
                <p><b>{delivery.estudiante_nombre || 'Estudiante'}:</b> {delivery.estado_revision}
                  {delivery.calificacion !== null && delivery.calificacion !== undefined ? ` · ${delivery.calificacion}/5` : ''}
                </p>
                {delivery.comentario_estudiante && <p className="mt-1 whitespace-pre-wrap">{delivery.comentario_estudiante}</p>}
                {delivery.nombre_archivo && user && <DeliveryFile deliveryId={delivery.id_entrega} fileName={delivery.nombre_archivo} user={user} />}
                {delivery.url_externa && <a href={delivery.url_externa} target="_blank" rel="noreferrer" className="mt-1 block break-all text-primary underline">{delivery.url_externa}</a>}
                {delivery.retroalimentacion && <p className="mt-2 border-t border-border pt-2"><b>Retroalimentación:</b><br />{delivery.retroalimentacion}</p>}
                <textarea value={feedback[delivery.id_entrega] || ''} onChange={event => setFeedback(current => ({ ...current, [delivery.id_entrega]: event.target.value }))} placeholder="Retroalimentación para el estudiante" className="mt-2 w-full rounded border border-border p-2 text-sm" rows={2} />
                <label className="mt-2 block text-xs text-text-muted">Calificación (0 a 5, opcional)
                  <input type="number" min="0" max="5" step="0.01" value={grades[delivery.id_entrega] ?? delivery.calificacion ?? ''} onChange={event => setGrades(current => ({ ...current, [delivery.id_entrega]: event.target.value }))} className="mt-1 w-32 rounded border border-border p-2 text-sm" />
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={() => void review(delivery, 'APROBADA')} className="rounded bg-success px-2 py-1 text-xs text-white">Aprobar</button>
                  <button onClick={() => void review(delivery, 'REQUIERE_CORRECCION')} className="rounded bg-warning px-2 py-1 text-xs text-white">Solicitar corrección</button>
                  <button onClick={() => void review(delivery, 'RECHAZADA')} className="rounded bg-error px-2 py-1 text-xs text-white">Rechazar</button>
                </div>
              </div>)}
            </article>)}
            {!activities.length && selected && <p className="text-sm text-text-muted">Este proyecto aún no tiene actividades. Verifica que se haya ejecutado la migración 004.</p>}
          </div>
        </section>
        <section className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-3 font-semibold">Chat con {selected?.estudiante_nombre || 'estudiante'}</h2>
          <div className="mb-3 max-h-48 space-y-2 overflow-y-auto">{messages.map(item => <div key={item.id_mensaje} className="rounded bg-gray-50 p-2 text-sm">{item.mensaje}</div>)}</div>
          <div className="flex gap-2">
            <input value={message} onChange={event => setMessage(event.target.value)} placeholder="Mensaje" className="min-w-0 flex-1 rounded border border-border p-2 text-sm" />
            <button onClick={() => void sendMessage()} className="rounded bg-primary p-2 text-white" aria-label="Enviar mensaje"><Send className="h-4 w-4" /></button>
          </div>
        </section>
      </main>
    </div>
  </div>;
}
