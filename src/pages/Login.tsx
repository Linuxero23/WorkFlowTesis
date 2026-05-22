import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Role } from '../types';

export function Login() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('estudiante');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useStore();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Validar email
    if (!email.endsWith('@poligran.edu.co')) {
      setError('El correo debe terminar en @poligran.edu.co');
      setIsLoading(false);
      return;
    }
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const success = login(email, role);
    
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Credenciales inválidas. Usa un correo de ejemplo como juan.perez@poligran.edu.co');
    }
    
    setIsLoading(false);
  };
  
  const roles: { value: Role; label: string }[] = [
    { value: 'estudiante', label: 'Estudiante' },
    { value: 'profesor', label: 'Profesor' },
    { value: 'coordinador', label: 'Coordinador' },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-primary-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">PolyThesis</h1>
          <p className="text-white/70 mt-2">Sistema de Seguimiento de Tesis</p>
        </div>
        
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-6">
            Iniciar Sesión
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Correo institucional
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@poligran.edu.co"
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>
            
            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Rol
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                      role === r.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-error text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
          
          {/* Demo Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-text-primary mb-2">Cuentas de demo:</p>
            <div className="space-y-1 text-xs text-text-muted">
              <p><span className="font-medium">Estudiante:</span> juan.perez@poligran.edu.co</p>
              <p><span className="font-medium">Profesor:</span> maria.lopez@poligran.edu.co</p>
              <p><span className="font-medium">Coordinador:</span> roberto.castro@poligran.edu.co</p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <p className="text-center text-white/50 text-sm mt-6">
          Politécnico Grancolombiano © 2026
        </p>
      </div>
    </div>
  );
}