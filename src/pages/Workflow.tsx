import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock3, Loader2, Lock, Unlock,
  ChevronLeft, ChevronRight, FileCheck2
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Activity, AcademicProject, StudentAcademicProgress, StudentActivityProgress } from '../types';
import { apiFetch } from '../utils/api';
import { DeliveryFile } from '../components/DeliveryFile';

type LockMutationResponse = { id_actividad: number; bloqueada: boolean; warnings?: string[] };

const deliveryLabel: Record<string, string> = {
  NO_ENTREGADO: 'No entregado',
  ENVIADA: 'Enviado',
  EN_REVISION: 'En revisión',
  REQUIERE_CORRECCION: 'Corrección solicitada',
  APROBADA: 'Aprobado · Hecho',
  RECHAZADA: 'Rechazado'
};

function deliveryStatus(week?: StudentActivityProgress): string {
  if (!week?.id_entrega) return 'NO_ENTREGADO';
  return week.aprobada ? 'APROBADA' : week.estado_entrega || 'ENVIADA';
}

function statusIcon(status: string, blocked: boolean) {
  if (status === 'APROBADA') return <CheckCircle2 aria-hidden="true" className="h-4 w-4" />;
  if (status === 'EN_REVISION' || status === 'ENVIADA') return <Clock3 aria-hidden="true" className="h-4 w-4" />;
  if (status === 'REQUIERE_CORRECCION' || status === 'RECHAZADA') return <AlertTriangle aria-hidden="true" className="h-4 w-4" />;
  return blocked ? <Lock aria-hidden="true" className="h-4 w-4" /> : <Unlock aria-hidden="true" className="h-4 w-4" />;
}

function statusStyle(status: string) {
  if (status === 'APROBADA') return 'border-success/30 bg-success/10 text-success';
  if (status === 'EN_REVISION' || status === 'ENVIADA') return 'border-warning/30 bg-warning/10 text-warning';
  if (status === 'REQUIERE_CORRECCION' || status === 'RECHAZADA') return 'border-error/25 bg-error/5 text-error';
  return 'border-primary/20 bg-primary/5 text-primary';
}

export function Workflow() {
  const { user } = useStore();
  const [projects, setProjects] = useState<AcademicProject[]>([]);
  const [project, setProject] = useState<AcademicProject | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentAcademicProgress[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const isProfessor = user?.role === 'profesor';

  useEffect(() => {
    let active = true;
    const loadProjects = async () => {
      if (!user) return;
      setLoadingProjects(true);
      try {
        const rows = user.role === 'estudiante'
          ? [await apiFetch<AcademicProject>(`/projects/student/${user.id}`, user)]
          : await apiFetch<AcademicProject[]>('/projects/tutored', user);
        if (!active) return;
        setProjects(rows);
        setProject(current => current ? rows.find(row => row.id_proyecto === current.id_proyecto) || rows[0] || null : rows[0] || null);
        setNotice('');
      } catch (error) {
        if (active) {
          setNotice(error instanceof Error ? error.message : 'No se pudieron cargar los proyectos');
          setNoticeIsError(true);
        }
      } finally {
        if (active) setLoadingProjects(false);
      }
    };
    void loadProjects();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    let active = true;
    if (!user || !project) {
      setActivities([]);
      setStudentProgress([]);
      return () => { active = false; };
    }

    const load = async () => {
      setLoadingWorkflow(true);
      setActivities([]);
      setStudentProgress([]);
      try {
        const [nextActivities, progress] = await Promise.all([
          apiFetch<Activity[]>(`/projects/${project.id_proyecto}/activities`, user),
          apiFetch<StudentAcademicProgress[]>(`/projects/${project.id_proyecto}/student-progress`, user)
        ]);
        if (!active) return;
        setActivities(nextActivities.filter(activity => activity.es_semana_base));
        setStudentProgress(progress);
        setNotice('');
        setNoticeIsError(false);
        const defaultStudentId = user.role === 'estudiante' ? Number(user.id) : progress[0]?.id_usuario;
        setSelectedStudentId(current =>
          progress.some(student => student.id_usuario === current) ? current : defaultStudentId ?? null
        );
        setSelectedWeek(current =>
          current && nextActivities.some(activity => activity.es_semana_base && activity.numero_semana === current)
            ? current
            : nextActivities.find(activity => activity.es_semana_base)?.numero_semana ?? null
        );
      } catch (error) {
        if (active) {
          setNotice(error instanceof Error ? error.message : 'No se pudo cargar el workflow del estudiante');
          setNoticeIsError(true);
        }
      } finally {
        if (active) setLoadingWorkflow(false);
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 12000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user, project?.id_proyecto]);

  const selectedStudent = studentProgress.find(student => student.id_usuario === selectedStudentId);
  const currentWeekData = selectedStudent?.semanas.find(week => week.numero_semana === selectedWeek);
  const selectedActivity = activities.find(activity => activity.numero_semana === selectedWeek);
  const activityWeeks = useMemo(() => activities.slice().sort((left, right) => left.numero_semana - right.numero_semana), [activities]);

  const setLock = async (activity: Activity, blocked: boolean) => {
    if (!user || !isProfessor || saving[activity.id_actividad]) return;
    setSaving(current => ({ ...current, [activity.id_actividad]: true }));
    setNotice('');
    setNoticeIsError(false);
    try {
      const result = await apiFetch<LockMutationResponse>(
        `/activities/${activity.id_actividad}/${blocked ? 'lock' : 'unlock'}`,
        user,
        { method: 'PATCH' }
      );
      setActivities(current => current.map(row => row.id_actividad === activity.id_actividad
        ? { ...row, bloqueada: result.bloqueada }
        : row));
      setStudentProgress(current => current.map(student => ({
        ...student,
        semanas: student.semanas.map(week => week.id_actividad === activity.id_actividad
          ? { ...week, bloqueada: result.bloqueada }
          : week)
      })));
      setNotice(result.warnings?.join(' ') || `Actividad ${result.bloqueada ? 'bloqueada' : 'disponible'} para el grupo.`);
      try {
        const fresh = await apiFetch<Activity[]>(`/projects/${activity.id_proyecto}/activities`, user);
        const updated = fresh.find(row => row.id_actividad === activity.id_actividad);
        if (updated) {
          setActivities(current => current.map(row => row.id_actividad === updated.id_actividad ? updated : row));
          setStudentProgress(current => current.map(student => ({
            ...student,
            semanas: student.semanas.map(week => week.id_actividad === updated.id_actividad
              ? { ...week, bloqueada: updated.bloqueada }
              : week)
          })));
        }
      } catch (error) {
        setNotice(`El cambio se guardó; no se pudo sincronizar la disponibilidad: ${error instanceof Error ? error.message : 'error de carga'}`);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo cambiar la disponibilidad');
      setNoticeIsError(true);
    } finally {
      setSaving(current => ({ ...current, [activity.id_actividad]: false }));
    }
  };

  if (loadingProjects) return <div role="status" className="animate-pulse rounded-2xl border border-border bg-white p-6 text-sm text-text-muted">Cargando proyectos...</div>;

  return <div className="page-stack">
    <header className="page-hero">
      <div className="page-hero-icon"><FileCheck2 className="h-6 w-6" /></div>
      <div>
        <p className="page-kicker">{isProfessor ? 'Seguimiento por estudiante' : 'Mi avance académico'}</p>
        <h1 className="page-title">Workflow académico</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/75">La disponibilidad pertenece a la actividad del grupo; las entregas, revisiones y semanas aprobadas son individuales.</p>
      </div>
    </header>

    {notice && <p role={noticeIsError ? 'alert' : 'status'} className={`rounded-xl border p-4 text-sm ${noticeIsError ? 'border-error/30 bg-error/5 text-error' : 'border-primary/20 bg-white text-primary shadow-sm'}`}>{notice}</p>}

    <section className="surface-card grid gap-4 rounded-2xl border border-border bg-white p-5 md:grid-cols-2">
      <label className="block text-sm font-semibold text-text-primary">Proyecto
        <select value={project?.id_proyecto || ''} onChange={event => setProject(projects.find(row => row.id_proyecto === Number(event.target.value)) || null)} className="form-control mt-2">
          {projects.map(row => <option key={row.id_proyecto} value={row.id_proyecto}>{row.titulo}</option>)}
        </select>
      </label>
      {isProfessor && <label className="block text-sm font-semibold text-text-primary">Estudiante
        <select value={selectedStudentId || ''} onChange={event => setSelectedStudentId(Number(event.target.value))} className="form-control mt-2">
          {studentProgress.map(student => <option key={student.id_usuario} value={student.id_usuario}>{student.nombre} {student.apellido} · {student.correo}</option>)}
        </select>
      </label>}
      {!isProfessor && <div className="flex items-end text-sm text-text-muted">Cada entrega y su revisión solo afectan tu propio progreso.</div>}
    </section>

    {loadingWorkflow && <p role="status" className="rounded-xl bg-white/80 p-3 text-sm text-text-muted">Sincronizando progreso...</p>}
    {project && selectedStudent && <section key={`${project.id_proyecto}-${selectedStudent.id_usuario}`} className="workflow-person-panel surface-card rounded-2xl border border-border bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="page-kicker text-primary">{selectedStudent.nombre} {selectedStudent.apellido}</p>
          <h2 className="mt-1 text-xl font-bold text-text-primary">{project.titulo}</h2>
          <p className="mt-1 text-sm text-text-muted">{selectedStudent.aprobadas} de 16 semanas aprobadas · {selectedStudent.progreso}%</p>
        </div>
        <span className="rounded-full bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">{selectedStudent.entregas_pendientes} por revisar · {selectedStudent.entregas_revisadas} revisadas</span>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`Progreso de ${selectedStudent.nombre}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={selectedStudent.progreso}>
        <div className="h-full rounded-full bg-gradient-to-r from-primary-dark to-primary transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${selectedStudent.progreso}%` }} />
      </div>
      <div className="mt-8 overflow-x-auto pb-3">
        <div className="relative flex min-w-max items-center gap-3 px-3 before:absolute before:left-7 before:right-7 before:top-1/2 before:h-0.5 before:-translate-y-1/2 before:bg-slate-200 before:content-[''] sm:gap-5">
          {activityWeeks.map(activity => {
            const studentWeek = selectedStudent.semanas.find(week => week.id_actividad === activity.id_actividad);
            const status = deliveryStatus(studentWeek);
            const active = activity.numero_semana === selectedWeek;
            const palette = statusStyle(status);
            return <button type="button" key={activity.id_actividad} onClick={() => setSelectedWeek(activity.numero_semana)} aria-pressed={active} aria-label={`Semana ${activity.numero_semana}: ${deliveryLabel[status]}, ${activity.bloqueada ? 'bloqueada' : 'disponible'}`}
              className={`relative z-10 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-16 sm:w-16 ${active ? 'scale-110 border-primary bg-primary text-white shadow-lg shadow-primary/20' : `${palette} hover:-translate-y-1 hover:shadow-md`}`}>
              <span className="text-sm font-bold">{activity.numero_semana}</span>
              <span className="mt-0.5">{statusIcon(status, activity.bloqueada)}</span>
            </button>;
          })}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {['NO_ENTREGADO', 'ENVIADA', 'EN_REVISION', 'REQUIERE_CORRECCION', 'APROBADA', 'RECHAZADA'].map(status => <span key={status} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle(status)}`}>{deliveryLabel[status]}</span>)}
      </div>
    </section>}

    {!project && <p className="surface-card rounded-2xl border border-border bg-white p-8 text-center text-sm text-text-muted">No hay proyectos asignados.</p>}
    {project && !selectedStudent && !loadingWorkflow && <p className="surface-card rounded-2xl border border-border bg-white p-8 text-center text-sm text-text-muted">No se encontraron estudiantes vinculados a este proyecto.</p>}

    {selectedActivity && selectedStudent && <div className="flex items-center justify-between gap-3">
      <button disabled={selectedWeek === activityWeeks[0]?.numero_semana} onClick={() => setSelectedWeek((selectedWeek || 1) - 1)} className="action-button inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:opacity-40 sm:px-4"><ChevronLeft className="h-4 w-4" />Anterior</button>
      <span className="text-center text-sm font-semibold text-text-primary">Semana {selectedActivity.numero_semana}</span>
      <button disabled={selectedWeek === activityWeeks[activityWeeks.length - 1]?.numero_semana} onClick={() => setSelectedWeek((selectedWeek || 1) + 1)} className="action-button inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:opacity-40 sm:px-4">Siguiente<ChevronRight className="h-4 w-4" /></button>
    </div>}

    {selectedActivity && selectedStudent && <article key={`${selectedStudent.id_usuario}-${selectedActivity.id_actividad}`} className="workflow-detail surface-card rounded-2xl border border-border bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="page-kicker text-primary">Semana {selectedActivity.numero_semana}</p><h2 className="mt-1 text-xl font-semibold text-text-primary">{selectedActivity.titulo}</h2><p className="mt-2 max-w-2xl text-sm text-text-secondary">{selectedActivity.descripcion}</p></div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${statusStyle(deliveryStatus(currentWeekData))}`}>
          {statusIcon(deliveryStatus(currentWeekData), selectedActivity.bloqueada)}{deliveryLabel[deliveryStatus(currentWeekData)]}
        </span>
      </div>
      <div className="mt-5 grid gap-3 border-t border-border pt-4 text-sm text-text-muted sm:grid-cols-2">
        <p>Fecha límite: {selectedActivity.fecha_limite ? new Date(selectedActivity.fecha_limite).toLocaleDateString() : 'Sin fecha'}</p>
        <p className="inline-flex items-center gap-2">Disponibilidad del grupo: {selectedActivity.bloqueada ? <><Lock className="h-4 w-4" />Bloqueada</> : <><Unlock className="h-4 w-4" />Disponible</>}</p>
      </div>
      {currentWeekData?.id_entrega && <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Entrega</p><p className="mt-1 font-medium text-text-primary">{currentWeekData.nombre_archivo || currentWeekData.url_externa || currentWeekData.comentario_estudiante || 'Envío registrado'}</p><p className="mt-1 text-xs text-text-muted">{currentWeekData.fecha_entrega ? new Date(currentWeekData.fecha_entrega).toLocaleString() : ''}</p></div>
        {currentWeekData.nombre_archivo && currentWeekData.id_entrega && user && <DeliveryFile deliveryId={currentWeekData.id_entrega} fileName={currentWeekData.nombre_archivo} user={user} />}
        <div><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Resultado</p><p className="mt-1 font-semibold text-text-primary">{currentWeekData.calificacion === null ? deliveryLabel[deliveryStatus(currentWeekData)] : `${currentWeekData.calificacion}/5 · ${deliveryLabel[deliveryStatus(currentWeekData)]}`}</p>{currentWeekData.retroalimentacion && <p className="mt-1 text-sm text-text-secondary">{currentWeekData.retroalimentacion}</p>}</div>
      </div>}
      {isProfessor && <div className="mt-5 border-t border-border pt-4">
        <button disabled={!!saving[selectedActivity.id_actividad]} onClick={() => void setLock(selectedActivity, !selectedActivity.bloqueada)} className="action-button inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {saving[selectedActivity.id_actividad] ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : selectedActivity.bloqueada ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {selectedActivity.bloqueada ? 'Desbloquear para el grupo' : 'Bloquear para el grupo'}
        </button>
        <p className="mt-2 text-xs text-text-muted">El candado aplica al grupo. Para cambiar el estado individual, revisa la entrega en Entregables.</p>
      </div>}
    </article>}
  </div>;
}
