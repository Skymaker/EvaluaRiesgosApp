import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { WorkCentersList } from './components/WorkCentersList';
import { WorkCenterForm } from './components/WorkCenterForm';
import { WorkCenterStructure } from './components/WorkCenterStructure';
import { WorkCenterStructureForm } from './components/WorkCenterStructureForm';
import { WorkCenterPositions } from './components/WorkCenterPositions';
import { WorkCenterPositionForm } from './components/WorkCenterPositionForm';
import { EvaluationsList } from './components/EvaluationsList';
import { EvaluationForm } from './components/EvaluationForm';
import { EvaluationDetail } from './components/EvaluationDetail';
import { PrintDocuments } from './components/PrintDocuments';
import { UserManagement } from './components/UserManagement';
import { UserProfile } from './components/UserProfile';
import { JobPositionCategories } from './components/JobPositionCategories';
import { JobPositionCategoryForm } from './components/JobPositionCategoryForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NotFound } from './components/NotFound';

export const router = createBrowserRouter([
  {
    path: '/iniciar-sesion',
    Component: Login,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { 
        path: 'centros', 
        element: (
          <ProtectedRoute permission="ver_evaluaciones">
            <WorkCentersList />
          </ProtectedRoute>
        ),
      },
      { 
        path: 'centros/nuevo', 
        element: (
          <ProtectedRoute permission="crear_centros_trabajo">
            <WorkCenterForm />
          </ProtectedRoute>
        ),
      },
      { 
        path: 'centros/editar/:id', 
        element: (
          <ProtectedRoute permission="editar_centros_trabajo">
            <WorkCenterForm />
          </ProtectedRoute>
        ),
      },
      { 
        path: 'centros/:centerId/estructura', 
        element: (
          <ProtectedRoute permission="gestionar_estructura">
            <WorkCenterStructure />
          </ProtectedRoute>
        ),
      },
      { 
        path: 'centros/:centerId/estructura/nuevo', 
        element: (
          <ProtectedRoute permission="gestionar_estructura">
            <WorkCenterStructureForm />
          </ProtectedRoute>
        ),
      },
      { 
        path: 'centros/:centerId/estructura/editar/:structureId', 
        element: (
          <ProtectedRoute permission="gestionar_estructura">
            <WorkCenterStructureForm />
          </ProtectedRoute>
        ),
      },
      { 
        path: 'centros/:centerId/puestos', 
        element: (
          <ProtectedRoute permission="gestionar_puestos">
            <WorkCenterPositions />
          </ProtectedRoute>
        ),
      },
      { 
        path: 'centros/:centerId/puestos/asignar', 
        element: (
          <ProtectedRoute permission="gestionar_puestos">
            <WorkCenterPositionForm />
          </ProtectedRoute>
        ),
      },
      { 
        path: 'centros/:centerId/puestos/editar/:positionId', 
        element: (
          <ProtectedRoute permission="gestionar_puestos">
            <WorkCenterPositionForm />
          </ProtectedRoute>
        ),
      },
      { 
        path: 'puestos/categorias', 
        element: (
          <ProtectedRoute permission="gestionar_puestos">
            <JobPositionCategories />
          </ProtectedRoute>
        ),
      },
      { 
        path: 'puestos/categorias/nueva', 
        element: (
          <ProtectedRoute permission="gestionar_puestos">
            <JobPositionCategoryForm />
          </ProtectedRoute>
        ),
      },
      { 
        path: 'puestos/categorias/editar/:id', 
        element: (
          <ProtectedRoute permission="gestionar_puestos">
            <JobPositionCategoryForm />
          </ProtectedRoute>
        ),
      },
      { 
        path: 'evaluaciones', 
        element: (
          <ProtectedRoute permission="ver_evaluaciones">
            <EvaluationsList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'evaluaciones/nueva',
        element: (
          <ProtectedRoute permission="crear_evaluaciones">
            <EvaluationForm />
          </ProtectedRoute>
        ),
      },
      {
        path: 'evaluaciones/editar/:id',
        element: (
          <ProtectedRoute permission="crear_evaluaciones">
            <EvaluationForm />
          </ProtectedRoute>
        ),
      },
      {
        path: 'evaluaciones/:id',
        element: (
          <ProtectedRoute permission="ver_evaluaciones">
            <EvaluationDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: 'impresion',
        element: (
          <ProtectedRoute permission="ver_evaluaciones">
            <PrintDocuments />
          </ProtectedRoute>
        ),
      },
      {
        path: 'usuarios',
        element: (
          <ProtectedRoute permission="gestionar_usuarios">
            <UserManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'perfil',
        element: (
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        ),
      },
      { path: '*', Component: NotFound },
    ],
  },
]);