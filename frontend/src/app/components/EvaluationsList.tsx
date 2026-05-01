import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { FileText, Plus, Calendar, User, Building2, AlertTriangle, Trash2, Eye, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getEvaluations, deleteEvaluation } from '../utils/storage';
import { RiskEvaluation } from '../types';
import { getStateLabel, getStateColor, getRiskLevelLabel } from '../utils/risk-utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

export function EvaluationsList() {
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Evaluaciones de Riesgos</h2>
          <p className="text-gray-600 mt-1">Historial de evaluaciones realizadas</p>
        </div>
        <Link to="/evaluaciones/nueva">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Evaluación
          </Button>
        </Link>
      </div>

      {evaluations.length > 0 ? (
        <div className="space-y-4">
          {evaluations.map((evaluation) => {
            const summary = getRiskSummary(evaluation);
            
            return (
              <Card key={evaluation.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {evaluation.workCenterName}
                            </h3>
                            <Badge className={getStateColor(evaluation.estado)}>
                              {getStateLabel(evaluation.estado)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{new Date(evaluation.fecha).toLocaleDateString('es-ES')}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{evaluation.evaluador} - {evaluation.cargo}</span>
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

                    <div className="flex items-center gap-2 ml-4">
                      <Link to={`/evaluaciones/${evaluation.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </Button>
                      </Link>

                      <Link to={`/evaluaciones/editar/${evaluation.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-600" />
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
              <p className="text-gray-500 mb-6">Comienza creando tu primera evaluación de riesgos</p>
              <Link to="/evaluaciones/nueva">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Evaluación
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
