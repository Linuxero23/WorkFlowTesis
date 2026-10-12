import { useMemo, useState } from 'react';
import { DeliveryFile } from '../components/DeliveryFile';
import { AcademicStudentPanel } from '../components/AcademicStudentPanel';
import { useProfessorAcademicData } from '../hooks/useProfessorAcademicData';
import { useStore } from '../store/useStore';
import { apiFetch } from '../utils/api';
import { Delivery } from '../types';
import { ClipboardCheck } from 'lucide-react';

type DeliveryFilter = 'PENDIENTES' | 'REVISADAS';

interface ReviewResponse {
  delivery: Delivery;
  warnings: string[];
}

export function Deliverables() {
  const user = useStore(state => state.user);
  if (user?.role !== 'profesor') return <AcademicStudentPanel />;
  return <ProfessorDeliverables />;
}

function ProfessorDeliverables() {
  const user = useStore(state => state.user);
  const { deliveries, loading, error, secondaryErrors, reload } = useProfessorAcademicData(user);
  const [filter, setFilter] = useState<DeliveryFilter>('PENDIENTES');
  const [grades, setGrades] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [pendingAction, setPendingAction] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');

  const isReviewed = (delivery: Delivery) => ['APROBADA', 'RECHAZADA', 'REQUIERE_CORRECCION'].includes(delivery.estado_revision);
  const filtered = useMemo(
    () => deliveries.filter(item => filter === 'REVISADAS' ? isReviewed(item.delivery) : !isReviewed(item.delivery)),
    [deliveries, filter]
  );

  const review = async (delivery: Delivery, status: string) => {
    if (!user) return;
    const rawGrade = grades[delivery.id_entrega] ?? '';
    const grade = rawGrade.trim() === '' ? undefined : Number(rawGrade);
    if (grade !== undefined && (!Number.isFinite(grade) || grade < 0 || grade > 5)) {
      setActionError('La calificación debe estar entre 0 y 5.');
      return;
    }
    setActionError('');
    setNotice('');
    setPendingAction(delivery.id_entrega);
    try {
      const result = await apiFetch<ReviewResponse>(`/deliveries/${delivery.id_entrega}/review`, user, {
        method: 'PATCH',
        body: JSON.stringify({
          estado_revision: status,
          calificacion: grade,
          retroalimentacion: feedback[delivery.id_entrega] || undefined,
        }),
      });
      setActionError('');
      setFeedback(current => ({ ...current, [delivery.id_entrega]: '' }));
      setNotice(result.warnings.length
        ? `La revisión se guardó. ${result.warnings.join(' ')}`
        : 'La revisión, calificación y retroalimentación se guardaron.');
      reload();
    } catch (reviewError) {
      setActionError(reviewError instanceof Error ? reviewError.message : 'No se pudo guardar la revisión.');
    } finally {
      setPendingAction(null);
    }
  };

  if (loading) return <div className="p-8 text-sm text-text-muted">Cargando entregas...</div>;

  return <div className="page-stack">
    <header className="page-hero">
      <div className="page-hero-icon"><ClipboardCheck className="h-6 w-6" /></div>
      <div><p className="page-kicker">Revisión académica</p><h1 className="page-title">Entregables</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/75">Revisa cada entrega individual, su evidencia y el resultado académico del estudiante.</p></div>
    </header>
    {error && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-4 text-sm text-error">No se pudieron cargar los entregables: {error}</p>}
    {secondaryErrors.map(message => <p key={message} role="alert" className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">{message}</p>)}
    {actionError && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{actionError}</p>}
    {notice && <p role="status" className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">{notice}</p>}

    <div className="flex gap-2" role="tablist" aria-label="Filtrar entregas">
      <button type="button" role="tab" aria-selected={filter === 'PENDIENTES'} onClick={() => setFilter('PENDIENTES')} className={`action-button rounded-xl px-4 py-2.5 text-sm font-semibold ${filter === 'PENDIENTES' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'border border-border bg-white'}`}>Pendientes ({deliveries.filter(item => !isReviewed(item.delivery)).length})</button>
      <button type="button" role="tab" aria-selected={filter === 'REVISADAS'} onClick={() => setFilter('REVISADAS')} className={`action-button rounded-xl px-4 py-2.5 text-sm font-semibold ${filter === 'REVISADAS' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'border border-border bg-white'}`}>Revisadas ({deliveries.filter(item => isReviewed(item.delivery)).length})</button>
    </div>

    <section className="space-y-4">
      {filtered.map(({ delivery, activity, project }) => <article key={delivery.id_entrega} className="surface-card rounded-2xl border border-border bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">{project.titulo} · Semana {activity.numero_semana}</p>
            <h2 className="mt-1 text-lg font-semibold">{activity.titulo}</h2>
            <p className="text-sm text-text-secondary">{delivery.estudiante_nombre || 'Estudiante'}</p>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${delivery.estado_revision === 'APROBADA' ? 'bg-success/10 text-success' : delivery.estado_revision === 'REQUIERE_CORRECCION' ? 'bg-warning/10 text-warning' : delivery.estado_revision === 'RECHAZADA' ? 'bg-error/10 text-error' : 'bg-primary/5 text-primary'}`}>{delivery.estado_revision.replace('_', ' ')}</span>
        </div>
        <div className="mt-4 grid gap-2 text-sm text-text-muted sm:grid-cols-2">
          <p>Fecha: {new Date(delivery.fecha_entrega).toLocaleString()}</p>
          <p>Calificación: {delivery.calificacion ?? 'Sin calificar'}{delivery.calificacion !== null && delivery.calificacion !== undefined ? '/5' : ''}</p>
        </div>
        {delivery.comentario_estudiante && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm">{delivery.comentario_estudiante}</p>}
        {delivery.nombre_archivo && user && <DeliveryFile deliveryId={delivery.id_entrega} fileName={delivery.nombre_archivo} user={user} />}
        {delivery.url_externa && <a href={delivery.url_externa} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm text-primary underline">Abrir enlace enviado</a>}
        {delivery.retroalimentacion && <p className="mt-3 rounded-lg border-l-2 border-primary bg-primary/5 p-3 text-sm"><b>Retroalimentación actual:</b><br />{delivery.retroalimentacion}</p>}

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <label className="text-xs font-medium text-text-muted">Retroalimentación
            <textarea value={feedback[delivery.id_entrega] || ''} onChange={event => setFeedback(current => ({ ...current, [delivery.id_entrega]: event.target.value }))} rows={3} className="mt-1 w-full rounded-lg border border-border p-2 text-sm" placeholder="Escribe observaciones para el estudiante" />
          </label>
          <label className="text-xs font-medium text-text-muted">Calificación (0 a 5, opcional)
            <input type="number" min="0" max="5" step="0.01" value={grades[delivery.id_entrega] ?? delivery.calificacion ?? ''} onChange={event => setGrades(current => ({ ...current, [delivery.id_entrega]: event.target.value }))} className="mt-1 w-full rounded-lg border border-border p-2 text-sm" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={pendingAction === delivery.id_entrega} onClick={() => void review(delivery, 'APROBADA')} className="action-button rounded-lg bg-success px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{pendingAction === delivery.id_entrega ? 'Guardando…' : 'Aprobar'}</button>
          <button type="button" disabled={pendingAction === delivery.id_entrega} onClick={() => void review(delivery, 'REQUIERE_CORRECCION')} className="action-button rounded-lg bg-warning px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50">Solicitar corrección</button>
          <button type="button" disabled={pendingAction === delivery.id_entrega} onClick={() => void review(delivery, 'RECHAZADA')} className="action-button rounded-lg bg-error px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50">Rechazar</button>
        </div>
      </article>)}
      {!filtered.length && !error && <div className="rounded-xl border border-border bg-white p-8 text-center text-sm text-text-muted">No hay entregas en esta categoría.</div>}
    </section>
  </div>;
}
