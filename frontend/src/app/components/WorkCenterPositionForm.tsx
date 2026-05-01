import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Briefcase, ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getWorkCenters, saveWorkCenter } from '../utils/storage';
import { getJobCategories, getJobCategoryById } from '../utils/job-storage';
import { WorkCenter, JobPositionInstance, JobPositionCategory } from '../types';
import { toast } from 'sonner';

export function WorkCenterPositionForm() {
  const navigate = useNavigate();
  const { centerId, positionId } = useParams();
  const isEditing = !!positionId;

  const [workCenter, setWorkCenter] = useState<WorkCenter | null>(null);
  const [categories, setCategories] = useState<JobPositionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<JobPositionCategory | null>(null);

  const [formData, setFormData] = useState({
    categoryId: '',
    numeroEmpleados: 1,
    observaciones: '',
  });


  useEffect(() => {
    if (centerId) {
      const centers = getWorkCenters();
      const center = centers.find(c => c.id === centerId);
      setWorkCenter(center || null);
      setCategories(getJobCategories());

      if (isEditing && positionId && center) {
        const position = center.puestosTrabajo.find(p => p.id === positionId);
        if (position) {
          setFormData({
            categoryId: position.categoryId,
            numeroEmpleados: position.numeroEmpleados,
            observaciones: position.observaciones,
          });
          
          const cat = getJobCategoryById(position.categoryId);
          setSelectedCategory(cat || null);
        }
      }
    }
  }, [centerId, positionId, isEditing]);

  const handleCategoryChange = (categoryId: string) => {
    setFormData({ ...formData, categoryId });
    const category = getJobCategoryById(categoryId);
    setSelectedCategory(category || null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!workCenter || !formData.categoryId) {
      toast.error('Selecciona una categoría de puesto');
      return;
    }

    const category = getJobCategoryById(formData.categoryId);
    if (!category) {
      toast.error('Categoría no encontrada');
      return;
    }

    const positionInstance: JobPositionInstance = {
      id: isEditing ? positionId! : crypto.randomUUID(),
      workCenterId: centerId!,
      categoryId: formData.categoryId,
      categoryName: category.nombre,
      numeroEmpleados: formData.numeroEmpleados,
      riesgosEspecificos: [],
      episEspecificos: [],
      actividadesPersonalizadas: [],
      observaciones: formData.observaciones,
    };

    const updatedCenter: WorkCenter = {
      ...workCenter,
      puestosTrabajo: isEditing
        ? workCenter.puestosTrabajo.map(p => p.id === positionId ? positionInstance : p)
        : [...workCenter.puestosTrabajo, positionInstance],
    };

    saveWorkCenter(updatedCenter);
    toast.success(isEditing ? 'Puesto actualizado' : 'Puesto asignado');
    navigate(`/centros/${centerId}/puestos`);
  };

  if (!workCenter) {
    return <div className="text-center py-12">Centro no encontrado</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/centros/${centerId}/puestos`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {isEditing ? 'Editar Puesto' : 'Asignar Puesto de Trabajo'}
          </h2>
          <p className="text-gray-600 mt-1">{workCenter.nombre}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de Categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Puesto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría de Puesto *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={handleCategoryChange}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categories.length === 0 && (
                <p className="text-sm text-amber-600">
                  No hay categorías disponibles. Crea categorías primero.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroEmpleados">Número de Empleados *</Label>
              <Input
                id="numeroEmpleados"
                type="number"
                min="1"
                value={formData.numeroEmpleados}
                onChange={(e) =>
                  setFormData({ ...formData, numeroEmpleados: parseInt(e.target.value) || 1 })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones Específicas del Centro</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Añade observaciones específicas para este puesto en este centro..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Información de la Categoría */}
        {selectedCategory && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">
                Elementos Genéricos de "{selectedCategory.nombre}"
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-xl font-bold text-gray-900">
                    {selectedCategory.actividades.length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Actividades</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-xl font-bold text-orange-900">
                    {selectedCategory.riesgosGenericos.length}
                  </div>
                  <div className="text-xs text-orange-700 mt-1">Riesgos Genéricos</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-xl font-bold text-blue-900">
                    {selectedCategory.episGenericos.length}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">EPIs Genéricos</div>
                </div>
              </div>
              <p className="text-sm text-blue-800 mt-4">
                Estos elementos están definidos en la categoría. Los riesgos se asignarán en la evaluación.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Información Adicional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Los riesgos genéricos de esta categoría se asignarán automáticamente cuando realices una evaluación.
                Los EPIs y actividades están definidos en la categoría del puesto.
              </p>
            </div>
          </CardContent>
        </Card>


        {/* Acciones */}
        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={!formData.categoryId}>
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? 'Actualizar Puesto' : 'Asignar Puesto'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/centros/${centerId}/puestos`)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
