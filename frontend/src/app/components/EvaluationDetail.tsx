import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { ArrowLeft, FileText, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/auth-storage';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { getEvaluations } from '../utils/storage';
import { RiskEvaluation } from '../types';
import { EvaluationViewContent } from './EvaluationViewContent';

export function EvaluationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const canManageEvaluations = hasPermission(user, 'crear_evaluaciones');
  const [evaluation, setEvaluation] = useState<RiskEvaluation | null>(null);

  useEffect(() => {
    if (id) {
      const evaluations = getEvaluations();
      const found = evaluations.find((e) => e.id === id);
      setEvaluation(found || null);
    }
  }, [id]);

  if (!evaluation) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">Evaluación no encontrada</h3>
            <Button onClick={() => navigate('/evaluaciones')}>Volver a Evaluaciones</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => navigate('/evaluaciones')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Detalle de Evaluación</h2>
            <p className="mt-1 text-gray-600">Información completa de la evaluación</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
          {canManageEvaluations && id && (
            <Button asChild variant="default" className="w-full sm:w-auto">
              <Link to={`/evaluaciones/editar/${id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar evaluación
              </Link>
            </Button>
          )}
        </div>
      </div>

      <EvaluationViewContent evaluation={evaluation} />
    </div>
  );
}
