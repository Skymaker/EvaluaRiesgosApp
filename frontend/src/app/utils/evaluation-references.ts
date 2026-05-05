import type { RiskEvaluation, StructureNode } from '../types';
import { findNodeById, flattenTree } from './structure-utils';

/** Comprueba si alguna evaluación del centro asigna riesgos a este puesto. */
export function evaluationReferencesJobPosition(
  evaluations: RiskEvaluation[],
  workCenterId: string,
  jobPositionId: string,
): boolean {
  return evaluations.some(
    (ev) =>
      ev.workCenterId === workCenterId &&
      (ev.riesgosPuestos || []).some((a) => a.jobPositionId === jobPositionId),
  );
}

/** Comprueba si alguna evaluación del centro usa algún id de ubicación del conjunto. */
export function evaluationReferencesStructureNodeIds(
  evaluations: RiskEvaluation[],
  workCenterId: string,
  nodeIds: Set<string>,
): boolean {
  if (nodeIds.size === 0) {
    return false;
  }
  return evaluations.some(
    (ev) =>
      ev.workCenterId === workCenterId &&
      (ev.riesgosEstructura || []).some((a) => nodeIds.has(a.structureNodeId)),
  );
}

/** Ids del nodo y todo su subárbol (incluido el propio nodo). */
export function collectSubtreeNodeIds(tree: StructureNode[], nodeId: string): Set<string> {
  const root = findNodeById(tree, nodeId);
  if (!root) {
    return new Set();
  }
  return new Set(flattenTree([root]).map((n) => n.id));
}

export function structureNodeDeletionBlockedByEvaluations(
  evaluations: RiskEvaluation[],
  workCenterId: string,
  tree: StructureNode[],
  nodeId: string,
): boolean {
  const ids = collectSubtreeNodeIds(tree, nodeId);
  return evaluationReferencesStructureNodeIds(evaluations, workCenterId, ids);
}
