import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Briefcase, ArrowLeft, Plus, Trash2, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getWorkCenters, saveWorkCenter } from '../utils/storage';
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/centros')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-900">{workCenter.nombre}</h2>
          </div>
          <p className="text-gray-600">Puestos de trabajo asignados a este centro</p>
        </div>
        <Link to={`/centros/${centerId}/puestos/asignar`}>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Asignar Puesto
          </Button>
        </Link>
      </div>

      {workCenter.puestosTrabajo.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workCenter.puestosTrabajo.map((position) => (
            <Card key={position.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Briefcase className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{position.categoryName}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{position.numeroEmpleados} empleados</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/centros/${centerId}/puestos/editar/${position.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Detalles
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-xl font-bold text-orange-900">
                      {position.riesgosEspecificos.length}
                    </div>
                    <div className="text-xs text-orange-700 mt-1">Riesgos Específicos</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xl font-bold text-blue-900">
                      {position.episEspecificos.length}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">EPIs Específicos</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xl font-bold text-gray-900">
                      {position.actividadesPersonalizadas.length}
                    </div>
                    <div className="text-xs text-gray-700 mt-1">Actividades Extra</div>
                  </div>
                </div>

                {position.observaciones && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{position.observaciones}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
