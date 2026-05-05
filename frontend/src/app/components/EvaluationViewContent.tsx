import { useMemo } from 'react';
import { Building2, Calendar, User, AlertTriangle, MapPin, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  JobPositionRiskAssignment,
  RiskEvaluation,
  RiskLevel,
  StructureRiskAssignment,
} from '../types';
import {
  getRiskLevelColor,
  getRiskLevelLabel,
  getCategoryLabel,
  getCategoryColor,
  getStateLabel,
  getStateColor,
  compareRisksByLevelDescThenCategory,
  getRiskLevelRank,
} from '../utils/risk-utils';
import { ProbConsecInline } from './ProbConsecInline';

type EvaluationViewContentProps = {
  evaluation: RiskEvaluation;
};

export function EvaluationViewContent({ evaluation }: EvaluationViewContentProps) {
  const allRisks = useMemo(
    () => [
      ...(evaluation.riesgosEstructura || []).map((r) => ({
        ...r.risk,
        source: 'estructura' as const,
        location: r.structureNodePath,
      })),
      ...(evaluation.riesgosPuestos || []).map((r) => ({
        ...r.risk,
        source: 'puesto' as const,
        location: r.jobPositionName,
      })),
    ],
    [evaluation],
  );

  const risksByLevel = useMemo(() => {
    return allRisks.reduce(
      (acc, risk) => {
        acc[risk.nivel] = (acc[risk.nivel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [allRisks]);

  const sortedLugarAssignments = useMemo((): StructureRiskAssignment[] => {
    const list = [...(evaluation.riesgosEstructura || [])];
    list.sort((a, b) => compareRisksByLevelDescThenCategory(a.risk, b.risk));
    return list;
  }, [evaluation.riesgosEstructura]);

  const sortedPuestoGroups = useMemo(() => {
    const list = [...(evaluation.riesgosPuestos || [])];
    const map = new Map<
      string,
      { jobPositionId: string; jobPositionName: string; rows: JobPositionRiskAssignment[] }
    >();
    for (const row of list) {
      let g = map.get(row.jobPositionId);
      if (!g) {
        g = { jobPositionId: row.jobPositionId, jobPositionName: row.jobPositionName, rows: [] };
        map.set(row.jobPositionId, g);
      }
      g.rows.push(row);
    }
    const groups = Array.from(map.values());
    for (const g of groups) {
      g.rows.sort((a, b) => compareRisksByLevelDescThenCategory(a.risk, b.risk));
    }
    groups.sort((a, b) => {
      const maxA = Math.max(0, ...a.rows.map((r) => getRiskLevelRank(r.risk.nivel)));
      const maxB = Math.max(0, ...b.rows.map((r) => getRiskLevelRank(r.risk.nivel)));
      if (maxB !== maxA) return maxB - maxA;
      return a.jobPositionName.localeCompare(b.jobPositionName, 'es', { sensitivity: 'base' });
    });
    return groups;
  }, [evaluation.riesgosPuestos]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg sm:text-xl">Información General</CardTitle>
            <Badge className={`${getStateColor(evaluation.estado)} w-fit`}>
              {getStateLabel(evaluation.estado)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Centro de Trabajo</div>
                <div className="font-medium text-gray-900">{evaluation.workCenterName}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Fecha de Evaluación</div>
                <div className="font-medium text-gray-900">
                  {new Date(evaluation.fecha).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Evaluador</div>
                <div className="font-medium text-gray-900">{evaluation.evaluador}</div>
                <div className="text-sm text-gray-600">{evaluation.cargo}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Riesgos Identificados</div>
                <div className="font-medium text-gray-900">{allRisks.length} riesgos</div>
                <div className="text-xs text-gray-500">
                  {evaluation.riesgosEstructura?.length || 0} ubicaciones •{' '}
                  {evaluation.riesgosPuestos?.length || 0} puestos
                </div>
              </div>
            </div>
          </div>

          {evaluation.observaciones && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="mb-1 text-sm text-gray-500">Observaciones Generales</div>
              <p className="text-gray-900">{evaluation.observaciones}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Riesgos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {Object.entries(risksByLevel).map(([level, count]) => (
              <div key={level} className="text-center">
                <Badge
                  className={`${getRiskLevelColor(level as RiskLevel)} w-full justify-center whitespace-normal px-1 py-0.5 text-center leading-tight`}
                >
                  {getRiskLevelLabel(level as RiskLevel)}
                </Badge>
                <div className="mt-2 text-2xl font-bold text-gray-900">{count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Riesgos Identificados</h3>

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 shrink-0 text-gray-600" />
              Lugares
              <span className="text-sm font-normal text-gray-500">
                ({sortedLugarAssignments.length} riesgos)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedLugarAssignments.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay riesgos asociados a ubicaciones en esta evaluación.
              </p>
            ) : (
              <div className="space-y-4">
                {sortedLugarAssignments.map((assignment, index) => {
                  const risk = assignment.risk;
                  return (
                    <div
                      key={`${assignment.structureNodeId}-${risk.id}`}
                      className="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <Badge className={getRiskLevelColor(risk.nivel)}>
                            {getRiskLevelLabel(risk.nivel)}
                          </Badge>
                          <Badge className={getCategoryColor(risk.categoria)}>
                            {getCategoryLabel(risk.categoria)}
                          </Badge>
                        </div>
                        <ProbConsecInline
                          probabilidad={risk.probabilidad}
                          consecuencias={risk.consecuencias}
                          className="shrink-0 sm:text-right"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">
                          Ubicación: {assignment.structureNodePath}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Descripción:</div>
                          <p className="text-gray-900">{risk.descripcion}</p>
                        </div>
                        {risk.medidasControl && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Medidas de Control:</div>
                            <p className="text-gray-900">{risk.medidasControl}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 shrink-0 text-gray-600" />
              Puestos
              <span className="text-sm font-normal text-gray-500">
                ({evaluation.riesgosPuestos?.length || 0} riesgos en {sortedPuestoGroups.length}{' '}
                {sortedPuestoGroups.length === 1 ? 'puesto' : 'puestos'})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {sortedPuestoGroups.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay riesgos asociados a puestos en esta evaluación.
              </p>
            ) : (
              sortedPuestoGroups.map((group) => (
                <div
                  key={group.jobPositionId}
                  className="border-b border-gray-200 pb-8 last:border-0 last:pb-0"
                >
                  <h4 className="mb-3 text-base font-semibold text-gray-900">
                    {group.jobPositionName}
                  </h4>
                  <div className="space-y-4">
                    {group.rows.map((assignment, index) => {
                      const risk = assignment.risk;
                      return (
                        <div
                          key={`${assignment.jobPositionId}-${risk.id}-${assignment.isGeneric ? 'g' : 'e'}`}
                          className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                        >
                          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                              <Badge className={getRiskLevelColor(risk.nivel)}>
                                {getRiskLevelLabel(risk.nivel)}
                              </Badge>
                              <Badge className={getCategoryColor(risk.categoria)}>
                                {getCategoryLabel(risk.categoria)}
                              </Badge>
                            </div>
                            <ProbConsecInline
                              probabilidad={risk.probabilidad}
                              consecuencias={risk.consecuencias}
                              className="shrink-0 sm:text-right"
                            />
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="text-sm font-medium text-gray-700">Descripción:</div>
                              <p className="text-gray-900">{risk.descripcion}</p>
                            </div>
                            {risk.medidasControl && (
                              <div>
                                <div className="text-sm font-medium text-gray-700">
                                  Medidas de Control:
                                </div>
                                <p className="text-gray-900">{risk.medidasControl}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="print:break-before-page">
        <CardHeader>
          <CardTitle>Leyenda de Niveles de Riesgo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
              <Badge className={`${getRiskLevelColor('trivial')} w-fit shrink-0`}>Trivial</Badge>
              <span className="min-w-0 text-gray-600">No requiere acción específica</span>
            </div>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
              <Badge className={`${getRiskLevelColor('tolerable')} w-fit shrink-0`}>Tolerable</Badge>
              <span className="min-w-0 text-gray-600">No necesita mejorar la acción preventiva</span>
            </div>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
              <Badge className={`${getRiskLevelColor('moderado')} w-fit shrink-0`}>Moderado</Badge>
              <span className="min-w-0 text-gray-600">Se deben hacer esfuerzos para reducir el riesgo</span>
            </div>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
              <Badge className={`${getRiskLevelColor('importante')} w-fit shrink-0`}>Importante</Badge>
              <span className="min-w-0 text-gray-600">
                No debe comenzarse el trabajo hasta reducir el riesgo
              </span>
            </div>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
              <Badge className={`${getRiskLevelColor('intolerable')} w-fit shrink-0`}>Intolerable</Badge>
              <span className="min-w-0 text-gray-600">
                No debe comenzar ni continuar el trabajo hasta reducir el riesgo
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
