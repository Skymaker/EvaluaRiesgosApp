import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { Building2, FileText, BarChart3, Users, LogOut, User as UserIcon, Printer, UserCog, Settings, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { hasPermission } from '../utils/auth-storage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import logoImage from '../../imports/Logo.png';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/iniciar-sesion');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/centros', label: 'Centros de Trabajo', icon: Building2 },
    { path: '/evaluaciones', label: 'Evaluaciones', icon: FileText },
  ];

  if (hasPermission(user, 'generar_documentos')) {
    navItems.push({ path: '/impresion', label: 'Impresión de Documentos', icon: Printer });
  }

  // Agregar opción de gestión de puestos para técnicos
  if (user?.role === 'tecnico' || user?.role === 'administrador') {
    navItems.push({ path: '/puestos/categorias', label: 'Puestos de Trabajo', icon: Users });
  }

  // Agregar opción de gestión de usuarios y datos olo para administradores
  if (user?.role === 'administrador') {
    navItems.push({ path: '/gestion', label: 'Gestión', icon: Settings });
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'administrador':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'administrativo':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tecnico':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'administrador':
        return 'Administrador';
      case 'administrativo':
        return 'Administrativo';
      case 'tecnico':
        return 'Técnico de Prevención';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12">
                <img
                  src={logoImage}
                  alt="Logo Sistema de Evaluación"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Evaluapp</h1>
                <p className="text-sm text-gray-500">Sistema de Evaluación de Riesgos Laborales</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden" aria-label="Abrir menú">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0">
                    <SheetHeader className="border-b border-gray-200">
                      <SheetTitle>Menú de navegación</SheetTitle>
                      <SheetDescription>Accede a todas las secciones disponibles.</SheetDescription>
                    </SheetHeader>
                    <div className="px-2 py-3">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                          <Button
                            key={item.path}
                            type="button"
                            variant={isActive ? 'secondary' : 'ghost'}
                            className="w-full justify-start mb-1"
                            onClick={() => {
                              navigate(item.path);
                              setMobileMenuOpen(false);
                            }}
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {item.label}
                          </Button>
                        );
                      })}
                      <div className="mt-4 border-t border-gray-200 pt-3">
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full justify-start mb-1"
                          onClick={() => {
                            navigate('/perfil');
                            setMobileMenuOpen(false);
                          }}
                        >
                          <UserCog className="w-4 h-4 mr-2" />
                          Mi Perfil
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full justify-start text-red-600 hover:text-red-700"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleLogout();
                          }}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Cerrar Sesión
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              )}

              {/* User Menu */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden md:inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors">
                      <UserIcon className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm font-medium">{user.nombre}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col gap-1">
                        <div className="font-medium">{user.nombre}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                        <Badge className={`${getRoleBadgeColor(user.role)} mt-1 w-fit`}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/perfil')}>
                      <UserCog className="w-4 h-4 mr-2" />
                      Mi Perfil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="hidden md:block bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}