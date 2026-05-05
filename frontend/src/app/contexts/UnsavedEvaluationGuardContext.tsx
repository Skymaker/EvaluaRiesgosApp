import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

export type EvaluationLeaveReason = 'default' | 'logout';

export type UnsavedEvaluationGuardHandler = {
  isDirty: () => boolean;
  requestLeave: (proceed: () => void, reason?: EvaluationLeaveReason) => void;
};

type UnsavedEvaluationGuardContextValue = {
  setGuard: (guard: UnsavedEvaluationGuardHandler | null) => void;
  runWithLeaveGuard: (
    proceed: () => void,
    reason?: EvaluationLeaveReason,
  ) => void;
};

const UnsavedEvaluationGuardContext =
  createContext<UnsavedEvaluationGuardContextValue | null>(null);

export function UnsavedEvaluationGuardProvider({ children }: { children: ReactNode }) {
  const guardRef = useRef<UnsavedEvaluationGuardHandler | null>(null);

  const setGuard = useCallback((guard: UnsavedEvaluationGuardHandler | null) => {
    guardRef.current = guard;
  }, []);

  const runWithLeaveGuard = useCallback(
    (proceed: () => void, reason: EvaluationLeaveReason = 'default') => {
      const g = guardRef.current;
      if (!g || !g.isDirty()) {
        proceed();
        return;
      }
      g.requestLeave(proceed, reason);
    },
    [],
  );

  const value = useMemo(
    () => ({ setGuard, runWithLeaveGuard }),
    [setGuard, runWithLeaveGuard],
  );

  return (
    <UnsavedEvaluationGuardContext.Provider value={value}>
      {children}
    </UnsavedEvaluationGuardContext.Provider>
  );
}

export function useUnsavedEvaluationGuard() {
  const ctx = useContext(UnsavedEvaluationGuardContext);
  if (!ctx) {
    throw new Error(
      'useUnsavedEvaluationGuard must be used within UnsavedEvaluationGuardProvider',
    );
  }
  return ctx;
}
