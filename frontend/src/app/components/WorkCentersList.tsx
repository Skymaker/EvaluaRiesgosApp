import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Building2, Plus, MapPin, User, Phone, Mail, Users, Trash2, Edit, Layout as LayoutIcon, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { getWorkCenters, deleteWorkCenter } from '../utils/storage';
import { WorkCenter } from '../types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

export function WorkCentersList() {
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);

  const loadWorkCenters = () => {
    setWorkCenters(getWorkCenters());
  };

  useEffect(() => {
    loadWorkCenters();
  }, []);

  const handleDelete = (id: string) => {
    deleteWorkCenter(id);
    loadWorkCenters();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Centros de Trabajo</h2>
          <p className="mt-1 text-gray-600">Gestiona los centros de trabajo registrados</p>
        </div>
        <Link to="/centros/nuevo" className="shrink-0 sm:self-start">
          <Button className="flex w-full items-center justify-center gap-2 sm:w-auto">
            <Plus className="h-4 w-4" />
            Nuevo Centro
          </Button>
        </Link>
      </div>

      {workCenters.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workCenters.map((center) => (
            <Card key={center.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="shrink-0 rounded-lg bg-blue-100 p-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-lg">{center.nombre}</CardTitle>
                      <p className="mt-1 text-sm text-gray-500">
                        Registrado el {new Date(center.fechaCreacion).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-start">
                    <Link to={`/centros/editar/${center.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
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
                          <AlertDialogTitle>¿Eliminar centro de trabajo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el centro de trabajo
                            y todas sus evaluaciones asociadas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(center.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">{center.direccion}</div>
                    <div className="text-gray-500">{center.ciudad}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{center.responsable}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{center.telefono}</span>
                </div>
                
                <div className="flex items-start gap-2 text-sm">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <span className="break-all text-gray-900">{center.email}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{center.numeroEmpleados} empleados</span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                    <Link to={`/centros/${center.id}/estructura`}>
                      <Button variant="outline" className="w-full text-sm">
                        <LayoutIcon className="mr-2 h-4 w-4 shrink-0" />
                        Estructura
                      </Button>
                    </Link>
                    <Link to={`/centros/${center.id}/puestos`}>
                      <Button variant="outline" className="w-full text-sm">
                        <Briefcase className="mr-2 h-4 w-4 shrink-0" />
                        Puestos
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay centros de trabajo</h3>
              <p className="text-gray-500 mb-6">Comienza registrando tu primer centro de trabajo</p>
              <Link to="/centros/nuevo">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Centro
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}