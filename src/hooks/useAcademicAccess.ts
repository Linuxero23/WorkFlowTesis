import { useEffect, useState } from 'react';
import { AcademicAccess } from '../types';
import { useStore } from '../store/useStore';
import { apiFetch } from '../utils/api';

export function useAcademicAccess() {
  const user = useStore(state => state.user);
  const [access, setAccess] = useState<AcademicAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user || user.role === 'coordinador') { setAccess({ hasActiveGroup: true, role: user?.role || '', group: null }); setLoading(false); return () => { active = false; }; }
    setLoading(true);
    apiFetch<AcademicAccess>(`/users/${user.id}/academic-access`, user)
      .then(value => { if (active) setAccess(value); })
      .catch(() => { if (active) setAccess({ hasActiveGroup: false, role: user.role.toUpperCase(), group: null }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  return { access, loading };
}