import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { getCurrentUser, logout as logoutUser, terminateSessionOnPageLeave } from '../utils/auth-storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    const handlePageLeave = () => {
      terminateSessionOnPageLeave();
    };

    window.addEventListener('pagehide', handlePageLeave);
    window.addEventListener('beforeunload', handlePageLeave);

    return () => {
      window.removeEventListener('pagehide', handlePageLeave);
      window.removeEventListener('beforeunload', handlePageLeave);
    };
  }, []);

  const login = (user: User) => {
    setUser(user);
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
