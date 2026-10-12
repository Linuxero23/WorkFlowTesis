import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChartNoAxesCombined, ClipboardCheck, FolderKanban, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useProfessorAcademicData } from '../hooks/useProfessorAcademicData';
import { useAcademicAccess } from '../hooks/useAcademicAccess';
import { StudentAcademicProgress } from '../types';
import { apiFetch } from '../utils/api';

export function DashboardProfessor() {
  const user = useStore(state => state.user);
  const { access, loading: accessLoading } = useAcademicAccess();
  const { projects, activities, deliveries, loading, error, secondaryErrors } = useProfessorAcademicData(user);
  const [individualProgress, setIndividualProgress] = useState<Record<number, StudentAcademicProgress[]>>({});
  const [progressError, setProgressError] = useState('');
  const pendingDeliveries = deliveries.filter(item => !['APROBADA', 'RECHAZADA', 'REQUIERE_CORRECCION'].includes(item.delivery.estado_revision));
  const pendingActivities = activities.filter(activity => !activity.bloqueada).slice(0, 6);

  useEffect(() => {
    if (!user || !projects.length) return;
    let active = true;
    const load = async () => {
      const entries = await Promise.all(projects.map(async project => {
        try {
          const progress = await apiFetch<StudentAcademicProgress[]>(`/projects/${project.id_proyecto}/student-progress`, user);
          return [project.id_proyecto, progress] as const;
        } catch (loadError) {
          if (active) setProgressError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el progreso individual');
          return [project.id_proyecto, []] as const;
        }
      }));
      if (active) setIndividualProgress(Object.fromEntries(entries));
    };
    void load();
    return () => { active = false; };
  }, [projects, user]);

  const groupProgress = useMemo(() => {
    const allStudents = Object.values(individualProgress).flat();
    const groups = new Map<number | null, StudentAcademicProgress[]>();
    for (const student of allStudents) {
      const members = groups.get(student.id_grupo) || [];
      members.push(student);
      groups.set(student.id_grupo, members);
    }
    return [...groups.entries()].map(([groupId, members]) => ({
      groupId,
      members,
      average: members.length
        ? Math.round(members.reduce((sum, student) => sum + student.progreso, 0) / members.length)
        : 0
    }));
  }, [individualProgress]);

  if (accessLoading || loading) return <div role="status" className="animate-pulse rounded-2xl border border-border bg-white p-8 text-sm text-text-muted">Cargando resumen académico...</div>;

  return <div className="page-stack">
    <header className="page-hero">
      <div className="page-hero-icon"><ChartNoAxesCombined className="h-6 w-6" /></div>
      <div><p className="page-kicker">Vista de acompañamiento</p>
        <h1 className="page-title">Dashboard del profesor</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/75">Progreso individual, actividad de tus grupos y entregas que necesitan revisión.</p>
      </div>
    </header>

    {!access?.hasActiveGroup && <p className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">Aún no tienes grupos de tutoría asignados.</p>}
    {error && <p role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error">No se pudo cargar el resumen: {error}</p>}
    {secondaryErrors.map(message => <p key={message} role="alert" className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-warning">{message}</p>)}
    {progressError && <p role="alert" className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">No se pudo cargar el progreso individual: {progressError}</p>}

    <div className="grid gap-4 sm:grid-cols-3">
      <div className="metric-card rounded-2xl border border-border bg-white p-5"><div className="flex items-center gap-2 text-sm text-text-muted"><FolderKanban className="h-4 w-4 text-primary" />Proyectos asignados</div><p className="mt-3 text-4xl font-bold text-text-primary">{projects.length}</p></div>
      <div className="metric-card rounded-2xl border border-border bg-white p-5"><div className="flex items-center gap-2 text-sm text-text-muted"><ClipboardCheck className="h-4 w-4 text-warning" />Entregas por revisar</div><p className="mt-3 text-4xl font-bold text-text-primary">{pendingDeliveries.length}</p></div>
      <div className="metric-card rounded-2xl border border-border bg-white p-5"><div className="flex items-center gap-2 text-sm text-text-muted"><Users className="h-4 w-4 text-primary" />Estudiantes acompañados</div><p className="mt-3 text-4xl font-bold text-text-primary">{new Set(Object.values(individualProgress).flat().map(student => student.id_usuario)).size}</p></div>
    </div>

    <section className="surface-card rounded-2xl border border-border bg-white p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div><p className="page-kicker text-primary">Vista por integrante</p><h2 className="mt-1 text-xl font-semibold text-text-primary">Progreso individual y promedio del grupo</h2></div>
        <Link to="/students" className="text-sm font-semibold text-primary">Ver estudiantes <ArrowRight className="inline h-4 w-4" /></Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {groupProgress.map(group => {
          const label = projects.find(project => project.id_grupo === group.groupId)?.titulo || 'Proyecto asignado';
          return <article key={group.groupId ?? 'sin-grupo'} className="rounded-2xl border border-border bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{group.groupId === null ? 'Sin grupo' : `Grupo ${group.groupId}`}</p><h3 className="mt-1 font-semibold text-text-primary">{label}</h3></div>
              <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-primary shadow-sm">Promedio {group.average}%</span>
            </div>
            <div className="mt-4 space-y-3">
              {group.members.map(student => <div key={student.id_usuario} className="rounded-xl bg-white p-3">
                <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium text-text-primary">{student.nombre} {student.apellido}</span><span className="text-sm font-semibold text-primary">{student.aprobadas}/16 · {student.progreso}%</span></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-primary-dark to-primary transition-[width] duration-500" style={{ width: `${student.progreso}%` }} /></div>
              </div>)}
            </div>
          </article>;
        })}
        {!groupProgress.length && !progressError && <p className="text-sm text-text-muted">No hay integrantes asociados a los proyectos.</p>}
      </div>
    </section>

    <div className="grid gap-5 lg:grid-cols-2">
      <section className="surface-card rounded-2xl border border-border bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Actividades próximas</h2><Link to="/workflow" className="text-sm font-semibold text-primary">Workflow</Link></div>
        <div className="space-y-2">
          {pendingActivities.map(activity => <div key={activity.id_actividad} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-3"><div><p className="font-medium">{activity.titulo}</p><p className="text-xs text-text-muted">{activity.project.titulo} · Semana {activity.numero_semana}</p></div><span className="rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">Disponible</span></div>)}
          {!pendingActivities.length && <p className="text-sm text-text-muted">No hay actividades grupales disponibles.</p>}
        </div>
      </section>
      <section className="surface-card rounded-2xl border border-border bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Entregas por revisar</h2><Link to="/deliverables" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">Abrir entregables <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="space-y-2">
          {pendingDeliveries.slice(0, 6).map(item => <div key={item.delivery.id_entrega} className="rounded-xl bg-slate-50 p-3"><p className="font-medium">{item.activity.titulo}</p><p className="text-xs text-text-muted">{item.project.titulo} · {item.delivery.estudiante_nombre || 'Estudiante'} · {new Date(item.delivery.fecha_entrega).toLocaleDateString()}</p></div>)}
          {!pendingDeliveries.length && <p className="text-sm text-text-muted">No hay entregas pendientes de revisión.</p>}
        </div>
      </section>
    </div>

    <nav className="flex flex-wrap gap-3">
      <Link to="/students" className="action-button rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white">Estudiantes</Link>
      <Link to="/deliverables" className="action-button rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold">Revisar entregables</Link>
      <Link to="/workflow" className="action-button rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold">Gestionar workflow</Link>
    </nav>
  </div>;
}
