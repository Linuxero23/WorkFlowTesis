import { Role } from '../types';

interface RoleBadgeProps {
  role: Role;
}

const roleConfig = {
  estudiante: {
    label: 'Estudiante',
    bgColor: 'bg-primary',
  },
  profesor: {
    label: 'Profesor',
    bgColor: 'bg-purple-600',
  },
  coordinador: {
    label: 'Coordinador',
    bgColor: 'bg-emerald-600',
  },
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = roleConfig[role];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.bgColor}`}>
      {config.label}
    </span>
  );
}