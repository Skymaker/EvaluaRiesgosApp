import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { login as loginUser } from '../utils/auth-storage';
import imgImage2 from '@/assets/ad798bea02d5fbca4c6a6593547370567bd6f22c.png';
import logoImage from '../../imports/Logo.png';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await loginUser(formData.username, formData.password);

    if (result.success && result.user) {
      login(result.user);
      navigate('/');
    } else {
      setError(result.message || 'Error al iniciar sesión');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full" style={{ background: 'linear-gradient(148.337deg, rgb(239, 246, 255) 0%, rgb(243, 244, 246) 100%)' }}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="flex gap-12 items-center max-w-[1400px] w-full">
          {/* Imagen izquierda */}
          <div className="hidden lg:block flex-1 max-w-[864px]">
            <img
              src={imgImage2}
              alt="Risk Assessment Illustration"
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Formulario derecha */}
          <div className="w-full max-w-[448px] flex flex-col gap-6">
            {/* Logo y Título */}
            <div className="relative w-full">
              <div className="w-16 h-16 mx-auto mb-5">
                <img
                  src={logoImage}
                  alt="Logo Sistema de Evaluación"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-[30px] font-bold text-[#101828] text-center leading-9">
                Sistema de Evaluación
              </h1>
              <p className="text-[16px] text-[#4a5565] text-center mt-4 leading-6">
                Riesgos Laborales
              </p>
            </div>

            {/* Card de Login */}
            <div className="bg-white rounded-[14px] border border-[rgba(0,0,0,0.1)] overflow-hidden">
              {/* Header del card */}
              <div className="px-6 pt-6 pb-0">
                <h2 className="text-[16px] font-medium text-[#0a0a0a] leading-4">
                  Iniciar Sesión
                </h2>
                <p className="text-[#717182] text-[16px] mt-2 leading-6">
                  Ingresa tus credenciales para acceder al sistema
                </p>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="px-6 pb-6 pt-6">
                <div className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Campo Usuario */}
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-[14px] font-medium text-[#0a0a0a] leading-[14px]">
                      Usuario
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      placeholder="Ingresa tu usuario"
                      autoComplete="username"
                      className="w-full h-9 px-3 py-1 bg-[#f3f3f5] rounded-lg text-[14px] text-[#0a0a0a] placeholder:text-[#717182] border-0 outline-none focus:ring-2 focus:ring-[#155dfc] focus:ring-opacity-50"
                    />
                  </div>

                  {/* Campo Contraseña */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-[14px] font-medium text-[#0a0a0a] leading-[14px]">
                      Contraseña
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      placeholder="Ingresa tu contraseña"
                      autoComplete="current-password"
                      className="w-full h-9 px-3 py-1 bg-[#f3f3f5] rounded-lg text-[14px] text-[#0a0a0a] placeholder:text-[#717182] border-0 outline-none focus:ring-2 focus:ring-[#155dfc] focus:ring-opacity-50"
                    />
                  </div>

                  {/* Botón */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 bg-[#030213] hover:bg-[#1a1a2e] text-white rounded-lg text-[14px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogIn className="w-4 h-4" />
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </button>
                </div>
              </form>
            </div>

            {/* Información de demo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <div className="text-sm space-y-1">
                <div className="font-medium text-blue-900">Usuario de prueba:</div>
                <div className="text-blue-700">
                  <div>Usuario: <span className="font-mono font-semibold">admin</span></div>
                  <div>Contraseña: <span className="font-mono font-semibold">admin123</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
