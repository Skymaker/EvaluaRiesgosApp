import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Calendar, User, Building2, FileText, AlertTriangle, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getEvaluations } from '../utils/storage';
import { RiskEvaluation } from '../types';
import {
  getRiskLevelColor,
  getRiskLevelLabel,
  getCategoryLabel,
  getCategoryColor,
  getStateLabel,
  getStateColor,
} from '../utils/risk-utils';

export function EvaluationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState<RiskEvaluation | null>(null);

  useEffect(() => {
    if (id) {
      const evaluations = getEvaluations();
      const found = evaluations.find(e => e.id === id);
      setEvaluation(found || null);
    }
  }, [id]);

  if (!evaluation) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Evaluación no encontrada</h3>
            <Button onClick={() => navigate('/evaluaciones')}>
              Volver a Evaluaciones
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Combinar todos los riesgos de estructura y puestos
  const allRisks = [
    ...(evaluation.riesgosEstructura || []).map(r => ({ ...r.risk, source: 'estructura', location: r.structureNodePath })),
    ...(evaluation.riesgosPuestos || []).map(r => ({ ...r.risk, source: 'puesto', location: r.jobPositionName })),
  ];

  const risksByCategory = allRisks.reduce((acc, risk) => {
    if (!acc[risk.categoria]) {
      acc[risk.categoria] = [];
    }
    acc[risk.categoria].push(risk);
    return acc;
  }, {} as Record<string, typeof allRisks>);

  const risksByLevel = allRisks.reduce((acc, risk) => {
    acc[risk.nivel] = (acc[risk.nivel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/evaluaciones')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Detalle de Evaluación</h2>
            <p className="text-gray-600 mt-1">Información completa de la evaluación</p>
          </div>
        </div>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
      </div>

      {/* Información General */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Información General</CardTitle>
            <Badge className={getStateColor(evaluation.estado)}>
              {getStateLabel(evaluation.estado)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Centro de Trabajo</div>
                <div className="font-medium text-gray-900">{evaluation.workCenterName}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
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
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Evaluador</div>
                <div className="font-medium text-gray-900">{evaluation.evaluador}</div>
                <div className="text-sm text-gray-600">{evaluation.cargo}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Riesgos Identificados</div>
                <div className="font-medium text-gray-900">{allRisks.length} riesgos</div>
                <div className="text-xs text-gray-500">
                  {(evaluation.riesgosEstructura?.length || 0)} ubicaciones • {(evaluation.riesgosPuestos?.length || 0)} puestos
                </div>
              </div>
            </div>
          </div>

          {evaluation.observaciones && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Observaciones Generales</div>
              <p className="text-gray-900">{evaluation.observaciones}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen de Riesgos */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Riesgos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(risksByLevel).map(([level, count]) => (
              <div key={level} className="text-center">
                <Badge className={`${getRiskLevelColor(level as any)} w-full justify-center`}>
                  {getRiskLevelLabel(level as any)}
                </Badge>
                <div className="text-2xl font-bold text-gray-900 mt-2">{count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Riesgos por Categoría */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Riesgos Identificados</h3>
        
        {Object.entries(risksByCategory).map(([categoria, risks]) => (
          <Card key={categoria}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className={getCategoryColor(categoria as any)}>
                  {getCategoryLabel(categoria as any)}
                </Badge>
                <span className="text-sm text-gray-500">({risks.length} riesgos)</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {risks.map((risk, index) => (
                  <div key={risk.id} className="pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <Badge className={getRiskLevelColor(risk.nivel)}>
                          {getRiskLevelLabel(risk.nivel)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {risk.source === 'estructura' ? '📍 Ubicación' : '💼 Puesto'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        P: {risk.probabilidad} | C: {risk.consecuencias}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        {risk.source === 'estructura' ? 'Ubicación: ' : 'Puesto: '}{risk.location}
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
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leyenda de Niveles de Riesgo */}
      <Card className="print:break-before-page">
        <CardHeader>
          <CardTitle>Leyenda de Niveles de Riesgo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <Badge className={getRiskLevelColor('trivial')}>Trivial</Badge>
              <span className="text-gray-600">No requiere acción específica</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getRiskLevelColor('tolerable')}>Tolerable</Badge>
              <span className="text-gray-600">No necesita mejorar la acción preventiva</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getRiskLevelColor('moderado')}>Moderado</Badge>
              <span className="text-gray-600">Se deben hacer esfuerzos para reducir el riesgo</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getRiskLevelColor('importante')}>Importante</Badge>
              <span className="text-gray-600">No debe comenzarse el trabajo hasta reducir el riesgo</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getRiskLevelColor('intolerable')}>Intolerable</Badge>
              <span className="text-gray-600">No debe comenzar ni continuar el trabajo hasta reducir el riesgo</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
