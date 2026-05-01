import React, { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-gray-50 text-sm text-gray-600">
      Cargando…
    </div>
  );
}

function loadPage(importer: () => Promise<{ default: ComponentType<object> }>) {
  const Comp = lazy(importer);
  return function LazyPage() {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Comp />
      </Suspense>
    );
  };
}

const LoginPage = loadPage(() => import('./components/Login').then((m) => ({ default: m.Login })));
const DashboardPage = loadPage(() => import('./components/Dashboard').then((m) => ({ default: m.Dashboard })));
const WorkCentersListPage = loadPage(() =>
  import('./components/WorkCentersList').then((m) => ({ default: m.WorkCentersList })),
);
const WorkCenterFormPage = loadPage(() =>
  import('./components/WorkCenterForm').then((m) => ({ default: m.WorkCenterForm })),
);
const WorkCenterStructurePage = loadPage(() =>
  import('./components/WorkCenterStructure').then((m) => ({ default: m.WorkCenterStructure })),
);
const WorkCenterStructureFormPage = loadPage(() =>
  import('./components/WorkCenterStructureForm').then((m) => ({ default: m.WorkCenterStructureForm })),
);
const WorkCenterPositionsPage = loadPage(() =>
  import('./components/WorkCenterPositions').then((m) => ({ default: m.WorkCenterPositions })),
);
const WorkCenterPositionFormPage = loadPage(() =>
  import('./components/WorkCenterPositionForm').then((m) => ({ default: m.WorkCenterPositionForm })),
);
const EvaluationsListPage = loadPage(() =>
  import('./components/EvaluationsList').then((m) => ({ default: m.EvaluationsList })),
);
const EvaluationFormPage = loadPage(() =>
  import('./components/EvaluationForm').then((m) => ({ default: m.EvaluationForm })),
);
const EvaluationDetailPage = loadPage(() =>
  import('./components/EvaluationDetail').then((m) => ({ default: m.EvaluationDetail })),
);
const PrintDocumentsPage = loadPage(() =>
  import('./components/PrintDocuments').then((m) => ({ default: m.PrintDocuments })),
);
const UserManagementPage = loadPage(() =>
  import('./components/UserManagement').then((m) => ({ default: m.UserManagement })),
);
const UserProfilePage = loadPage(() =>
  import('./components/UserProfile').then((m) => ({ default: m.UserProfile })),
);
const JobPositionCategoriesPage = loadPage(() =>
  import('./components/JobPositionCategories').then((m) => ({ default: m.JobPositionCategories })),
);
const JobPositionCategoryFormPage = loadPage(() =>
  import('./components/JobPositionCategoryForm').then((m) => ({ default: m.JobPositionCategoryForm })),
);
const NotFoundPage = loadPage(() => import('./components/NotFound').then((m) => ({ default: m.NotFound })));

export const router = createBrowserRouter([
  {
    path: '/iniciar-sesion',
    Component: LoginPage,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: DashboardPage },
      {
        path: 'centros',
        element: (
          <ProtectedRoute permission="ver_evaluaciones">
            <WorkCentersListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'centros/nuevo',
        element: (
          <ProtectedRoute permission="crear_centros_trabajo">
            <WorkCenterFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'centros/editar/:id',
        element: (
          <ProtectedRoute permission="editar_centros_trabajo">
            <WorkCenterFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'centros/:centerId/estructura',
        element: (
          <ProtectedRoute permission="gestionar_estructura">
            <WorkCenterStructurePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'centros/:centerId/estructura/nuevo',
        element: (
          <ProtectedRoute permission="gestionar_estructura">
            <WorkCenterStructureFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'centros/:centerId/estructura/editar/:structureId',
        element: (
          <ProtectedRoute permission="gestionar_estructura">
            <WorkCenterStructureFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'centros/:centerId/puestos',
        element: (
          <ProtectedRoute permission="gestionar_puestos">
            <WorkCenterPositionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'centros/:centerId/puestos/asignar',
        element: (
          <ProtectedRoute permission="gestionar_puestos">
            <WorkCenterPositionFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'centros/:centerId/puestos/editar/:positionId',
        element: (
          <ProtectedRoute permission="gestionar_puestos">
            <WorkCenterPositionFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'puestos/categorias',
        element: (
          <ProtectedRoute permission="gestionar_puestos">
            <JobPositionCategoriesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'puestos/categorias/nueva',
        element: (
          <ProtectedRoute permission="gestionar_puestos">
            <JobPositionCategoryFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'puestos/categorias/editar/:id',
        element: (
          <ProtectedRoute permission="gestionar_puestos">
            <JobPositionCategoryFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'evaluaciones',
        element: (
          <ProtectedRoute permission="ver_evaluaciones">
            <EvaluationsListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'evaluaciones/nueva',
        element: (
          <ProtectedRoute permission="crear_evaluaciones">
            <EvaluationFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'evaluaciones/editar/:id',
        element: (
          <ProtectedRoute permission="crear_evaluaciones">
            <EvaluationFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'evaluaciones/:id',
        element: (
          <ProtectedRoute permission="ver_evaluaciones">
            <EvaluationDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'gestion',
        element: (
          <ProtectedRoute permission="gestionar_usuarios">
            <UserManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'impresion',
        element: (
          <ProtectedRoute permission="generar_documentos">
            <PrintDocumentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'perfil',
        element: (
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'usuarios',
        element: <Navigate to="/gestion" replace />,
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
