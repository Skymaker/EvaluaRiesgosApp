import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Building, ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getWorkCenters, saveWorkCenter } from '../utils/storage';
import { WorkCenter, WorkplaceStructure } from '../types';
import { toast } from 'sonner';

export function WorkCenterStructureForm() {
  const navigate = useNavigate();
  const { centerId, structureId } = useParams();
  const isEditing = !!structureId;

  const [workCenter, setWorkCenter] = useState<WorkCenter | null>(null);
  const [formData, setFormData] = useState({
    tipo: 'planta' as WorkplaceStructure['tipo'],
    nombre: '',
    descripcion: '',
    superficie: '',
  });

  useEffect(() => {
    if (centerId) {
      const centers = getWorkCenters();
      const center = centers.find(c => c.id === centerId);
      setWorkCenter(center || null);

      if (isEditing && structureId && center) {
        const structure = center.estructura.find(s => s.id === structureId);
        if (structure) {
          setFormData({
            tipo: structure.tipo,
            nombre: structure.nombre,
            descripcion: structure.descripcion,
            superficie: structure.superficie?.toString() || '',
          });
        }
      }
    }
  }, [centerId, structureId, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!workCenter || !formData.nombre) {
      toast.error('Completa los campos requeridos');
      return;
    }

    const structure: WorkplaceStructure = {
      id: isEditing ? structureId! : crypto.randomUUID(),
      workCenterId: centerId!,
      tipo: formData.tipo,
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      superficie: formData.superficie ? parseFloat(formData.superficie) : undefined,
      riesgosAsignados: [],
    };

    const updatedCenter: WorkCenter = {
      ...workCenter,
      estructura: isEditing
        ? workCenter.estructura.map(s => (s.id === structureId ? structure : s))
        : [...workCenter.estructura, structure],
    };

    saveWorkCenter(updatedCenter);
    toast.success(isEditing ? 'Ubicación actualizada' : 'Ubicación creada');
    navigate(`/centros/${centerId}/estructura`);
  };

  if (!workCenter) {
    return <div className="text-center py-12">Centro no encontrado</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/centros/${centerId}/estructura`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {isEditing ? 'Editar Ubicación' : 'Nueva Ubicación'}
          </h2>
          <p className="text-gray-600 mt-1">{workCenter.nombre}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Espacio *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo: value as WorkplaceStructure['tipo'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planta">🏢 Planta</SelectItem>
                    <SelectItem value="despacho">🚪 Despacho</SelectItem>
                    <SelectItem value="almacen">📦 Almacén</SelectItem>
                    <SelectItem value="taller">🔧 Taller</SelectItem>
                    <SelectItem value="sala">🏛️ Sala</SelectItem>
                    <SelectItem value="zona_comun">👥 Zona Común</SelectItem>
                    <SelectItem value="otro">📍 Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="superficie">Superficie (m²)</Label>
                <Input
                  id="superficie"
                  type="number"
                  step="0.01"
                  value={formData.superficie}
                  onChange={(e) => setFormData({ ...formData, superficie: e.target.value })}
                  placeholder="Ej: 150.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Ubicación *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                placeholder="Ej: Planta Baja - Zona A, Almacén Principal, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Describe las características de esta ubicación..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex gap-3">
          <Button type="submit" className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? 'Actualizar Ubicación' : 'Crear Ubicación'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/centros/${centerId}/estructura`)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
