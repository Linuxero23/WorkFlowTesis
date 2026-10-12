import { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { useStore } from '../store/useStore';
import { DirectoryUser } from '../types';
import { apiFetch } from '../utils/api';

export function CoordinatorProfessors() {
  const { user } = useStore();
  const [professors, setProfessors] = useState<DirectoryUser[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { if (user) apiFetch<DirectoryUser[]>('/users?role=PROFESOR', user).then(setProfessors).catch(reason => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar profesores')); }, [user]);
  const filtered = useMemo(() => professors.filter(professor => `${professor.nombre} ${professor.apellido} ${professor.correo}`.toLowerCase().includes(search.toLowerCase())), [professors, search]);
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Directorio institucional</p><h1 className="text-2xl font-bold text-text-primary">Profesores</h1><p className="mt-1 text-sm text-text-secondary">{professors.length} profesores activos consultados desde SQL Server.</p></div><div className="relative w-full sm:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar nombre o correo" className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-3 text-sm" /></div></div>{error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(professor => <article key={professor.id_usuario} className="rounded-xl border border-border bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-cyan-700"><Users className="h-5 w-5" /></div><div className="min-w-0"><h2 className="font-semibold text-text-primary">{professor.nombre} {professor.apellido}</h2><p className="truncate text-sm text-text-secondary">{professor.correo}</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-text-muted">Estudiantes</p><p className="mt-1 text-xl font-bold text-primary">{professor.estudiantes_asignados ?? 0}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-text-muted">Grupos</p><p className="mt-1 text-xl font-bold text-primary">{professor.grupos_tutorizados ?? 0}</p></div></div></article>)}</div>{!filtered.length && <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center text-sm text-text-muted">No hay profesores que coincidan con la búsqueda.</div>}</div>;
}
