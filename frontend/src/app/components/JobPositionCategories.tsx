import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Briefcase, Plus, Trash2, Edit, AlertTriangle, Users, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getJobCategories, deleteJobCategory } from '../utils/job-storage';
import { JobPositionCategory } from '../types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useEffect } from 'react';

export function JobPositionCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<JobPositionCategory[]>([]);

  const loadCategories = () => {
    setCategories(getJobCategories());
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = (id: string) => {
    deleteJobCategory(id);
    loadCategories();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Categorías de Puestos de Trabajo</h2>
          <p className="text-gray-600 mt-1">Gestiona las categorías globales de puestos reutilizables</p>
        </div>
        <Button onClick={() => navigate('/puestos/categorias/nueva')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </Button>
      </div>

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Briefcase className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{category.nombre}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{category.descripcion}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/puestos/categorias/editar/${category.id}`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará la categoría pero no
                            afectará a los puestos ya asignados en los centros de trabajo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(category.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {category.actividades.length}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Actividades</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-orange-900">
                      {category.riesgosGenericos.length}
                    </div>
                    <div className="text-xs text-orange-700 mt-1">Riesgos Genéricos</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">
                      {category.episGenericos.length}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">EPIs Genéricos</div>
                  </div>
                </div>

                {category.actividades.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Actividades:</div>
                    <div className="flex flex-wrap gap-2">
                      {category.actividades.slice(0, 3).map((act) => (
                        <Badge key={act.id} variant="outline" className="text-xs">
                          {act.nombre}
                        </Badge>
                      ))}
                      {category.actividades.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{category.actividades.length - 3} más
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Creado: {new Date(category.createdAt).toLocaleDateString('es-ES')}
                </div>
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
                No hay categorías de puestos
              </h3>
              <p className="text-gray-500 mb-6">
                Crea categorías reutilizables de puestos de trabajo con sus riesgos y EPIs genéricos
              </p>
              <Button onClick={() => navigate('/puestos/categorias/nueva')}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Categoría
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
