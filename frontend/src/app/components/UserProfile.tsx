import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { User as UserIcon, Mail, Lock, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { IfInformationUI, useUiPreferences } from '../contexts/UiPreferencesContext';
import { saveUser, updateCurrentUser } from '../utils/auth-storage';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { apiRequest } from '../utils/api-client';

export function UserProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { showInformationUI, setShowInformationUI } = useUiPreferences();
  const isPasswordChangeRequired = Boolean(user?.mustChangePassword);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState(isPasswordChangeRequired ? 'password' : 'profile');

  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (isPasswordChangeRequired) {
      setActiveTab('password');
    }
  }, [isPasswordChangeRequired]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const updatedUser = {
        ...user,
        nombre: profileData.nombre,
        email: profileData.email,
      };

      await saveUser(updatedUser);
      updateCurrentUser(updatedUser);
      updateUser(updatedUser);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el perfil');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Validar que las contraseñas coincidan
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // Validar longitud mínima
    if (passwordData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      toast.error('La nueva contraseña no puede ser igual a la anterior');
      return;
    }

    try {
      await apiRequest(`/usuarios/${user.id}/cambiar-contrasena`, {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      // Limpiar formulario
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      const updatedUser = { ...user, mustChangePassword: false };
      updateCurrentUser(updatedUser);
      updateUser(updatedUser);

      toast.success('Contraseña actualizada correctamente');
      if (isPasswordChangeRequired) {
        navigate('/');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la contraseña');
    }
  };

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

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          disabled={isPasswordChangeRequired}
          title={isPasswordChangeRequired ? 'Debes cambiar la contraseña temporal para continuar' : undefined}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Mi Perfil</h2>
          <p className="text-gray-600 mt-1">Gestiona tu información personal y seguridad</p>
          {isPasswordChangeRequired && (
            <p className="text-sm text-amber-700 mt-2">
              Debes cambiar tu contraseña temporal para continuar usando el sistema.
            </p>
          )}
        </div>
      </div>

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <UserIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{user.nombre}</div>
                <div className="text-sm text-gray-500">@{user.username}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <div className="text-sm text-gray-500">Rol</div>
                <Badge className={`${getRoleBadgeColor(user.role)} mt-1`}>
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-gray-500">Fecha de Creación</div>
                <div className="font-medium text-gray-900 mt-1">
                  {new Date(user.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias de pantalla</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <Label htmlFor="show-information-ui" className="text-base font-medium">
              Mostrar tarjetas y mensajes informativos
            </Label>
            <p className="text-sm text-gray-500">
              Incluye ayudas en azul, avisos explicativos y tarjetas de contexto en el resto de la
              aplicación. Activado por defecto.
            </p>
          </div>
          <Switch
            id="show-information-ui"
            checked={showInformationUI}
            onCheckedChange={setShowInformationUI}
            className="shrink-0"
          />
        </CardContent>
      </Card>

      {/* Tabs para Editar Perfil y Cambiar Contraseña */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (isPasswordChangeRequired && value !== 'password') return;
          setActiveTab(value);
        }}
        className="w-full"
      >
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 p-1 sm:grid-cols-2">
          <TabsTrigger value="profile" disabled={isPasswordChangeRequired} className="whitespace-normal px-2 py-2 text-center text-xs sm:text-sm">
            Editar Perfil
          </TabsTrigger>
          <TabsTrigger value="password" className="whitespace-normal px-2 py-2 text-center text-xs sm:text-sm">
            Cambiar Contraseña
          </TabsTrigger>
        </TabsList>

        {/* Tab: Editar Perfil */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Datos Personales</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void handleUpdateProfile(e)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo *</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="nombre"
                      value={profileData.nombre}
                      onChange={(e) => setProfileData({ ...profileData, nombre: e.target.value })}
                      required
                      placeholder="Tu nombre completo"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      required
                      placeholder="tu@email.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nombre de Usuario</Label>
                  <Input
                    value={user.username}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    El nombre de usuario no se puede cambiar
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Cambiar Contraseña */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void handleChangePassword(e)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña Actual *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      required
                      placeholder="Tu contraseña actual"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      required
                      placeholder="Mínimo 6 caracteres"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      required
                      placeholder="Repite la nueva contraseña"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <IfInformationUI>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Requisitos de contraseña:</strong>
                    </p>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                      <li>Mínimo 6 caracteres</li>
                      <li>Se recomienda usar una combinación de letras, números y símbolos</li>
                    </ul>
                  </div>
                </IfInformationUI>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    <Lock className="w-4 h-4 mr-2" />
                    Cambiar Contraseña
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      })
                    }
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
