import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/auth-storage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  if (permission && !hasPermission(user, permission)) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }

  if (user?.mustChangePassword && location.pathname !== '/perfil') {
    return <Navigate to="/perfil" replace />;
  }

  return <>{children}</>;
}
