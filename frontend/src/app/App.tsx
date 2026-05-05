import { RouterProvider } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { UnsavedEvaluationGuardProvider } from './contexts/UnsavedEvaluationGuardContext';
import { UiPreferencesProvider } from './contexts/UiPreferencesContext';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <UnsavedEvaluationGuardProvider>
        <UiPreferencesProvider>
          <RouterProvider router={router} />
        </UiPreferencesProvider>
      </UnsavedEvaluationGuardProvider>
      <Toaster />
    </AuthProvider>
  );
}