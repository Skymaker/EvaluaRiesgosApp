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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Centros de Trabajo</h2>
          <p className="text-gray-600 mt-1">Gestiona los centros de trabajo registrados</p>
        </div>
        <Link to="/centros/nuevo">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Centro
          </Button>
        </Link>
      </div>

      {workCenters.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workCenters.map((center) => (
            <Card key={center.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{center.nombre}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Registrado el {new Date(center.fechaCreacion).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{center.email}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{center.numeroEmpleados} empleados</span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2">
                    <Link to={`/centros/${center.id}/estructura`}>
                      <Button variant="outline" className="w-full text-sm">
                        <LayoutIcon className="w-4 h-4 mr-2" />
                        Estructura
                      </Button>
                    </Link>
                    <Link to={`/centros/${center.id}/puestos`}>
                      <Button variant="outline" className="w-full text-sm">
                        <Briefcase className="w-4 h-4 mr-2" />
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