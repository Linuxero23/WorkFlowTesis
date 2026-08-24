import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { Role } from '../types';

type PublicRole = Extract<Role, 'estudiante' | 'profesor' | 'coordinador'>;

const roles: { value: PublicRole; label: string; apiValue: string }[] = [
  { value: 'estudiante', label: 'Estudiante', apiValue: 'ESTUDIANTE' },
  { value: 'profesor', label: 'Profesor', apiValue: 'PROFESOR' },
  { value: 'coordinador', label: 'Coordinador', apiValue: 'COORDINADOR' },
];

export function Register() {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    confirmPassword: '',
    rol: 'estudiante' as PublicRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const updateField = (field: keyof typeof form, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const selectedRole = roles.find(role => role.value === form.rol);
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          apellido: form.apellido,
          correo: form.correo,
          password: form.password,
          rol: selectedRole?.apiValue,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || 'No se pudo crear la cuenta');
        return;
      }

      navigate('/login');
    } catch {
      setError('No se pudo conectar con el servidor. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crea tu cuenta"
      description="Regístrate con tu correo institucional y empieza a organizar tu proyecto de grado."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="register-name" className="mb-2 block text-sm font-semibold text-text-primary">Nombre</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" aria-hidden="true" />
              <input id="register-name" type="text" value={form.nombre} onChange={event => updateField('nombre', event.target.value)} autoComplete="given-name" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10" required />
            </div>
          </div>
          <div>
            <label htmlFor="register-lastname" className="mb-2 block text-sm font-semibold text-text-primary">Apellido</label>
            <input id="register-lastname" type="text" value={form.apellido} onChange={event => updateField('apellido', event.target.value)} autoComplete="family-name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10" required />
          </div>
        </div>

        <div>
          <label htmlFor="register-email" className="mb-2 block text-sm font-semibold text-text-primary">Correo institucional</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <input id="register-email" type="email" value={form.correo} onChange={event => updateField('correo', event.target.value)} placeholder="tu.correo@poligran.edu.co" autoComplete="email" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10" required />
          </div>
        </div>

        <div>
          <label htmlFor="register-password" className="mb-2 block text-sm font-semibold text-text-primary">Contraseña</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <input id="register-password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={event => updateField('password', event.target.value)} autoComplete="new-password" minLength={8} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10" required />
            <button type="button" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-text-muted hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="register-confirm-password" className="mb-2 block text-sm font-semibold text-text-primary">Confirmar contraseña</label>
          <div className="relative">
            <input id="register-confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={event => updateField('confirmPassword', event.target.value)} autoComplete="new-password" minLength={8} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-12 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10" required />
            <button type="button" onClick={() => setShowConfirmPassword(current => !current)} aria-label={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-text-muted hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30">
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 block text-sm font-semibold text-text-primary">Rol</legend>
          <div className="grid grid-cols-3 gap-2">
            {roles.map(role => (
              <button key={role.value} type="button" onClick={() => updateField('rol', role.value)} aria-pressed={form.rol === role.value} className={`rounded-xl border px-2 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-4 focus:ring-primary/20 ${form.rol === role.value ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-text-secondary hover:border-primary/40 hover:bg-primary/5'}`}>
                {role.label}
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60">
          {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-text-secondary">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-bold text-primary underline-offset-4 hover:text-primary-dark hover:underline">Iniciar sesión</Link>
      </p>
    </AuthLayout>
  );
}
