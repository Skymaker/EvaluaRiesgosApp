import { WorkCenter, RiskEvaluation } from '../types';
import { apiRequest } from './api-client';

let workCentersCache: WorkCenter[] = [];
let evaluationsCache: RiskEvaluation[] = [];

export const initializeStorage = async (): Promise<void> => {
  const [centers, evaluations] = await Promise.all([
    apiRequest('/centros-trabajo'),
    apiRequest('/evaluaciones'),
  ]);

  workCentersCache = Array.isArray(centers) ? centers : [];
  evaluationsCache = Array.isArray(evaluations) ? evaluations : [];
};

// Work Centers
export const getWorkCenters = (): WorkCenter[] => {
  return workCentersCache.map((center: WorkCenter) => ({
    ...center,
    estructura: center.estructura || [],
    estructuraJerarquica: center.estructuraJerarquica || [],
    puestosTrabajo: center.puestosTrabajo || [],
  }));
};

export const saveWorkCenter = (center: WorkCenter): void => {
  const centers = [...workCentersCache];
  const index = centers.findIndex((c) => c.id === center.id);
  
  if (index >= 0) {
    centers[index] = center;
  } else {
    centers.push(center);
  }
  workCentersCache = centers;
  void apiRequest(`/centros-trabajo/${center.id}`, {
    method: 'PUT',
    body: JSON.stringify(center),
  }).catch((error) => {
    console.error('No se pudo guardar el centro de trabajo:', error);
  });
};

export const deleteWorkCenter = (id: string): void => {
  workCentersCache = workCentersCache.filter((c) => c.id !== id);
  evaluationsCache = evaluationsCache.filter((e) => e.workCenterId !== id);
  void apiRequest(`/centros-trabajo/${id}`, { method: 'DELETE' }).catch((error) => {
    console.error('No se pudo eliminar el centro de trabajo:', error);
  });
};

// Evaluations
export const getEvaluations = (): RiskEvaluation[] => {
  return evaluationsCache.map((evaluation: RiskEvaluation) => ({
    ...evaluation,
    riesgos: evaluation.riesgos || [],
    riesgosEstructura: evaluation.riesgosEstructura || [],
    riesgosPuestos: evaluation.riesgosPuestos || [],
  }));
};

export const saveEvaluation = (evaluation: RiskEvaluation): void => {
  const evaluations = [...evaluationsCache];
  const index = evaluations.findIndex((e) => e.id === evaluation.id);
  
  if (index >= 0) {
    evaluations[index] = evaluation;
  } else {
    evaluations.push(evaluation);
  }
  evaluationsCache = evaluations;
  void apiRequest(`/evaluaciones/${evaluation.id}`, {
    method: 'PUT',
    body: JSON.stringify(evaluation),
  }).catch((error) => {
    console.error('No se pudo guardar la evaluación:', error);
  });
};

export const deleteEvaluation = (id: string): void => {
  evaluationsCache = evaluationsCache.filter((e) => e.id !== id);
  void apiRequest(`/evaluaciones/${id}`, { method: 'DELETE' }).catch((error) => {
    console.error('No se pudo eliminar la evaluación:', error);
  });
};

export const getEvaluationsByWorkCenter = (workCenterId: string): RiskEvaluation[] => {
  return getEvaluations().filter((e) => e.workCenterId === workCenterId);
};