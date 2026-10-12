import { useEffect, useState } from 'react';
import { Clock, FileCheck2, FileUp, Lock, MessageSquare, Send, Unlock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Activity, AcademicProject, Delivery, Message } from '../types';
import { apiFetch } from '../utils/api';
import { useAcademicAccess } from '../hooks/useAcademicAccess';
import { DeliveryFile } from './DeliveryFile';

export function AcademicStudentPanel() {
  const { user } = useStore();
  const { access } = useAcademicAccess();
  const [project, setProject] = useState<AcademicProject | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deliveries, setDeliveries] = useState<Record<number, Delivery[]>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [comment, setComment] = useState<Record<number, string>>({});
  const [url, setUrl] = useState<Record<number, string>>({});
  const [files, setFiles] = useState<Record<number, File | undefined>>({});
  const [notice, setNotice] = useState('');

  const load = async () => {
    if (!user) return;
    try {
      const nextProject = await apiFetch<AcademicProject>(`/projects/student/${user.id}`, user);
      setProject(nextProject);
      const nextActivities = await apiFetch<Activity[]>(`/projects/${nextProject.id_proyecto}/activities`, user);
      setActivities(nextActivities);
      const grouped: Record<number, Delivery[]> = {};
      await Promise.all(nextActivities.map(async activity => {
        grouped[activity.id_actividad] = await apiFetch<Delivery[]>(`/activities/${activity.id_actividad}/deliveries`, user);
      }));
      setDeliveries(grouped);
      const chat = await apiFetch<{ messages: Message[] }>(`/projects/${nextProject.id_proyecto}/messages`, user);
      setMessages(chat.messages);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo cargar el proyecto');
    }
  };

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(interval);
  }, [user]);

  const submitDelivery = async (activity: Activity) => {
    if (!user || activity.bloqueada) return;
    const history = deliveries[activity.id_actividad] || [];
    if (history.some(delivery => delivery.estado_revision === 'APROBADA')) {
      setNotice('Esta semana ya fue aprobada y no admite cambios.');
      return;
    }
    const form = new FormData();
    form.append('comentario_estudiante', comment[activity.id_actividad] || '');
    form.append('url_externa', url[activity.id_actividad] || '');
    const file = files[activity.id_actividad];
    if (file) form.append('archivo', file);
    try {
      await apiFetch(`/activities/${activity.id_actividad}/deliveries`, user, { method: 'POST', body: form });
      setNotice('Entrega enviada correctamente');
      setFiles(current => ({ ...current, [activity.id_actividad]: undefined }));
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo enviar la entrega');
    }
  };

  const sendMessage = async () => {
    if (!user || !project || !message.trim()) return;
    try {
      await apiFetch(`/projects/${project.id_proyecto}/messages`, user, { method: 'POST', body: JSON.stringify({ mensaje: message }) });
      setMessage('');
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo enviar el mensaje');
    }
  };

  return <div className="page-stack">
    <header className="page-hero">
      <div className="page-hero-icon"><FileCheck2 className="h-6 w-6" /></div>
      <div><p className="page-kicker">Mi seguimiento individual</p><h1 className="page-title">Seguimiento académico</h1>
        <p className="mt-2 text-sm text-white/75">Actividades, entregas y comunicación con tu tutor.</p>
      </div>
    </header>
    {notice && <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">{notice}</div>}
    {access?.group && <div className="surface-card rounded-2xl border border-primary/20 bg-white p-5">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">Mi grupo</p>
      <h2 className="mt-1 text-xl font-bold text-text-primary">{access.group.nombre}</h2>
      <p className="mt-1 text-sm text-text-secondary">Tutor: {access.group.tutor_nombre}</p>
      <p className="mt-3 text-sm text-text-secondary">Tu proyecto académico y sus actividades están asociados a este grupo.</p>
    </div>}
    {project && <div className="grid gap-4 md:grid-cols-4">
      <div className="metric-card rounded-2xl border border-border bg-white p-4"><p className="text-xs text-text-muted">Proyecto</p><p className="mt-2 font-semibold">{project.titulo}</p></div>
      <div className="metric-card rounded-2xl border border-border bg-white p-4"><p className="text-xs text-text-muted">Tutor</p><p className="mt-2 font-semibold">{project.tutor_nombre}</p></div>
      <div className="metric-card rounded-2xl border border-border bg-white p-4"><p className="text-xs text-text-muted">Progreso individual</p><p className="mt-2 text-2xl font-bold text-primary">{project.progreso}%</p></div>
      <div className="metric-card rounded-2xl border border-border bg-white p-4"><p className="text-xs text-text-muted">Semanas aprobadas</p><p className="mt-2 text-2xl font-bold">{project.actividades_completadas}/{project.total_actividades}</p></div>
    </div>}
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="surface-card rounded-2xl border border-border bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Actividades asignadas</h2>
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-4">
          {activities.map(activity => {
            const history = deliveries[activity.id_actividad] || [];
            const latest = history[0];
            const alreadyApproved = history.some(delivery => delivery.estado_revision === 'APROBADA');
            const canSubmit = !activity.bloqueada && !alreadyApproved &&
              (!latest || ['REQUIERE_CORRECCION', 'RECHAZADA'].includes(latest.estado_revision));
            return <article key={activity.id_actividad} className="surface-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-primary">Semana {activity.numero_semana}</p>
                  <h3 className="font-semibold">{activity.titulo}</h3>
                  <p className="text-sm text-text-secondary">{activity.descripcion}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${alreadyApproved ? 'bg-success/10 text-success' : latest?.estado_revision === 'REQUIERE_CORRECCION' ? 'bg-warning/10 text-warning' : latest ? 'bg-primary/5 text-primary' : 'bg-gray-100 text-text-muted'}`}>
                    {alreadyApproved ? 'Aprobado · Hecho' : latest?.estado_revision === 'REQUIERE_CORRECCION' ? 'Corrección solicitada' : latest?.estado_revision === 'RECHAZADA' ? 'Rechazado' : latest?.estado_revision === 'EN_REVISION' ? 'En revisión' : latest ? 'Enviado' : 'No entregado'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                    {activity.bloqueada ? <><Lock className="h-3 w-3" />Bloqueada</> : <><Unlock className="h-3 w-3" />Disponible</>}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted">Límite: {activity.fecha_limite || 'Sin fecha'}</p>
              {latest && <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
                <p><b>Tu entrega:</b> {latest.estado_revision}
                  {latest.calificacion !== null && latest.calificacion !== undefined ? ` · Calificación ${latest.calificacion}/5` : ''}
                </p>
                {latest.fecha_entrega && <p className="mt-1 text-xs text-text-muted">Enviada: {new Date(latest.fecha_entrega).toLocaleString()}</p>}
                {latest.comentario_estudiante && <p className="mt-2 whitespace-pre-wrap">{latest.comentario_estudiante}</p>}
                {latest.nombre_archivo && user && <DeliveryFile deliveryId={latest.id_entrega} fileName={latest.nombre_archivo} user={user} />}
                {latest.url_externa && <a className="mt-1 block break-all text-primary underline" href={latest.url_externa} target="_blank" rel="noreferrer">{latest.url_externa}</a>}
                {latest.retroalimentacion && <p className="mt-3 border-t border-border pt-3"><b>Retroalimentación del profesor:</b><br />{latest.retroalimentacion}</p>}
              </div>}
              {canSubmit && <div className="mt-4 space-y-2">
                {latest && <p className="text-xs text-warning">Puedes volver a entregar después de atender la revisión.</p>}
                <textarea value={comment[activity.id_actividad] || ''} onChange={event => setComment(current => ({ ...current, [activity.id_actividad]: event.target.value }))} placeholder="Comentario para el tutor" className="w-full rounded-xl border border-border p-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" rows={2} />
                <input value={url[activity.id_actividad] || ''} onChange={event => setUrl(current => ({ ...current, [activity.id_actividad]: event.target.value }))} placeholder="Enlace externo opcional" className="w-full rounded-xl border border-border p-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
                <input type="file" accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg" onChange={event => setFiles(current => ({ ...current, [activity.id_actividad]: event.target.files?.[0] }))} className="block w-full rounded-xl border border-border bg-slate-50 p-2 text-sm" />
                <button onClick={() => void submitDelivery(activity)} className="action-button inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  <FileUp className="h-4 w-4" />{latest ? 'Reenviar entrega' : 'Enviar entrega'}
                </button>
              </div>}
              {!canSubmit && alreadyApproved && <p className="mt-3 text-xs font-medium text-success">Semana aprobada. Puedes consultar el archivo, la nota y la retroalimentación, pero no modificar la entrega.</p>}
              {!canSubmit && !alreadyApproved && activity.bloqueada && <p className="mt-3 text-xs text-text-muted">La actividad está bloqueada para el grupo; consulta la entrega cuando esté disponible.</p>}
              {!canSubmit && !alreadyApproved && !activity.bloqueada && latest && !['REQUIERE_CORRECCION', 'RECHAZADA'].includes(latest.estado_revision) && <p className="mt-3 text-xs text-text-muted">Tu entrega está pendiente de revisión; no puedes reemplazarla mientras el profesor la revisa.</p>}
            </article>;
          })}
          {!activities.length && <p className="text-sm text-text-muted">Aún no hay actividades disponibles para este proyecto.</p>}
        </div>
      </section>
      <section className="surface-card rounded-2xl border border-border bg-white p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><MessageSquare className="h-5 w-5 text-primary" />Chat con tutor</h2>
        <div className="mb-4 max-h-96 space-y-2 overflow-y-auto">{messages.map(item => <div key={item.id_mensaje} className={`rounded-lg p-3 text-sm ${item.id_emisor === Number(user?.id) ? 'ml-6 bg-primary/10' : 'mr-6 bg-gray-100'}`}>{item.mensaje || 'Archivo adjunto'}<p className="mt-1 text-[10px] text-text-muted">{new Date(item.fecha_creacion).toLocaleString()}</p></div>)}</div>
        <div className="flex gap-2">
          <input value={message} onChange={event => setMessage(event.target.value)} placeholder="Escribe un mensaje" className="min-w-0 flex-1 rounded border border-border p-2 text-sm" />
          <button onClick={() => void sendMessage()} className="rounded bg-primary p-2 text-white" aria-label="Enviar mensaje"><Send className="h-4 w-4" /></button>
        </div>
      </section>
    </div>
  </div>;
}
