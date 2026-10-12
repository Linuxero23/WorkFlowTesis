import { useEffect, useState } from 'react';
import { Activity, AcademicProject, Delivery, User } from '../types';
import { apiFetch } from '../utils/api';

export interface ProfessorActivity extends Activity {
  project: AcademicProject;
}

export interface ProfessorDelivery {
  delivery: Delivery;
  activity: Activity;
  project: AcademicProject;
}

export function useProfessorAcademicData(user: User | null) {
  const [projects, setProjects] = useState<AcademicProject[]>([]);
  const [activities, setActivities] = useState<ProfessorActivity[]>([]);
  const [deliveries, setDeliveries] = useState<ProfessorDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [secondaryErrors, setSecondaryErrors] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) {
        setProjects([]);
        setActivities([]);
        setDeliveries([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setSecondaryErrors([]);
      try {
        const nextProjects = await apiFetch<AcademicProject[]>('/projects/tutored', user);
        if (!active) return;
        setProjects(nextProjects);

        const problems: string[] = [];
        const activityResults = await Promise.all(nextProjects.map(async project => {
          try {
            const rows = await apiFetch<Activity[]>(`/projects/${project.id_proyecto}/activities`, user);
            return rows.map(activity => ({ ...activity, project }));
          } catch (loadError) {
            problems.push(`Actividades de ${project.titulo}: ${loadError instanceof Error ? loadError.message : 'error de carga'}`);
            return [];
          }
        }));
        const nextActivities = activityResults.flat();
        if (!active) return;
        setActivities(nextActivities);

        const deliveryResults = await Promise.all(nextActivities.map(async item => {
          try {
            const rows = await apiFetch<Delivery[]>(`/activities/${item.id_actividad}/deliveries`, user);
            return rows.map(delivery => ({ delivery, activity: item, project: item.project }));
          } catch (loadError) {
            problems.push(`Entregas de ${item.titulo}: ${loadError instanceof Error ? loadError.message : 'error de carga'}`);
            return [];
          }
        }));
        if (!active) return;
        setDeliveries(deliveryResults.flat());
        setSecondaryErrors(problems);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los proyectos del profesor');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [user, refreshKey]);

  return {
    projects,
    activities,
    deliveries,
    loading,
    error,
    secondaryErrors,
    reload: () => setRefreshKey(value => value + 1),
  };
}
