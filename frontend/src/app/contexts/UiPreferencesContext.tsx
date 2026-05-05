import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'evaluaRiesgos_showInformationUI';

export type UiPreferencesContextValue = {
  /** Por defecto true: mostrar tarjetas y mensajes de ayuda / información. */
  showInformationUI: boolean;
  setShowInformationUI: (value: boolean) => void;
};

const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null);

export function UiPreferencesProvider({ children }: { children: ReactNode }) {
  const [showInformationUI, setShowInformationUIState] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      setShowInformationUIState(v !== 'false');
    } catch {
      setShowInformationUIState(true);
    }
  }, []);

  const setShowInformationUI = useCallback((value: boolean) => {
    setShowInformationUIState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ showInformationUI, setShowInformationUI }),
    [showInformationUI, setShowInformationUI],
  );

  return (
    <UiPreferencesContext.Provider value={value}>{children}</UiPreferencesContext.Provider>
  );
}

export function useUiPreferences(): UiPreferencesContextValue {
  const ctx = useContext(UiPreferencesContext);
  if (!ctx) {
    throw new Error('useUiPreferences must be used within UiPreferencesProvider');
  }
  return ctx;
}

/** Oculta el contenido cuando el usuario desactiva las ayudas en Mi perfil. */
export function IfInformationUI({ children }: { children: ReactNode }) {
  const { showInformationUI } = useUiPreferences();
  if (!showInformationUI) return null;
  return <>{children}</>;
}
