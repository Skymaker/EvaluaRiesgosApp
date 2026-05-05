import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Briefcase, ArrowLeft, Plus, Trash2, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getWorkCenters, saveWorkCenter, getEvaluations } from '../utils/storage';
import { evaluationReferencesJobPosition } from '../utils/evaluation-references';
import { WorkCenter, JobPositionInstance } from '../types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

export function WorkCenterPositions() {
  const navigate = useNavigate();
  const { centerId } = useParams();
  const [workCenter, setWorkCenter] = useState<WorkCenter | null>(null);

  useEffect(() => {
    if (centerId) {
      const centers = getWorkCenters();
      const center = centers.find(c => c.id === centerId);
      setWorkCenter(center || null);
    }
  }, [centerId]);

  const handleDelete = (positionId: string) => {
    if (!workCenter) return;

    if (evaluationReferencesJobPosition(getEvaluations(), workCenter.id, positionId)) {
      return;
    }

    const updatedCenter: WorkCenter = {
      ...workCenter,
      puestosTrabajo: workCenter.puestosTrabajo.filter(p => p.id !== positionId),
    };

    saveWorkCenter(updatedCenter);
    setWorkCenter(updatedCenter);
  };

  if (!workCenter) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Centro de trabajo no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => navigate('/centros')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Building2 className="h-5 w-5 shrink-0 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">{workCenter.nombre}</h2>
            </div>
            <p className="text-gray-600">Puestos de trabajo asignados a este centro</p>
          </div>
        </div>
        <Link to={`/centros/${centerId}/puestos/asignar`} className="shrink-0 sm:ml-auto">
          <Button className="flex w-full items-center justify-center gap-2 sm:w-auto">
            <Plus className="h-4 w-4" />
            Asignar Puesto
          </Button>
        </Link>
      </div>

      {workCenter.puestosTrabajo.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workCenter.puestosTrabajo.map((position) => {
            const deleteBlocked = evaluationReferencesJobPosition(
              getEvaluations(),
              workCenter.id,
              position.id,
            );
            return (
            <Card key={position.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="shrink-0 rounded-lg bg-green-100 p-2">
                      <Briefcase className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg">{position.categoryName}</CardTitle>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline">{position.numeroEmpleados} empleados</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    <Link to={`/centros/${centerId}/puestos/editar/${position.id}`} className="min-w-0 flex-1 sm:flex-initial">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        Ver Detalles
                      </Button>
                    </Link>
                    {deleteBlocked ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled
                        className="opacity-40"
                        title="No se puede eliminar: hay riesgos en evaluaciones asociados a este puesto"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" title="Eliminar puesto">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar puesto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará el puesto de este centro de trabajo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(position.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 text-center min-[400px]:grid-cols-3 sm:gap-4">
                  <div className="rounded-lg bg-orange-50 p-3">
                    <div className="text-xl font-bold text-orange-900">{position.riesgosEspecificos.length}</div>
                    <div className="mt-1 text-xs text-orange-700">Riesgos específicos</div>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3">
                    <div className="text-xl font-bold text-blue-900">{position.episEspecificos.length}</div>
                    <div className="mt-1 text-xs text-blue-700">EPIs específicos</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xl font-bold text-gray-900">{position.actividadesPersonalizadas.length}</div>
                    <div className="mt-1 text-xs text-gray-700">Actividades extra</div>
                  </div>
                </div>

                {position.observaciones && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{position.observaciones}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay puestos asignados
              </h3>
              <p className="text-gray-500 mb-6">
                Asigna puestos de trabajo desde las categorías disponibles
              </p>
              <Link to={`/centros/${centerId}/puestos/asignar`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Asignar Puesto
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
