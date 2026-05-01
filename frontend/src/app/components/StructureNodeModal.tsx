import { useState, useEffect } from 'react';
import { StructureNode, StructureNodeType } from '../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';

interface StructureNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeData: Partial<StructureNode>) => void;
  parentNode: StructureNode | null;
  editingNode: StructureNode | null;
  workCenterId: string;
  allowedTypes?: StructureNodeType[];
}

export function StructureNodeModal({
  isOpen,
  onClose,
  onSave,
  parentNode,
  editingNode,
  workCenterId,
  allowedTypes,
}: StructureNodeModalProps) {
  const isEditing = !!editingNode;

  const [formData, setFormData] = useState({
    tipo: (editingNode?.tipo || allowedTypes?.[0] || 'edificio') as StructureNodeType,
    nombre: editingNode?.nombre || '',
    descripcion: editingNode?.descripcion || '',
    superficie: editingNode?.superficie?.toString() || '',
    capacidad: editingNode?.metadata?.capacidad?.toString() || '',
    numeroPlanta: editingNode?.metadata?.numeroPlanta?.toString() || '',
    tipoElemento: editingNode?.metadata?.tipoElemento || '',
  });

  useEffect(() => {
    if (editingNode) {
      setFormData({
        tipo: editingNode.tipo,
        nombre: editingNode.nombre,
        descripcion: editingNode.descripcion,
        superficie: editingNode.superficie?.toString() || '',
        capacidad: editingNode.metadata?.capacidad?.toString() || '',
        numeroPlanta: editingNode.metadata?.numeroPlanta?.toString() || '',
        tipoElemento: editingNode.metadata?.tipoElemento || '',
      });
    } else {
      setFormData({
        tipo: allowedTypes?.[0] || 'edificio',
        nombre: '',
        descripcion: '',
        superficie: '',
        capacidad: '',
        numeroPlanta: '',
        tipoElemento: '',
      });
    }
  }, [editingNode, allowedTypes, isOpen]);

  const getTypeLabel = (tipo: StructureNodeType): string => {
    const labels: Record<StructureNodeType, string> = {
      edificio: 'Edificio',
      planta: 'Planta',
      elemento_comunicacion_vertical: 'Comunicación Vertical',
      elemento_comunicacion_horizontal: 'Comunicación Horizontal',
      despacho: 'Despacho',
      almacen: 'Almacén',
      aseo: 'Aseo',
      vestuario: 'Vestuario',
      taller: 'Taller',
      sala_reuniones: 'Sala de Reuniones',
      puesto_trabajo: 'Puesto de Trabajo',
      estacion_trabajo: 'Estación de Trabajo',
      generico: 'Genérico',
    };
    return labels[tipo];
  };

  const getAvailableTypes = (): StructureNodeType[] => {
    if (allowedTypes && allowedTypes.length > 0) {
      return allowedTypes;
    }

    if (!parentNode) {
      return ['edificio'];
    }

    const typeChildren: Record<StructureNodeType, StructureNodeType[]> = {
      edificio: ['planta', 'elemento_comunicacion_vertical', 'generico'],
      planta: [
        'despacho',
        'almacen',
        'aseo',
        'vestuario',
        'taller',
        'sala_reuniones',
        'elemento_comunicacion_horizontal',
        'generico',
      ],
      elemento_comunicacion_vertical: [],
      elemento_comunicacion_horizontal: [],
      despacho: ['puesto_trabajo'],
      almacen: [],
      aseo: [],
      vestuario: [],
      taller: ['estacion_trabajo'],
      sala_reuniones: [],
      puesto_trabajo: [],
      estacion_trabajo: [],
      generico: ['puesto_trabajo', 'estacion_trabajo', 'despacho', 'generico'],
    };

    return typeChildren[parentNode.tipo] || [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const nodeData: Partial<StructureNode> = {
      ...(isEditing && { id: editingNode.id }),
      workCenterId,
      tipo: formData.tipo,
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      superficie: formData.superficie ? parseFloat(formData.superficie) : undefined,
      parentId: parentNode?.id,
      metadata: {},
    };

    // Agregar metadatos específicos según el tipo
    if (formData.capacidad && (formData.tipo === 'despacho' || formData.tipo === 'sala_reuniones')) {
      nodeData.metadata!.capacidad = parseInt(formData.capacidad);
    }

    if (formData.numeroPlanta && formData.tipo === 'planta') {
      nodeData.metadata!.numeroPlanta = parseInt(formData.numeroPlanta);
    }

    if (formData.tipoElemento && formData.tipo === 'generico') {
      nodeData.metadata!.tipoElemento = formData.tipoElemento;
    }

    onSave(nodeData);
    onClose();

    // Resetear formulario
    setFormData({
      tipo: allowedTypes?.[0] || 'edificio',
      nombre: '',
      descripcion: '',
      superficie: '',
      capacidad: '',
      numeroPlanta: '',
      tipoElemento: '',
    });
  };

  const availableTypes = getAvailableTypes();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Elemento' : 'Agregar Elemento'}
            {parentNode && ` en ${parentNode.nombre}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica la información del elemento de la estructura'
              : 'Define las características del nuevo elemento'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de elemento */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Elemento *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) =>
                setFormData({ ...formData, tipo: value as StructureNodeType })
              }
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder={
                formData.tipo === 'edificio'
                  ? 'Ej: Edificio Principal'
                  : formData.tipo === 'planta'
                  ? 'Ej: Planta Baja'
                  : formData.tipo === 'despacho'
                  ? 'Ej: Despacho 101'
                  : 'Nombre del elemento'
              }
              required
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Características o información adicional..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Superficie */}
            <div className="space-y-2">
              <Label htmlFor="superficie">Superficie (m²)</Label>
              <Input
                id="superficie"
                type="number"
                step="0.01"
                value={formData.superficie}
                onChange={(e) => setFormData({ ...formData, superficie: e.target.value })}
                placeholder="150.5"
              />
            </div>

            {/* Campos específicos por tipo */}
            {(formData.tipo === 'despacho' || formData.tipo === 'sala_reuniones') && (
              <div className="space-y-2">
                <Label htmlFor="capacidad">Capacidad (personas)</Label>
                <Input
                  id="capacidad"
                  type="number"
                  value={formData.capacidad}
                  onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                  placeholder="4"
                />
              </div>
            )}

            {formData.tipo === 'planta' && (
              <div className="space-y-2">
                <Label htmlFor="numeroPlanta">Número de Planta</Label>
                <Input
                  id="numeroPlanta"
                  type="number"
                  value={formData.numeroPlanta}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroPlanta: e.target.value })
                  }
                  placeholder="0 (Planta Baja)"
                />
              </div>
            )}

            {formData.tipo === 'generico' && (
              <div className="space-y-2">
                <Label htmlFor="tipoElemento">Tipo de Elemento</Label>
                <Input
                  id="tipoElemento"
                  value={formData.tipoElemento}
                  onChange={(e) =>
                    setFormData({ ...formData, tipoElemento: e.target.value })
                  }
                  placeholder="Ej: Jardín, Pabellón deportivo, etc."
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
