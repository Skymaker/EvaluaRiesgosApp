import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Printer, Building2, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getEvaluations, getWorkCenters } from '../utils/storage';
import { RiskEvaluation, WorkCenter, RiskLevel, StructureRiskAssignment, JobPositionRiskAssignment } from '../types';
import {
  getRiskLevelColor,
  getRiskLevelLabel,
  getCategoryLabel,
} from '../utils/risk-utils';
import { toast } from 'sonner';

const riskLevelOrder: Record<RiskLevel, number> = {
  intolerable: 5,
  importante: 4,
  moderado: 3,
  tolerable: 2,
  trivial: 1,
};

export function PrintDocuments() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<RiskEvaluation[]>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string>('');
  const [selectedEvaluation, setSelectedEvaluation] = useState<RiskEvaluation | null>(null);
  const [workCenter, setWorkCenter] = useState<WorkCenter | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const evals = getEvaluations();
    setEvaluations(evals);
  }, []);

  useEffect(() => {
    if (selectedEvaluationId) {
      const evaluation = evaluations.find(e => e.id === selectedEvaluationId);
      setSelectedEvaluation(evaluation || null);

      if (evaluation) {
        const centers = getWorkCenters();
        const center = centers.find(c => c.id === evaluation.workCenterId);
        setWorkCenter(center || null);
      }
    } else {
      setSelectedEvaluation(null);
      setWorkCenter(null);
    }
  }, [selectedEvaluationId, evaluations]);

  const sortRisksByLevel = <T extends { risk: { nivel: RiskLevel } }>(risks: T[]): T[] => {
    return [...risks].sort((a, b) => {
      return riskLevelOrder[b.risk.nivel] - riskLevelOrder[a.risk.nivel];
    });
  };

  const handleGeneratePDF = async () => {
    if (!documentRef.current || !selectedEvaluation) return;

    setIsGenerating(true);
    try {
      // Crear una ventana de impresión con solo el contenido del documento
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Por favor, permite las ventanas emergentes para generar el PDF');
        setIsGenerating(false);
        return;
      }

      const content = documentRef.current.innerHTML;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Evaluación - ${selectedEvaluation.workCenterName}</title>
            <meta charset="UTF-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                line-height: 1.5;
                color: #111827;
              }
              .bg-gray-50 { background-color: #f9fafb; }
              .bg-blue-50 { background-color: #eff6ff; }
              .bg-green-50 { background-color: #f0fdf4; }
              .text-gray-500 { color: #6b7280; }
              .text-gray-600 { color: #4b5563; }
              .text-gray-700 { color: #374151; }
              .text-gray-900 { color: #111827; }
              .text-blue-600 { color: #2563eb; }
              .text-blue-700 { color: #1d4ed8; }
              .text-blue-800 { color: #1e40af; }
              .text-blue-900 { color: #1e3a8a; }
              .border { border-width: 1px; }
              .border-2 { border-width: 2px; }
              .border-blue-600 { border-color: #2563eb; }
              .border-gray-200 { border-color: #e5e7eb; }
              .rounded-lg { border-radius: 0.5rem; }
              .p-3 { padding: 0.75rem; }
              .p-4 { padding: 1rem; }
              .p-6 { padding: 1.5rem; }
              .p-8 { padding: 2rem; }
              .px-4 { padding-left: 1rem; padding-right: 1rem; }
              .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
              .pb-4 { padding-bottom: 1rem; }
              .pt-4 { padding-top: 1rem; }
              .pt-6 { padding-top: 1.5rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mb-6 { margin-bottom: 1.5rem; }
              .mt-1 { margin-top: 0.25rem; }
              .mt-4 { margin-top: 1rem; }
              .mt-8 { margin-top: 2rem; }
              .gap-2 { gap: 0.5rem; }
              .gap-3 { gap: 0.75rem; }
              .gap-4 { gap: 1rem; }
              .flex { display: flex; }
              .grid { display: grid; }
              .items-center { align-items: center; }
              .justify-between { justify-content: space-between; }
              .text-xs { font-size: 0.75rem; }
              .text-sm { font-size: 0.875rem; }
              .text-base { font-size: 1rem; }
              .text-lg { font-size: 1.125rem; }
              .text-2xl { font-size: 1.5rem; }
              .text-3xl { font-size: 1.875rem; }
              .font-medium { font-weight: 500; }
              .font-semibold { font-weight: 600; }
              .font-bold { font-weight: 700; }
              .space-y-2 > * + * { margin-top: 0.5rem; }
              .space-y-3 > * + * { margin-top: 0.75rem; }
              .space-y-4 > * + * { margin-top: 1rem; }
              .space-y-6 > * + * { margin-top: 1.5rem; }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .inline-flex { display: inline-flex; }
              .text-center { text-align: center; }
              .overflow-hidden { overflow: hidden; }

              /* Badge styles */
              .badge {
                display: inline-flex;
                align-items: center;
                border-radius: 0.375rem;
                border: 1px solid;
                padding: 0.125rem 0.5rem;
                font-size: 0.75rem;
                font-weight: 500;
                white-space: nowrap;
              }
              .bg-green-100 { background-color: #dcfce7; }
              .text-green-800 { color: #166534; }
              .border-green-200 { border-color: #bbf7d0; }
              .bg-blue-100 { background-color: #dbeafe; }
              .text-blue-800 { color: #1e40af; }
              .border-blue-200 { border-color: #bfdbfe; }
              .bg-yellow-100 { background-color: #fef3c7; }
              .text-yellow-800 { color: #854d0e; }
              .border-yellow-200 { border-color: #fde68a; }
              .bg-orange-100 { background-color: #ffedd5; }
              .text-orange-800 { color: #9a3412; }
              .border-orange-200 { border-color: #fed7aa; }
              .bg-red-100 { background-color: #fee2e2; }
              .text-red-800 { color: #991b1b; }
              .border-red-200 { border-color: #fecaca; }

              @media print {
                body {
                  margin: 0;
                  padding: 10mm;
                }
                .page-break {
                  page-break-before: always;
                }
                @page {
                  margin: 10mm;
                }
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);

      printWindow.document.close();

      // Esperar a que el contenido se cargue y luego imprimir
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 500);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Agrupar riesgos de estructura por localización
  const groupStructureRisksByLocation = (risks: StructureRiskAssignment[]) => {
    const grouped = new Map<string, StructureRiskAssignment[]>();

    risks.forEach(risk => {
      const key = risk.structureNodeId;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(risk);
    });

    // Ordenar riesgos dentro de cada localización
    grouped.forEach((risks, key) => {
      grouped.set(key, sortRisksByLevel(risks));
    });

    return grouped;
  };

  // Agrupar riesgos de puestos por puesto
  const groupJobPositionRisksByPosition = (risks: JobPositionRiskAssignment[]) => {
    const grouped = new Map<string, JobPositionRiskAssignment[]>();

    risks.forEach(risk => {
      const key = risk.jobPositionId;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(risk);
    });

    // Ordenar riesgos dentro de cada puesto
    grouped.forEach((risks, key) => {
      grouped.set(key, sortRisksByLevel(risks));
    });

    return grouped;
  };

  if (evaluations.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay evaluaciones</h3>
            <p className="text-gray-600 mb-6">Crea una evaluación primero para poder generar documentos.</p>
            <Button onClick={() => navigate('/evaluaciones/nueva')}>
              Crear Evaluación
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Impresión de Documentos</h2>
        <p className="text-gray-600 mt-1">Selecciona una evaluación para generar el documento PDF</p>
      </div>

      {/* Selector de Evaluación */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Evaluación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Evaluación
              </label>
              <Select value={selectedEvaluationId} onValueChange={setSelectedEvaluationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una evaluación" />
                </SelectTrigger>
                <SelectContent>
                  {evaluations.map(evaluation => (
                    <SelectItem key={evaluation.id} value={evaluation.id}>
                      {evaluation.workCenterName} - {new Date(evaluation.fecha).toLocaleDateString('es-ES')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedEvaluation && (
              <Button
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="w-4 h-4 mr-2" />
                {isGenerating ? 'Abriendo...' : 'Imprimir / Guardar PDF'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documento a imprimir */}
      {selectedEvaluation && workCenter && (
        <Card>
          <CardContent className="p-0">
            <div ref={documentRef} className="bg-white p-8 space-y-6">
              {/* Encabezado */}
              <div className="border-b-2 border-blue-600 pb-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Evaluación de Riesgos Laborales
                </h1>
                <p className="text-gray-600">
                  Fecha de evaluación: {new Date(selectedEvaluation.fecha).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

          {/* 1. Datos del Centro de Trabajo */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Centro de Trabajo</h2>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nombre</p>
                  <p className="text-base text-gray-900">{workCenter.nombre}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Responsable</p>
                  <p className="text-base text-gray-900">{workCenter.responsable}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Dirección</p>
                  <p className="text-base text-gray-900">{workCenter.direccion}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Ciudad</p>
                  <p className="text-base text-gray-900">{workCenter.ciudad}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Teléfono</p>
                  <p className="text-base text-gray-900">{workCenter.telefono}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-base text-gray-900">{workCenter.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Número de Empleados</p>
                  <p className="text-base text-gray-900">{workCenter.numeroEmpleados}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-500">Evaluador</p>
                <p className="text-base text-gray-900">{selectedEvaluation.evaluador}</p>
                <p className="text-sm text-gray-600">{selectedEvaluation.cargo}</p>
              </div>

              {selectedEvaluation.observaciones && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500">Observaciones Generales</p>
                  <p className="text-base text-gray-900">{selectedEvaluation.observaciones}</p>
                </div>
              )}
            </div>
          </section>

          {/* 2. Evaluación de Lugares */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Evaluación de Lugares</h2>
            </div>

            {selectedEvaluation.riesgosEstructura && selectedEvaluation.riesgosEstructura.length > 0 ? (
              <>
                {Array.from(groupStructureRisksByLocation(selectedEvaluation.riesgosEstructura)).map(([locationId, risks]) => {
                const firstRisk = risks[0];
                return (
                  <div key={locationId} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">{firstRisk.structureNodeName}</h3>
                      <p className="text-sm text-gray-600">{firstRisk.structureNodePath}</p>
                    </div>
                    <div className="p-4 space-y-4">
                      {risks.map((risk, index) => (
                        <div key={`${locationId}-${risk.risk.id}-${index}`} className="pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-3">
                              <Badge className={getRiskLevelColor(risk.risk.nivel)}>
                                {getRiskLevelLabel(risk.risk.nivel)}
                              </Badge>
                              <span className="text-sm font-medium text-gray-700">
                                {getCategoryLabel(risk.risk.categoria)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              P: {risk.risk.probabilidad} | C: {risk.risk.consecuencias}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Descripción:</p>
                              <p className="text-sm text-gray-900">{risk.risk.descripcion}</p>
                            </div>
                            {risk.risk.medidasControl && (
                              <div>
                                <p className="text-sm font-medium text-gray-600">Medidas de Control:</p>
                                <p className="text-sm text-gray-900">{risk.risk.medidasControl}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
                })}
              </>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-600">No se han identificado riesgos en ubicaciones específicas</p>
              </div>
            )}
          </section>

          {/* 3. Evaluación de Puestos */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Evaluación de Puestos de Trabajo</h2>
            </div>

            {selectedEvaluation.riesgosPuestos && selectedEvaluation.riesgosPuestos.length > 0 ? (
              <>
                {Array.from(groupJobPositionRisksByPosition(selectedEvaluation.riesgosPuestos)).map(([positionId, risks]) => {
                const firstRisk = risks[0];
                return (
                  <div key={positionId} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">{firstRisk.jobPositionName}</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {risks.map((risk, index) => (
                        <div key={`${positionId}-${risk.risk.id}-${index}`} className="pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-3">
                              <Badge className={getRiskLevelColor(risk.risk.nivel)}>
                                {getRiskLevelLabel(risk.risk.nivel)}
                              </Badge>
                              <span className="text-sm font-medium text-gray-700">
                                {getCategoryLabel(risk.risk.categoria)}
                              </span>
                              {risk.isGeneric && (
                                <Badge variant="outline" className="text-xs">
                                  Genérico
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              P: {risk.risk.probabilidad} | C: {risk.risk.consecuencias}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Descripción:</p>
                              <p className="text-sm text-gray-900">{risk.risk.descripcion}</p>
                            </div>
                            {risk.risk.medidasControl && (
                              <div>
                                <p className="text-sm font-medium text-gray-600">Medidas de Control:</p>
                                <p className="text-sm text-gray-900">{risk.risk.medidasControl}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
                })}
              </>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-600">No se han identificado riesgos en puestos de trabajo</p>
              </div>
            )}
          </section>

          {/* Leyenda */}
          <section className="mt-8 pt-6 border-t-2 border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leyenda de Niveles de Riesgo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <Badge className={getRiskLevelColor('intolerable')}>Intolerable</Badge>
                <span className="text-gray-700">No debe comenzar ni continuar el trabajo hasta reducir el riesgo</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getRiskLevelColor('importante')}>Importante</Badge>
                <span className="text-gray-700">No debe comenzarse el trabajo hasta reducir el riesgo</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getRiskLevelColor('moderado')}>Moderado</Badge>
                <span className="text-gray-700">Se deben hacer esfuerzos para reducir el riesgo</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getRiskLevelColor('tolerable')}>Tolerable</Badge>
                <span className="text-gray-700">No necesita mejorar la acción preventiva</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getRiskLevelColor('trivial')}>Trivial</Badge>
                <span className="text-gray-700">No requiere acción específica</span>
              </div>
            </div>
          </section>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
