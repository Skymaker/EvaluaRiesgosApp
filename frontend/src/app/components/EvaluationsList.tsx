import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { FileText, Plus, Calendar, User, Building2, AlertTriangle, Trash2, Eye, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/auth-storage';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getEvaluations, deleteEvaluation } from '../utils/storage';
import { RiskEvaluation } from '../types';
import { getStateLabel, getStateColor, getRiskLevelLabel } from '../utils/risk-utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

export function EvaluationsList() {
  const { user } = useAuth();
  const canManageEvaluations = hasPermission(user, 'crear_evaluaciones');
  const [evaluations, setEvaluations] = useState<RiskEvaluation[]>([]);

  const loadEvaluations = () => {
    setEvaluations(getEvaluations());
  };

  useEffect(() => {
    loadEvaluations();
  }, []);

  const handleDelete = (id: string) => {
    deleteEvaluation(id);
    loadEvaluations();
  };

  const getRiskSummary = (evaluation: RiskEvaluation) => {
    // Combinar riesgos de estructura y puestos
    const allRisks = [
      ...(evaluation.riesgosEstructura || []).map(r => r.risk),
      ...(evaluation.riesgosPuestos || []).map(r => r.risk),
    ];

    const critical = allRisks.filter(r =>
      r.nivel === 'importante' || r.nivel === 'intolerable'
    ).length;

    return {
      total: allRisks.length,
      critical,
      risks: allRisks,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Evaluaciones de Riesgos</h2>
          <p className="mt-1 text-gray-600">Historial de evaluaciones realizadas</p>
        </div>
        {canManageEvaluations && (
          <Link to="/evaluaciones/nueva" className="shrink-0 sm:self-start">
            <Button className="flex w-full items-center justify-center gap-2 sm:w-auto">
              <Plus className="h-4 w-4" />
              Nueva Evaluación
            </Button>
          </Link>
        )}
      </div>

      {evaluations.length > 0 ? (
        <div className="space-y-4">
          {evaluations.map((evaluation) => {
            const summary = getRiskSummary(evaluation);
            
            return (
              <Card key={evaluation.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                      <div className="shrink-0 rounded-lg bg-blue-100 p-2 sm:p-3">
                        <FileText className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-3">
                        <div>
                          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                              {evaluation.workCenterName}
                            </h3>
                            <Badge className={`${getStateColor(evaluation.estado)} w-fit`}>
                              {getStateLabel(evaluation.estado)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{new Date(evaluation.fecha).toLocaleDateString('es-ES')}</span>
                            </div>
                            
                            <div className="flex min-w-0 items-start gap-2 sm:items-center">
                              <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 sm:mt-0" />
                              <span className="break-words">
                                {evaluation.evaluador} - {evaluation.cargo}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-gray-400" />
                              <span>
                                {summary.total} riesgos identificados
                                {summary.critical > 0 && (
                                  <span className="text-red-600 font-medium ml-1">
                                    ({summary.critical} críticos)
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {evaluation.observaciones && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {evaluation.observaciones}
                          </p>
                        )}

                        {summary.risks.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {summary.risks.slice(0, 3).map((riesgo) => (
                              <Badge key={riesgo.id} variant="outline" className="text-xs">
                                {getRiskLevelLabel(riesgo.nivel)} - {riesgo.categoria}
                              </Badge>
                            ))}
                            {summary.risks.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{summary.risks.length - 3} más
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex w-full flex-wrap gap-2 border-t border-gray-100 pt-3 md:ml-4 md:w-auto md:shrink-0 md:border-t-0 md:pt-0">
                      <Link to={`/evaluaciones/${evaluation.id}`} className="min-w-0 flex-1 sm:flex-initial">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Button>
                      </Link>

                      {canManageEvaluations && (
                        <Link to={`/evaluaciones/editar/${evaluation.id}`} className="min-w-0 flex-1 sm:flex-initial">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        </Link>
                      )}

                      {canManageEvaluations && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="shrink-0 sm:ml-0">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar evaluación?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente la evaluación
                                y todos sus riesgos asociados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(evaluation.id)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay evaluaciones</h3>
              <p className="text-gray-500 mb-6">
                {canManageEvaluations
                  ? 'Comienza creando tu primera evaluación de riesgos'
                  : 'Las evaluaciones las registran los técnicos de prevención. Puedes ver el detalle o imprimir desde la lista.'}
              </p>
              {canManageEvaluations && (
                <Link to="/evaluaciones/nueva">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Evaluación
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
