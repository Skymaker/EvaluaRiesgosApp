import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getEvaluations } from '../utils/storage';
import { RiskEvaluation } from '../types';
import { EvaluationViewContent } from './EvaluationViewContent';
import { IfInformationUI } from '../contexts/UiPreferencesContext';
import { normalizeEvaluationEstadoForForm } from '../utils/risk-utils';
import { toast } from 'sonner';

function isEvaluationPrintable(e: RiskEvaluation): boolean {
  return normalizeEvaluationEstadoForForm(e.estado) === 'completada';
}

export function PrintDocuments() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<RiskEvaluation[]>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string>('');
  const [selectedEvaluation, setSelectedEvaluation] = useState<RiskEvaluation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const evals = getEvaluations();
    setEvaluations(evals);
  }, []);

  const printableEvaluations = useMemo(
    () => evaluations.filter(isEvaluationPrintable),
    [evaluations],
  );

  useEffect(() => {
    if (selectedEvaluationId && !printableEvaluations.some((e) => e.id === selectedEvaluationId)) {
      setSelectedEvaluationId('');
    }
  }, [selectedEvaluationId, printableEvaluations]);

  useEffect(() => {
    if (selectedEvaluationId) {
      const evaluation = printableEvaluations.find((e) => e.id === selectedEvaluationId);
      setSelectedEvaluation(evaluation || null);
    } else {
      setSelectedEvaluation(null);
    }
  }, [selectedEvaluationId, printableEvaluations]);

  const handleGeneratePDF = async () => {
    if (!documentRef.current || !selectedEvaluation) return;
    if (!isEvaluationPrintable(selectedEvaluation)) {
      toast.error('Solo las evaluaciones completadas pueden imprimirse.');
      return;
    }

    setIsGenerating(true);
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Por favor, permite las ventanas emergentes para generar el PDF');
        setIsGenerating(false);
        return;
      }

      const content = documentRef.current.innerHTML;
      const injectedStyles = Array.from(
        document.querySelectorAll('link[rel="stylesheet"], style'),
      )
        .map((el) => el.outerHTML)
        .join('\n');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Evaluación - ${selectedEvaluation.workCenterName}</title>
            <meta charset="UTF-8">
            ${injectedStyles}
            <style>
              @media print {
                body {
                  margin: 0;
                  padding: 10mm;
                }
                @page {
                  margin: 10mm;
                }
              }
            </style>
          </head>
          <body class="bg-white text-gray-900 antialiased">
            ${content}
          </body>
        </html>
      `);

      printWindow.document.close();

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

  if (evaluations.length === 0) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No hay evaluaciones</h3>
            <p className="mb-6 text-gray-600">Crea una evaluación primero para poder generar documentos.</p>
            <Button onClick={() => navigate('/evaluaciones/nueva')}>Crear Evaluación</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (printableEvaluations.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Impresión de Documentos</h2>
          <p className="mt-1 text-gray-600">
            Solo las evaluaciones en estado <strong>Completada</strong> pueden imprimirse.
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No hay evaluaciones completadas</h3>
            <p className="mb-6 text-gray-600">
              Cuando una evaluación esté marcada como completada, podrás generar aquí el PDF.
            </p>
            <Button variant="outline" onClick={() => navigate('/evaluaciones')}>
              Ir a Evaluaciones
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Impresión de Documentos</h2>
        <IfInformationUI>
          <p className="mt-1 text-gray-600">
            Solo evaluaciones en estado <strong>Completada</strong>. Elige una para generar el PDF.
          </p>
        </IfInformationUI>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Evaluación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="min-w-0 flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">Evaluación</label>
              <Select value={selectedEvaluationId} onValueChange={setSelectedEvaluationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una evaluación" />
                </SelectTrigger>
                <SelectContent>
                  {printableEvaluations.map((evaluation) => (
                    <SelectItem key={evaluation.id} value={evaluation.id}>
                      {evaluation.workCenterName} -{' '}
                      {new Date(evaluation.fecha).toLocaleDateString('es-ES')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedEvaluation && (
              <Button
                onClick={() => void handleGeneratePDF()}
                disabled={isGenerating}
                className="w-full shrink-0 bg-blue-600 hover:bg-blue-700 sm:w-auto"
              >
                <Printer className="mr-2 h-4 w-4" />
                {isGenerating ? 'Abriendo...' : 'Imprimir / Guardar PDF'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedEvaluation && (
        <Card className="overflow-x-auto">
          <CardContent className="p-0">
            <div ref={documentRef} className="bg-white p-4 sm:p-8">
              <div className="mx-auto max-w-4xl space-y-6">
                <EvaluationViewContent evaluation={selectedEvaluation} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
