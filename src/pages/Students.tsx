import { useEffect, useMemo, useState } from 'react';
import { Lock, Unlock, UserRound } from 'lucide-react';
import { DirectoryUser, StudentAcademicProgress, WorkGroup } from '../types';
import { apiFetch } from '../utils/api';
import { useStore } from '../store/useStore';
import { useProfessorAcademicData } from '../hooks/useProfessorAcademicData';
import { AcademicStudentPanel } from '../components/AcademicStudentPanel';

interface GroupDetail extends WorkGroup {
  estudiantes: DirectoryUser[];
}

export function Students() {
  const user = useStore(state => state.user);
  if (user?.role !== 'profesor') return <AcademicStudentPanel />;
  return <ProfessorStudents />;
}

function ProfessorStudents() {
  const user = useStore(state => state.user);
  const { projects, loading: academicLoading, error: academicError, secondaryErrors } = useProfessorAcademicData(user);
  const [groups, setGroups] = useState<GroupDetail[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [progressByProject, setProgressByProject] = useState<Record<number, StudentAcademicProgress[]>>({});

  useEffect(() => {
    let active = true;
    const loadGroups = async () => {
      if (!user) {
        setGroupsLoading(false);
        return;
      }
      setGroupsLoading(true);
      setGroupsError('');
      try {
        const assigned = await apiFetch<WorkGroup[]>('/groups', user);
        const details = await Promise.all(assigned.map(group => apiFetch<GroupDetail>(`/groups/${group.id_grupo}`, user)));
        if (active) {
          setGroups(details);
          setSelectedStudent(current => current ?? details[0]?.estudiantes[0]?.id_usuario ?? null);
        }
      } catch (error) {
        if (active) setGroupsError(error instanceof Error ? error.message : 'No se pudieron cargar los grupos');
      } finally {
        if (active) setGroupsLoading(false);
      }
    };
    void loadGroups();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!user || !projects.length) return;
    let active = true;
    const loadIndividualProgress = async () => {
      const results = await Promise.all(projects.map(async project => {
        try {
          const progress = await apiFetch<StudentAcademicProgress[]>(`/projects/${project.id_proyecto}/student-progress`, user);
          return [project.id_proyecto, progress] as const;
        } catch (error) {
          if (active) setGroupsError(error instanceof Error ? error.message : 'No se pudo consultar el avance individual');
          return [project.id_proyecto, []] as const;
        }
      }));
      if (active) setProgressByProject(Object.fromEntries(results));
    };
    void loadIndividualProgress();
    return () => { active = false; };
  }, [projects, user]);

  const roster = useMemo(() => groups.flatMap(group => group.estudiantes.map(student => ({ group, student }))), [groups]);
  const selected = roster.find(item => item.student.id_usuario === selectedStudent);
  const project = selected ? projects.find(item => item.id_grupo === selected.group.id_grupo) : undefined;
  const selectedProgress = project ? progressByProject[project.id_proyecto]?.find(item => item.id_usuario === selectedStudent) : undefined;
  const studentActivities = selectedProgress?.semanas || [];
  const pendingCount = selectedProgress?.entregas_pendientes || 0;
  const reviewedCount = selectedProgress?.entregas_revisadas || 0;
  const rosterLoading = projects.some(item => item.id_grupo && !progressByProject[item.id_proyecto]);
  const loading = academicLoading || groupsLoading;

  if (loading) return <div className="p-8 text-sm text-text-muted">Cargando estudiantes y grupos asignados...</div>;
  return <div className="page-stack">
    <header className="page-hero">
      <div className="page-hero-icon"><UserRound className="h-6 w-6" /></div>
      <div><p className="page-kicker">Acompañamiento académico</p>
      <h1 className="page-title">Mis estudiantes</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/75">Explora el avance individual de cada integrante, incluso cuando comparten proyecto y grupo.</p></div>
    </header>
    {(groupsError || academicError) && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-4 text-sm text-error">{groupsError || academicError}</p>}
    {secondaryErrors.map(message => <p key={message} role="alert" className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">{message}</p>)}
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_1.6fr]">
      <section className="surface-card rounded-2xl border border-border bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">Grupos y estudiantes</h2>
        <div className="space-y-4">
          {groups.map(group => <div key={group.id_grupo}>
            <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">{group.nombre}</h3><span className="text-xs text-text-muted">{group.estudiantes.length} estudiantes</span></div>
            <div className="space-y-1">
              {group.estudiantes.map(student => {
                const studentProject = projects.find(item => item.id_grupo === group.id_grupo);
                const individual = studentProject ? progressByProject[studentProject.id_proyecto]?.find(item => item.id_usuario === student.id_usuario) : undefined;
                return <button key={student.id_usuario} type="button" onClick={() => setSelectedStudent(student.id_usuario)} className={`student-roster-item w-full rounded-xl p-3 text-left ${selectedStudent === student.id_usuario ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-gray-50 hover:bg-white hover:shadow-sm'}`}>
                  <div className="flex items-center justify-between gap-2"><p className="font-medium">{student.nombre} {student.apellido}</p><span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-primary">{individual ? `${individual.progreso}%` : '…'}</span></div>
                  <p className="mt-1 truncate text-xs text-text-muted">{studentProject?.titulo || 'Proyecto no disponible'}</p>
                  <p className="mt-1 text-xs text-text-muted">{individual ? `${individual.aprobadas}/16 aprobadas` : 'Cargando avance individual'}</p>
                </button>;
              })}
            </div>
          </div>)}
          {!groups.length && !groupsError && <p className="text-sm text-text-muted">No tienes grupos de estudiantes asignados.</p>}
        </div>
      </section>

      <main className="space-y-5">
        {selected && <section key={selected.student.id_usuario} className="student-detail surface-card rounded-2xl border border-border bg-white p-5 sm:p-7">
          <p className="page-kicker text-primary">{selected.group.nombre}</p>
          <h2 className="mt-1 text-2xl font-bold text-text-primary">{selected.student.nombre} {selected.student.apellido}</h2>
          <p className="text-sm text-text-muted">{selected.student.correo}</p>
          {project && selectedProgress ? <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="metric-card rounded-xl border border-border bg-slate-50 p-4"><p className="text-xs text-text-muted">Proyecto</p><p className="mt-2 font-semibold text-text-primary">{project.titulo}</p></div>
              <div className="metric-card rounded-xl border border-border bg-slate-50 p-4"><p className="text-xs text-text-muted">Progreso individual</p><p className="mt-2 text-2xl font-bold text-primary">{selectedProgress.progreso}%</p><p className="text-xs text-text-muted">{selectedProgress.aprobadas}/16 aprobadas</p></div>
              <div className="metric-card rounded-xl border border-border bg-slate-50 p-4"><p className="text-xs text-text-muted">Entregas por revisar</p><p className="mt-2 text-2xl font-bold text-warning">{pendingCount}</p></div>
              <div className="metric-card rounded-xl border border-border bg-slate-50 p-4"><p className="text-xs text-text-muted">Entregas revisadas</p><p className="mt-2 text-2xl font-bold text-success">{reviewedCount}</p></div>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-primary-dark to-primary transition-[width] duration-500" style={{ width: `${selectedProgress.progreso}%` }} /></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-4"><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Próxima actividad disponible</p><p className="mt-2 font-semibold text-text-primary">{selectedProgress.proxima_actividad ? `Semana ${selectedProgress.proxima_actividad.numero_semana} · ${selectedProgress.proxima_actividad.titulo}` : 'No hay actividades pendientes disponibles'}</p>{selectedProgress.proxima_actividad?.fecha_limite && <p className="mt-1 text-xs text-text-muted">Límite: {new Date(selectedProgress.proxima_actividad.fecha_limite).toLocaleDateString()}</p>}</div>
              <div className="rounded-xl border border-border p-4"><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Última retroalimentación</p><p className="mt-2 text-sm text-text-primary">{selectedProgress.ultima_retroalimentacion?.texto || 'No hay retroalimentación registrada todavía.'}</p></div>
            </div>
            <div className="mt-5">
              <h3 className="mb-3 font-semibold text-text-primary">Avance individual por semana</h3>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {studentActivities.map(activity => <div key={activity.id_actividad} className="metric-card rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-semibold uppercase text-primary">Semana {activity.numero_semana}</p><p className="mt-1 font-semibold text-text-primary">{activity.titulo}</p></div><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${activity.aprobada ? 'bg-success/10 text-success' : activity.estado_entrega === 'REQUIERE_CORRECCION' ? 'bg-warning/10 text-warning' : activity.estado_entrega ? 'bg-primary/5 text-primary' : 'bg-slate-100 text-text-muted'}`}>{activity.aprobada ? 'Aprobado · Hecho' : activity.estado_entrega === 'REQUIERE_CORRECCION' ? 'Corrección' : activity.estado_entrega === 'RECHAZADA' ? 'Rechazado' : activity.estado_entrega === 'EN_REVISION' ? 'En revisión' : activity.estado_entrega ? 'Enviado' : 'No entregado'}</span></div>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-text-muted">{activity.bloqueada ? <><Lock className="h-3.5 w-3.5" />Bloqueada para el grupo</> : <><Unlock className="h-3.5 w-3.5" />Disponible para entregar</>}{activity.calificacion !== null && activity.calificacion !== undefined ? ` · Nota ${activity.calificacion}/5` : ''}</p>
                  {activity.retroalimentacion && <p className="mt-2 border-t border-border pt-2 text-xs text-text-secondary">{activity.retroalimentacion}</p>}
                </div>)}
                {!studentActivities.length && <p className="text-sm text-text-muted">No se encontraron actividades para este proyecto.</p>}
              </div>
            </div>
          </> : project ? <p className="mt-4 text-sm text-text-muted">{rosterLoading ? 'Cargando progreso individual desde el servidor...' : 'No se encontró el progreso individual de este estudiante.'}</p> : <p className="mt-4 text-sm text-warning">Este grupo no tiene un proyecto asociado en los datos consultados.</p>}
        </section>}
        {!selected && <section className="rounded-xl border border-border bg-white p-8 text-center text-sm text-text-muted">Selecciona un estudiante para consultar su avance.</section>}
      </main>
    </div>
  </div>;
}
