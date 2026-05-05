import React, { useEffect, useState, useRef } from 'react';
import { Users, Plus, Trash2, Unlock, Shield, Mail, User as UserIcon, AlertTriangle, Download, Upload, Trash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import {
  getUsers,
  saveUser,
  deleteUser,
  unlockUser,
  initializeUsers,
  refreshUsers,
  getCurrentUser,
  logout as logoutUser,
} from '../utils/auth-storage';
import { User, UserRole } from '../types';
import { toast } from 'sonner';
import { apiRequest } from '../utils/api-client';
import { IfInformationUI } from '../contexts/UiPreferencesContext';

export function UserManagement() {
  const currentUser = getCurrentUser();
  const logout = () => logoutUser();
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [unlockUserTarget, setUnlockUserTarget] = useState<User | null>(null);
  const [unlockTemporaryPassword, setUnlockTemporaryPassword] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nombre: '',
    email: '',
    role: 'tecnico' as UserRole,
  });

  const loadUsers = async () => {
    await refreshUsers();
    setUsers(getUsers());
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const randomBytes = new Uint32Array(12);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes, (value) => chars[value % chars.length]).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que el username no exista
    const existingUser = users.find(u => u.username === formData.username);
    if (existingUser) {
      toast.error('El nombre de usuario ya existe');
      return;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      username: formData.username,
      password: formData.password,
      nombre: formData.nombre,
      email: formData.email,
      role: formData.role,
      isBlocked: false,
      failedAttempts: 0,
      createdAt: new Date().toISOString(),
    };

    await saveUser(newUser);
    await loadUsers();
    setIsDialogOpen(false);
    setFormData({
      username: '',
      password: '',
      nombre: '',
      email: '',
      role: 'tecnico',
    });
    toast.success('Usuario creado exitosamente');
  };

  const handleUnlock = async () => {
    if (!unlockUserTarget) return;
    if (unlockTemporaryPassword.length < 6) {
      toast.error('La contraseña temporal debe tener al menos 6 caracteres');
      return;
    }

    setUnlockLoading(true);
    try {
      const message = await unlockUser(unlockUserTarget.id, unlockTemporaryPassword);
      await loadUsers();
      toast.success(message);
      setUnlockUserTarget(null);
      setUnlockTemporaryPassword('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo desbloquear el usuario');
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('No puedes eliminar tu propio usuario');
      return;
    }
    await deleteUser(userId);
    await loadUsers();
    toast.success('Usuario eliminado');
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'administrador':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'administrativo':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tecnico':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'administrador':
        return 'Administrador';
      case 'administrativo':
        return 'Administrativo';
      case 'tecnico':
        return 'Técnico de Prevención';
    }
  };

  const handleExportData = async () => {
    try {
      const allData = await apiRequest('/sistema/exportar');

      // Crear archivo JSON
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      // Descargar archivo
      const link = document.createElement('a');
      link.href = url;
      link.download = `evaluacion-riesgos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Datos exportados correctamente');
    } catch (error) {
      toast.error('Error al exportar los datos');
      console.error(error);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        // Validar estructura básica
        if (!importedData.users || !importedData.workCenters || !importedData.evaluations) {
          toast.error('El archivo no tiene el formato correcto');
          return;
        }

        // Confirmar antes de importar
        if (!confirm('¿Estás seguro de que deseas importar estos datos? Esto sobrescribirá los datos actuales.')) {
          return;
        }

        await apiRequest('/sistema/importar', {
          method: 'POST',
          body: JSON.stringify(importedData),
        });

        toast.success('Datos importados correctamente. Por favor, vuelve a iniciar sesión.');

        // Cerrar sesión para que el usuario vuelva a iniciar sesión
        setTimeout(() => {
          logout();
          window.location.href = '/iniciar-sesion';
        }, 2000);
      } catch (error) {
        toast.error('Error al importar los datos. Verifica que el archivo sea válido.');
        console.error(error);
      }
    };
    reader.readAsText(file);

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAllData = async () => {
    await apiRequest('/sistema/reiniciar', { method: 'POST' });
    await initializeUsers();

    toast.success('Todos los datos han sido eliminados. Por favor, inicia sesión nuevamente.');

    // Cerrar sesión y redirigir
    setTimeout(() => {
      logout();
      window.location.href = '/iniciar-sesion';
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Gestión</h2>
        <p className="text-gray-600 mt-1">Administra los datos y usuarios del sistema</p>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Completa la información del nuevo usuario del sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de Usuario *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    placeholder="usuario123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    placeholder="Juan Pérez"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="usuario@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrador">Administrador</SelectItem>
                      <SelectItem value="administrativo">Administrativo</SelectItem>
                      <SelectItem value="tecnico">Técnico de Prevención</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear Usuario</Button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(unlockUserTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setUnlockUserTarget(null);
            setUnlockTemporaryPassword('');
            setUnlockLoading(false);
          }
        }}
      >
        <DialogContent
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Desbloquear usuario</DialogTitle>
            <DialogDescription>
              Define una contraseña temporal para <strong>{unlockUserTarget?.nombre}</strong>. Este usuario
              deberá cambiarla obligatoriamente al iniciar sesión.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="temporary-password">Contraseña temporal</Label>
              <Input
                id="temporary-password"
                value={unlockTemporaryPassword}
                onChange={(e) => setUnlockTemporaryPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => void handleUnlock()} disabled={unlockLoading}>
              {unlockLoading ? 'Desbloqueando...' : 'Desbloquear y enviar contraseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gestión de Datos */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-600" />
            Gestión de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Descargar Datos */}
            <Button
              variant="outline"
              onClick={() => void handleExportData()}
              className="flex items-center gap-2 h-auto py-3 border-2 hover:border-green-500 hover:bg-green-50"
            >
              <Download className="w-5 h-5 text-green-600" />
              <div className="flex flex-col items-start">
                <span className="font-medium text-sm">Descargar Datos</span>
                <span className="text-xs text-gray-500">Exportar a JSON</span>
              </div>
            </Button>

            {/* Cargar Datos */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
                id="import-file-input"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 h-auto py-3 border-2 hover:border-blue-500 hover:bg-blue-50"
              >
                <Upload className="w-5 h-5 text-blue-600" />
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm">Cargar Datos</span>
                  <span className="text-xs text-gray-500">Importar desde JSON</span>
                </div>
              </Button>
            </div>

            {/* Borrar Datos */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-auto py-3 border-2 hover:border-red-500 hover:bg-red-50"
                >
                  <Trash className="w-5 h-5 text-red-600" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">Borrar Datos</span>
                    <span className="text-xs text-gray-500">Reiniciar sistema</span>
                  </div>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    ¿Borrar todos los datos?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <div className="space-y-3">
                      <p className="font-medium">Esta acción no se puede deshacer y eliminará:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Todos los usuarios (excepto admin por defecto)</li>
                        <li>Todos los centros de trabajo</li>
                        <li>Todas las evaluaciones de riesgos</li>
                        <li>Todas las categorías de puestos de trabajo</li>
                      </ul>
                      <p className="text-red-600 font-medium mt-4">
                        El sistema se reiniciará como si se ejecutase por primera vez.
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => void handleDeleteAllData()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Sí, Borrar Todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <IfInformationUI>
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-blue-900">
                <strong>💡 Ayuda:</strong> Utiliza estas herramientas para realizar copias de seguridad,
                transferir datos entre sistemas o reiniciar la aplicación cuando sea necesario.
              </p>
            </div>
          </IfInformationUI>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 shrink-0 text-slate-600" />
              Gestión de Usuarios
            </CardTitle>
            <Button className="flex w-full shrink-0 items-center justify-center gap-2 sm:w-auto" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nuevo Usuario
            </Button>
          </div>
          <p className="text-sm text-gray-600">Administra los usuarios del sistema</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className={`shrink-0 rounded-lg p-3 ${user.isBlocked ? 'bg-red-100' : 'bg-blue-100'}`}>
                        <UserIcon className={`h-6 w-6 ${user.isBlocked ? 'text-red-600' : 'text-blue-600'}`} />
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{user.nombre}</h3>
                            {user.isBlocked && (
                              <Badge className="border-red-200 bg-red-100 text-red-800">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Bloqueado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>

                        <Badge className={getRoleBadgeColor(user.role)}>
                          <Shield className="mr-1 h-3 w-3" />
                          {getRoleLabel(user.role)}
                        </Badge>

                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                          <span className="min-w-0 break-all">{user.email}</span>
                        </div>

                        <div className="text-xs text-gray-500">
                          Creado: {new Date(user.createdAt).toLocaleDateString('es-ES')}
                          {user.lastLogin && (
                            <span className="ml-2">
                              • Último acceso: {new Date(user.lastLogin).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </div>

                        {user.failedAttempts > 0 && !user.isBlocked && (
                          <div className="text-xs text-orange-600">
                            Intentos fallidos: {user.failedAttempts} de 3
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-3 sm:ml-4 sm:shrink-0 sm:justify-start sm:border-t-0 sm:pt-0">
                      {user.isBlocked && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUnlockUserTarget(user);
                            setUnlockTemporaryPassword(generateTemporaryPassword());
                          }}
                          title="Desbloquear usuario"
                        >
                          <Unlock className="w-4 h-4" />
                        </Button>
                      )}

                      {user.id !== currentUser?.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el usuario
                                <strong> {user.nombre}</strong>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => void handleDelete(user.id)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
