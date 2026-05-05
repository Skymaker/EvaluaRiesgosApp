import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Building2,
  Layers,
  ArrowUpDown,
  DoorOpen,
  Package,
  WashingMachine,
  Shirt,
  Wrench,
  Users,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Mountain,
} from 'lucide-react';
import { StructureNode, StructureNodeType } from '../types';
import { getEffectiveNodeArea } from '../utils/structure-utils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';

interface HierarchicalStructureTreeProps {
  nodes: StructureNode[];
  onAddChild: (parentNode: StructureNode | null, type: StructureNodeType) => void;
  onEdit: (node: StructureNode) => void;
  onDelete: (node: StructureNode) => void;
  /** Si devuelve true, no se puede eliminar el nodo (p. ej. riesgos en evaluaciones). */
  isDeleteBlocked?: (node: StructureNode) => boolean;
}

export function HierarchicalStructureTree({
  nodes,
  onAddChild,
  onEdit,
  onDelete,
  isDeleteBlocked,
}: HierarchicalStructureTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const getNodeIcon = (tipo: StructureNodeType) => {
    const iconClass = 'w-4 h-4';
    switch (tipo) {
      case 'edificio':
        return <Building2 className={iconClass} />;
      case 'planta':
        return <Layers className={iconClass} />;
      case 'elemento_comunicacion_vertical':
        return <ArrowUpDown className={iconClass} />;
      case 'elemento_comunicacion_horizontal':
        return <ArrowUpDown className={cn(iconClass, 'rotate-90')} />;
      case 'despacho':
        return <DoorOpen className={iconClass} />;
      case 'almacen':
        return <Package className={iconClass} />;
      case 'aseo':
        return <WashingMachine className={iconClass} />;
      case 'vestuario':
        return <Shirt className={iconClass} />;
      case 'taller':
        return <Wrench className={iconClass} />;
      case 'sala_reuniones':
        return <Users className={iconClass} />;
      case 'puesto_trabajo':
      case 'estacion_trabajo':
        return <MapPin className={iconClass} />;
      case 'generico':
        return <Mountain className={iconClass} />;
      default:
        return <MapPin className={iconClass} />;
    }
  };

  const getNodeTypeLabel = (tipo: StructureNodeType): string => {
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

  const formatAreaM2 = (value: number): string => {
    const rounded = Math.round(value * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  };

  const getAllowedChildren = (tipo: StructureNodeType): StructureNodeType[] => {
    const allowedChildren: Record<StructureNodeType, StructureNodeType[]> = {
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
    return allowedChildren[tipo] || [];
  };

  const renderNode = (node: StructureNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const allowedChildren = getAllowedChildren(node.tipo);
    const canHaveChildren = allowedChildren.length > 0;
    const deleteBlocked = isDeleteBlocked?.(node) ?? false;
    const displayArea = getEffectiveNodeArea(node);

    return (
      <div key={node.id} className="mb-1">
        <div
          className={cn(
            'flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group',
            level === 0 && 'bg-blue-50 hover:bg-blue-100'
          )}
          style={{ marginLeft: `${Math.min(level, 6) * 18}px` }}
        >
          {/* Toggle */}
          <button
            onClick={() => toggleNode(node.id)}
            className="p-0.5 hover:bg-gray-200 rounded"
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          {/* Icon */}
          <div className="text-blue-600">{getNodeIcon(node.tipo)}</div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="min-w-0 font-medium text-gray-900 break-words">{node.nombre}</span>
              <Badge variant="outline" className="shrink-0 text-xs">
                {getNodeTypeLabel(node.tipo)}
              </Badge>
              {displayArea > 0 && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {formatAreaM2(displayArea)} m²
                </Badge>
              )}
            </div>
            {node.descripcion && (
              <p className="text-xs text-gray-500 truncate">{node.descripcion}</p>
            )}
          </div>

          {/* Actions: siempre visibles en táctil; hover solo desde md */}
          <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            {canHaveChildren && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddChild(node, allowedChildren[0])}
                title="Agregar elemento hijo"
              >
                <Plus className="w-3 h-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onEdit(node)} title="Editar">
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => !deleteBlocked && onDelete(node)}
              disabled={deleteBlocked}
              title={
                deleteBlocked
                  ? 'No se puede eliminar: hay riesgos asociados a esta ubicación en una evaluación'
                  : 'Eliminar'
              }
              className="text-red-600 hover:text-red-700 disabled:opacity-40"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {nodes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin estructura definida</h3>
          <p className="text-gray-500 mb-4">
            Comienza agregando un edificio para definir la estructura jerárquica
          </p>
          <Button onClick={() => onAddChild(null, 'edificio')}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Edificio
          </Button>
        </div>
      ) : (
        <>
          {nodes.map((node) => renderNode(node, 0))}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => onAddChild(null, 'edificio')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Otro Edificio
          </Button>
        </>
      )}
    </div>
  );
}
