import { User } from '../types';
import { apiRequest, ApiError, setSessionToken } from './api-client';

let usersCache: User[] = [];
let currentUserCache: User | null = null;

export const initializeUsers = async (): Promise<void> => {
  await refreshUsers();
};

export const refreshUsers = async (): Promise<void> => {
  const users = await apiRequest('/usuarios');
  usersCache = Array.isArray(users) ? users : [];
};

export const initializeAuthSession = async (): Promise<void> => {
  try {
    const response = await apiRequest('/autenticacion/yo');
    currentUserCache = response?.user || null;
  } catch {
    currentUserCache = null;
  }
};

export const getUsers = (): User[] => {
  return [...usersCache];
};

export const saveUser = async (user: User): Promise<void> => {
  const users = [...usersCache];
  const index = users.findIndex(u => u.id === user.id);

  if (index >= 0) {
    users[index] = user;
    await apiRequest(`/usuarios/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  } else {
    users.push(user);
    await apiRequest('/usuarios', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }
  usersCache = users;
};

export const deleteUser = async (id: string): Promise<void> => {
  usersCache = usersCache.filter((u) => u.id !== id);
  await apiRequest(`/usuarios/${id}`, { method: 'DELETE' });
};

export const getUserByUsername = (username: string): User | undefined => {
  return getUsers().find(u => u.username === username);
};

export const login = async (
  username: string,
  password: string
): Promise<{
  success: boolean;
  user?: User;
  message?: string;
  status?: number;
  code?: string;
}> => {
  try {
    const result = await apiRequest('/autenticacion/iniciar-sesion', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (!result?.user || !result?.sessionToken) {
      return { success: false, message: 'No se pudo iniciar sesión' };
    }

    setSessionToken(result.sessionToken);
    currentUserCache = result.user;
    await refreshUsers();
    return { success: true, user: result.user };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.message,
        status: error.status,
        code: error.code,
      };
    }
    return { success: false, message: error instanceof Error ? error.message : 'Error al iniciar sesión' };
  }
};

export const logout = (): void => {
  void apiRequest('/autenticacion/cerrar-sesion', { method: 'POST' }).catch(() => undefined);
  setSessionToken(null);
  currentUserCache = null;
};

export const getCurrentUser = (): User | null => {
  return currentUserCache;
};

export const updateCurrentUser = (user: User): void => {
  currentUserCache = user;
};

export const unlockUser = async (userId: string, temporaryPassword: string): Promise<string> => {
  const response = await apiRequest(`/usuarios/${userId}/desbloquear`, {
    method: 'POST',
    body: JSON.stringify({ temporaryPassword }),
  });
  await refreshUsers();
  return response?.temporaryPassword || temporaryPassword;
};

export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  
  const permissions: Record<string, string[]> = {
    administrador: [
      'gestionar_usuarios',
      'desbloquear_usuarios',
      'reasignar_evaluaciones',
      'editar_centros_trabajo',
      'crear_centros_trabajo',
      'crear_evaluaciones',
      'ver_evaluaciones',
      'gestionar_estructura',
      'gestionar_puestos',
    ],
    administrativo: [
      'editar_centros_trabajo',
      'ver_evaluaciones',
      'generar_documentos',
    ],
    tecnico: [
      'crear_centros_trabajo',
      'editar_centros_trabajo',
      'crear_evaluaciones',
      'ver_evaluaciones',
      'generar_documentos',
      'gestionar_estructura',
      'gestionar_puestos',
    ],
  };
  
  return permissions[user.role]?.includes(permission) || false;
};