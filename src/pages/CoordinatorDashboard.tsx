import { useEffect, useState } from 'react';
import { Bell, GraduationCap, Layers3, Users, UserRoundX } from 'lucide-react';
import { useStore } from '../store/useStore';
import { CoordinatorStats } from '../types';
import { apiFetch } from '../utils/api';

const cards = [
  { key: 'total_estudiantes', label: 'Estudiantes activos', icon: GraduationCap, color: 'text-primary' },
  { key: 'total_profesores', label: 'Profesores activos', icon: Users, color: 'text-sky-600' },
  { key: 'grupos_activos', label: 'Grupos activos', icon: Layers3, color: 'text-cyan-600' },
  { key: 'estudiantes_sin_grupo', label: 'Sin grupo', icon: UserRoundX, color: 'text-warning' },
  { key: 'notificaciones_pendientes', label: 'Notificaciones pendientes', icon: Bell, color: 'text-error' },
] as const;

export function CoordinatorDashboard() {
  const { user } = useStore();
  const [stats, setStats] = useState<CoordinatorStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    apiFetch<CoordinatorStats>('/coordinator/stats', user)
      .then(setStats)
      .catch(reason => setError(reason instanceof Error ? reason.message : 'No se pudo cargar el resumen'));
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary-dark to-primary p-6 text-white">
        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-100">Panel administrativo</p>
        <h1 className="mt-2 text-2xl font-bold">Resumen de coordinación</h1>
        <p className="mt-1 max-w-2xl text-white/80">Consulta personas, organiza grupos de tutoría y supervisa la operación académica.</p>
      </div>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(card => {
          const Icon = card.icon;
          return <div key={card.key} className="rounded-xl border border-border bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-text-muted">{card.label}</span><Icon className={`h-5 w-5 ${card.color}`} /></div><p className="mt-3 text-3xl font-bold text-text-primary">{stats?.[card.key] ?? '--'}</p></div>;
        })}
      </div>
      <div className="rounded-xl border border-border bg-white p-6"><h2 className="text-lg font-semibold text-text-primary">Acciones de coordinación</h2><p className="mt-2 text-sm text-text-secondary">Usa la navegación para consultar estudiantes y profesores reales, crear grupos y revisar los módulos disponibles.</p></div>
    </div>
  );
}
