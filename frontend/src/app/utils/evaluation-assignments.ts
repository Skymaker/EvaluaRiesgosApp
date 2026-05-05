import type {
  StructureNode,
  StructureRiskAssignment,
  JobPositionInstance,
  JobPositionCategory,
  JobPositionRiskAssignment,
  RiskEvaluation,
  WorkCenter,
} from '../types';
import { getNodePath } from './structure-utils';

/** Sincroniza nombre y ruta de ubicación con el árbol actual (p. ej. tras renombrar nodos). */
export function enrichStructureRiskAssignments(
  tree: StructureNode[],
  assignments: StructureRiskAssignment[],
): StructureRiskAssignment[] {
  return assignments.map((row) => {
    const path = getNodePath(tree, row.structureNodeId);
    if (!path?.length) {
      return {
        ...row,
        structureNodePath: row.structureNodePath ?? '',
        structureNodeName: row.structureNodeName ?? '',
      };
    }
    const leaf = path[path.length - 1];
    return {
      ...row,
      structureNodeName: leaf.nombre,
      structureNodePath: path.map((n) => n.nombre).join(' > '),
    };
  });
}

/** Normaliza nombre de puesto y bandera isGeneric (datos antiguos sin isGeneric). */
export function enrichJobPositionRiskAssignments(
  positions: JobPositionInstance[],
  categories: JobPositionCategory[],
  assignments: JobPositionRiskAssignment[],
): JobPositionRiskAssignment[] {
  return assignments.map((row) => {
    const pos = positions.find((p) => p.id === row.jobPositionId);
    const category = pos ? categories.find((c) => c.id === pos.categoryId) : undefined;
    const matchesGenericTemplate = Boolean(
      category?.riesgosGenericos?.some((r) => r.id === row.risk.id),
    );
    const isGeneric =
      row.isGeneric === false ? false : row.isGeneric === true || matchesGenericTemplate;

    return {
      ...row,
      jobPositionName: pos?.categoryName ?? row.jobPositionName ?? '',
      isGeneric,
    };
  });
}

/**
 * Reconstruye los riesgos genéricos por puesto a partir de las categorías actuales
 * y conserva los riesgos específicos. Los genéricos quedan alineados con `riesgosGenericos`
 * de la categoría (mismos ids y datos actualizados).
 */
export function syncJobPositionGenericRisksWithCategories(
  assignments: JobPositionRiskAssignment[],
  jobPositions: JobPositionInstance[],
  jobCategories: JobPositionCategory[],
): JobPositionRiskAssignment[] {
  const positionById = new Map(jobPositions.map((p) => [p.id, p]));

  const nonGenericForKnownPosition: JobPositionRiskAssignment[] = [];
  const forUnknownPosition: JobPositionRiskAssignment[] = [];

  for (const a of assignments) {
    if (!positionById.has(a.jobPositionId)) {
      forUnknownPosition.push(a);
      continue;
    }
    if (!a.isGeneric) {
      nonGenericForKnownPosition.push(a);
    }
  }

  const result: JobPositionRiskAssignment[] = [];
  for (const pos of jobPositions) {
    const category = jobCategories.find((c) => c.id === pos.categoryId);
    const templates = category?.riesgosGenericos ?? [];
    for (const risk of templates) {
      result.push({
        jobPositionId: pos.id,
        jobPositionName: pos.categoryName,
        risk: { ...risk },
        isGeneric: true,
      });
    }
    const specificsHere = nonGenericForKnownPosition.filter((a) => a.jobPositionId === pos.id);
    result.push(...specificsHere);
  }

  return [...result, ...forUnknownPosition];
}

/** Actualiza `riesgosPuestos` de una evaluación con los genéricos vigentes de las categorías. */
export function syncEvaluationJobPositionGenericsFromCategories(
  evaluation: RiskEvaluation,
  center: WorkCenter | undefined,
  jobCategories: JobPositionCategory[],
): RiskEvaluation {
  const positions = center?.puestosTrabajo ?? [];
  const next = syncJobPositionGenericRisksWithCategories(
    evaluation.riesgosPuestos ?? [],
    positions,
    jobCategories,
  );
  if (JSON.stringify(evaluation.riesgosPuestos ?? []) === JSON.stringify(next)) {
    return evaluation;
  }
  return { ...evaluation, riesgosPuestos: next };
}
