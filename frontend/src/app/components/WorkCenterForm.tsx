import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Building2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getWorkCenters, saveWorkCenter } from '../utils/storage';
import { WorkCenter } from '../types';

export function WorkCenterForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState<Omit<WorkCenter, 'id' | 'fechaCreacion'>>({
    nombre: '',
    direccion: '',
    ciudad: '',
    responsable: '',
    telefono: '',
    email: '',
    numeroEmpleados: 0,
    estructura: [],
    puestosTrabajo: [],
  });

  useEffect(() => {
    if (isEditing) {
      const centers = getWorkCenters();
      const center = centers.find(c => c.id === id);
      if (center) {
        setFormData({
          nombre: center.nombre,
          direccion: center.direccion,
          ciudad: center.ciudad,
          responsable: center.responsable,
          telefono: center.telefono,
          email: center.email,
          numeroEmpleados: center.numeroEmpleados,
          estructura: center.estructura || [],
          puestosTrabajo: center.puestosTrabajo || [],
        });
      }
    }
  }, [id, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const center: WorkCenter = {
      id: isEditing ? id! : crypto.randomUUID(),
      ...formData,
      fechaCreacion: isEditing
        ? getWorkCenters().find(c => c.id === id)?.fechaCreacion || new Date().toISOString()
        : new Date().toISOString(),
    };

    saveWorkCenter(center);
    navigate('/centros');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/centros')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {isEditing ? 'Editar Centro de Trabajo' : 'Nuevo Centro de Trabajo'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Actualiza la información del centro' : 'Registra un nuevo centro de trabajo'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Información del Centro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Centro *</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: Centro de Distribución Norte"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  required
                  placeholder="Calle y número"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad *</Label>
                <Input
                  id="ciudad"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  required
                  placeholder="Ciudad, Provincia"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsable">Responsable *</Label>
              <Input
                id="responsable"
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                required
                placeholder="Nombre completo del responsable"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  placeholder="+34 XXX XXX XXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="email@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroEmpleados">Número de Empleados *</Label>
              <Input
                id="numeroEmpleados"
                name="numeroEmpleados"
                type="number"
                min="1"
                value={formData.numeroEmpleados}
                onChange={handleChange}
                required
                placeholder="0"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {isEditing ? 'Actualizar Centro' : 'Registrar Centro'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/centros')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}