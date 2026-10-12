import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, FileUp, Lock, MessageSquareText, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { AcademicProject, StudentAcademicProgress } from '../types';
import { apiFetch } from '../utils/api';
import { useAcademicAccess } from '../hooks/useAcademicAccess';

export function DashboardStudent() {
  const user = useStore(state => state.user);
  const { access, loading } = useAcademicAccess();
  const [project, setProject] = useState<AcademicProject | null>(null);
  const [progress, setProgress] = useState<StudentAcademicProgress | null>(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user || !access?.hasActiveGroup) return;
      try {
        const current = await apiFetch<AcademicProject>(`/projects/student/${user.id}`, user);
        const individual = await apiFetch<StudentAcademicProgress[]>(`/projects/${current.id_proyecto}/student-progress`, user);
        if (!active) return;
        setProject(current);
        setProgress(individual.find(student => student.id_usuario === Number(user.id)) || null);
        setError('');
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el resumen académico');
      } finally {
        if (active) setLoaded(true);
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 15000);
    return () => { active = false; window.clearInterval(interval); };
  }, [user, access?.hasActiveGroup]);

  if (loading) return <div role="status" className="animate-pulse rounded-2xl border border-border bg-white p-8 text-sm text-text-muted">Verificando asignación de grupo...</div>;
  if (!access?.hasActiveGroup) return <div className="page-stack">
    <header className="page-hero"><div className="page-hero-icon"><Lock className="h-6 w-6" /></div><div><p className="page-kicker">Acompañamiento académico</p><h1 className="page-title">Esperando asignación de grupo</h1><p className="mt-2 text-sm text-white/75">Tu coordinador aún no te ha asignado a un grupo activo.</p></div></header>
    <div className="surface-card flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white p-8 text-center"><Lock className="h-10 w-10 text-primary/50" /><h2 className="mt-4 text-lg font-semibold text-text-primary">Herramientas académicas pendientes</h2><p className="mt-2 max-w-md text-sm text-text-secondary">Workflow, entregas, notificaciones y chat estarán disponibles cuando pertenezcas a un grupo de trabajo activo.</p></div>
  </div>;
  if (!loaded) return <div role="status" className="animate-pulse rounded-2xl border border-border bg-white p-8 text-sm text-text-muted">Cargando tu progreso individual...</div>;

  const completed = progress?.aprobadas || 0;
  const weekly = progress?.semanas || [];
  const correction = weekly.find(week => week.estado_entrega === 'REQUIERE_CORRECCION');
  const lastFeedback = progress?.ultima_retroalimentacion;
  const daysUntilDue = progress?.proxima_actividad?.fecha_limite
    ? Math.ceil((new Date(progress.proxima_actividad.fecha_limite).getTime() - Date.now()) / 86400000)
    : null;

  return <div className="page-stack">
    <header className="page-hero">
      <div className="page-hero-icon"><Target className="h-6 w-6" /></div>
      <div><p className="page-kicker">Mi seguimiento individual</p>
        <h1 className="page-title">{project?.titulo || 'Dashboard académico'}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">Has completado {completed} de 16 semanas. Tu avance se calcula a partir de tus propias entregas aprobadas.</p>
      </div>
    </header>
    {error && <p role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error">No se pudo actualizar el resumen: {error}</p>}
    {!progress && !error && <p role="alert" className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">No se encontró tu seguimiento individual.</p>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="metric-card rounded-2xl border border-border bg-white p-5"><div className="flex items-center gap-2 text-sm text-text-muted"><CheckCircle2 className="h-4 w-4 text-success" />Progreso aprobado</div><p className="mt-3 text-4xl font-bold text-text-primary">{progress?.progreso || 0}%</p><p className="mt-1 text-xs text-text-muted">{completed} de 16 semanas</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-primary-dark to-primary transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${progress?.progreso || 0}%` }} /></div></article>
      <article className="metric-card rounded-2xl border border-border bg-white p-5"><div className="flex items-center gap-2 text-sm text-text-muted"><Clock3 className="h-4 w-4 text-warning" />Próxima actividad</div><p className="mt-3 text-lg font-bold text-text-primary">{correction ? `Corrección · Semana ${correction.numero_semana}` : progress?.proxima_actividad ? `Semana ${progress.proxima_actividad.numero_semana}` : 'Sin pendientes'}</p><p className="mt-1 line-clamp-2 text-sm text-text-muted">{correction?.titulo || progress?.proxima_actividad?.titulo || 'No tienes actividades pendientes disponibles.'}</p></article>
      <article className="metric-card rounded-2xl border border-border bg-white p-5"><div className="flex items-center gap-2 text-sm text-text-muted"><FileUp className="h-4 w-4 text-primary" />Fecha de entrega</div><p className="mt-3 text-lg font-bold text-text-primary">{progress?.proxima_actividad?.fecha_limite ? new Date(progress.proxima_actividad.fecha_limite).toLocaleDateString() : 'Por definir'}</p><p className="mt-1 text-sm text-text-muted">{daysUntilDue === null ? 'Consulta las fechas en Workflow' : daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} días vencida` : `${daysUntilDue} días restantes`}</p></article>
      <article className="metric-card rounded-2xl border border-border bg-white p-5"><div className="flex items-center gap-2 text-sm text-text-muted"><MessageSquareText className="h-4 w-4 text-primary" />Último feedback</div><p className="mt-3 line-clamp-3 text-sm font-medium text-text-primary">{lastFeedback?.texto || 'Aún no hay retroalimentación registrada.'}</p>{lastFeedback && <p className="mt-2 text-xs text-text-muted">Semana {lastFeedback.numero_semana} · {new Date(lastFeedback.fecha).toLocaleDateString()}</p>}</article>
    </section>

    <section className="surface-card rounded-2xl border border-border bg-white p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><div><p className="page-kicker text-primary">Tu ruta de grado</p><h2 className="mt-1 text-xl font-semibold text-text-primary">Avance de las 16 semanas</h2></div><Link to="/workflow" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">Abrir workflow <ArrowRight className="h-4 w-4" /></Link></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {weekly.map(week => {
          const status = week.aprobada ? 'Aprobada · Hecho' :
            week.estado_entrega === 'REQUIERE_CORRECCION' ? 'Corrección solicitada' :
            week.estado_entrega === 'RECHAZADA' ? 'Rechazada' :
            week.estado_entrega === 'EN_REVISION' ? 'En revisión' :
            week.estado_entrega ? 'Enviada' : week.bloqueada ? 'No entregado · Bloqueada' : 'Disponible';
          return <article key={week.id_actividad} className="metric-card rounded-xl border border-border bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Semana {week.numero_semana}</p>
            <p className="mt-2 line-clamp-2 text-sm font-semibold text-text-primary">{week.titulo}</p>
            <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${week.aprobada ? 'bg-success/10 text-success' : week.estado_entrega === 'REQUIERE_CORRECCION' ? 'bg-warning/10 text-warning' : 'bg-white text-text-secondary'}`}>
              {week.aprobada ? <CheckCircle2 className="h-3.5 w-3.5" /> : week.estado_entrega === 'EN_REVISION' ? <Clock3 className="h-3.5 w-3.5" /> : null}{status}
            </p>
            {week.calificacion !== null && <p className="mt-2 text-xs text-text-muted">Nota: {week.calificacion}/5</p>}
          </article>;
        })}
      </div>
    </section>
    <nav className="flex flex-wrap gap-3">
      <Link to="/deliverables" className="action-button inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white"><FileUp className="h-4 w-4" />Mis entregables</Link>
      <Link to="/workflow" className="action-button rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text-primary">Abrir workflow</Link>
    </nav>
  </div>;
}
