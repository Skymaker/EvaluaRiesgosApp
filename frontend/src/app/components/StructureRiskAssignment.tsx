import { useState } from 'react';
import { StructureNode, Risk, RiskCategory, StructureRiskAssignment } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  MapPin,
  Plus,
  Trash2,
  ChevronRight,
  AlertTriangle,
  Edit,
  X,
} from 'lucide-react';
import { flattenTree, getNodePath } from '../utils/structure-utils';
import {
  calculateRiskLevel,
  getCategoryLabel,
  getConsecuenciasLabel,
  getProbabilidadLabel,
  getRiskLevelColor,
  getRiskLevelLabel,
} from '../utils/risk-utils';
import { toast } from 'sonner';

interface StructureRiskAssignmentProps {
  structureTree: StructureNode[];
  assignments: StructureRiskAssignment[];
  onUpdate: (assignments: StructureRiskAssignment[]) => void;
}

export function StructureRiskAssignmentComponent({
  structureTree,
  assignments,
  onUpdate,
}: StructureRiskAssignmentProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentRisk, setCurrentRisk] = useState<Partial<Risk>>({
    categoria: 'seguridad',
    descripcion: '',
    probabilidad: 2,
    consecuencias: 2,
    medidasControl: '',
  });

  const flatNodes = flattenTree(structureTree);

  const getNodeDisplayPath = (nodeId: string): string => {
    const path = getNodePath(structureTree, nodeId);
    if (!path) return '';
    return path.map(n => n.nombre).join(' > ');
  };

  const handleAddRisk = () => {
    if (!selectedNodeId) {
      toast.error('Selecciona una ubicación');
      return;
    }

    if (!currentRisk.descripcion) {
      toast.error('Ingresa una descripción del riesgo');
      return;
    }

    const selectedNode = flatNodes.find(n => n.id === selectedNodeId);
    if (!selectedNode) return;

    const nivel = calculateRiskLevel(
      currentRisk.probabilidad || 2,
      currentRisk.consecuencias || 2
    );

    const newRisk: Risk = {
      id: editingIndex !== null ? assignments[editingIndex].risk.id : crypto.randomUUID(),
      categoria: (currentRisk.categoria as RiskCategory) || 'seguridad',
      descripcion: currentRisk.descripcion,
      nivel,
      medidasControl: currentRisk.medidasControl || '',
      probabilidad: currentRisk.probabilidad || 2,
      consecuencias: currentRisk.consecuencias || 2,
    };

    if (editingIndex !== null) {
      // Actualizar riesgo existente
      const updated = [...assignments];
      updated[editingIndex] = {
        ...updated[editingIndex],
        risk: newRisk,
      };
      onUpdate(updated);
      toast.success('Riesgo actualizado');
    } else {
      // Agregar nuevo riesgo
      const newAssignment: StructureRiskAssignment = {
        structureNodeId: selectedNode.id,
        structureNodeName: selectedNode.nombre,
        structureNodePath: getNodeDisplayPath(selectedNode.id),
        risk: newRisk,
      };
      onUpdate([...assignments, newAssignment]);
      toast.success('Riesgo asociado a ubicación');
    }

    // Resetear formulario
    handleCancelEdit();
  };

  const handleEditRisk = (index: number) => {
    const assignment = assignments[index];
    setEditingIndex(index);
    setSelectedNodeId(assignment.structureNodeId);
    setCurrentRisk({
      categoria: assignment.risk.categoria,
      descripcion: assignment.risk.descripcion,
      probabilidad: assignment.risk.probabilidad,
      consecuencias: assignment.risk.consecuencias,
      medidasControl: assignment.risk.medidasControl,
    });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setCurrentRisk({
      categoria: 'seguridad',
      descripcion: '',
      probabilidad: 2,
      consecuencias: 2,
      medidasControl: '',
    });
    setSelectedNodeId('');
  };

  const handleRemoveAssignment = (index: number) => {
    const updated = assignments.filter((_, i) => i !== index);
    onUpdate(updated);
    toast.success('Riesgo eliminado');
  };

  const calculatedLevel = calculateRiskLevel(
    currentRisk.probabilidad || 2,
    currentRisk.consecuencias || 2
  );

  // Agrupar por ubicación
  const groupedByLocation = assignments.reduce((acc, assignment, index) => {
    const key = assignment.structureNodeId || `sin-id-${index}`;
    if (!acc[key]) {
      acc[key] = {
        nodeName: assignment.structureNodeName || 'Ubicación',
        nodePath: assignment.structureNodePath ?? '',
        assignments: [],
      };
    }
    acc[key].assignments.push({ assignment, originalIndex: index });
    return acc;
  }, {} as Record<string, { nodeName: string; nodePath: string; assignments: { assignment: StructureRiskAssignment; originalIndex: number }[] }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Riesgos por Ubicación ({assignments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {flatNodes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No hay estructura definida en este centro de trabajo.</p>
            <p className="text-sm mt-1">Define la estructura antes de asignar riesgos.</p>
          </div>
        ) : (
          <>
            {/* Formulario de asignación */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  {editingIndex !== null ? 'Editar Riesgo de Ubicación' : 'Asignar Nuevo Riesgo a Ubicación'}
                </h3>
                {editingIndex !== null && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Ubicación *</Label>
                <Select value={selectedNodeId} onValueChange={setSelectedNodeId} disabled={editingIndex !== null}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una ubicación..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {flatNodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="font-medium text-gray-900">{node.nombre}</span>
                          <span className="text-xs text-gray-500">{getNodeDisplayPath(node.id)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingIndex !== null && (
                  <p className="text-xs text-gray-500">No se puede cambiar la ubicación al editar</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Categoría del Riesgo</Label>
                  <Select
                    value={currentRisk.categoria}
                    onValueChange={(value) =>
                      setCurrentRisk({ ...currentRisk, categoria: value as RiskCategory })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seguridad">Seguridad</SelectItem>
                      <SelectItem value="ergonomico">Ergonómico</SelectItem>
                      <SelectItem value="quimico">Químico</SelectItem>
                      <SelectItem value="biologico">Biológico</SelectItem>
                      <SelectItem value="fisico">Físico</SelectItem>
                      <SelectItem value="psicosocial">Psicosocial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nivel Calculado</Label>
                  <div className="h-10 flex items-center">
                    <Badge className={getRiskLevelColor(calculatedLevel)}>
                      {getRiskLevelLabel(calculatedLevel)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción del Riesgo *</Label>
                <Textarea
                  value={currentRisk.descripcion}
                  onChange={(e) => setCurrentRisk({ ...currentRisk, descripcion: e.target.value })}
                  placeholder="Describe el riesgo identificado en esta ubicación..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Probabilidad (1-3): {currentRisk.probabilidad}</Label>
                  <Input
                    type="range"
                    min="1"
                    max="3"
                    value={currentRisk.probabilidad}
                    onChange={(e) =>
                      setCurrentRisk({ ...currentRisk, probabilidad: parseInt(e.target.value) })
                    }
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Baja</span>
                    <span>Alta</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Consecuencias (1-3): {currentRisk.consecuencias}</Label>
                  <Input
                    type="range"
                    min="1"
                    max="3"
                    value={currentRisk.consecuencias}
                    onChange={(e) =>
                      setCurrentRisk({ ...currentRisk, consecuencias: parseInt(e.target.value) })
                    }
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Ligeramente dañino</span>
                    <span>Extremadamente dañino</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Medidas de Control</Label>
                <Textarea
                  value={currentRisk.medidasControl}
                  onChange={(e) =>
                    setCurrentRisk({ ...currentRisk, medidasControl: e.target.value })
                  }
                  placeholder="Medidas preventivas y correctivas..."
                  rows={2}
                />
              </div>

              <Button type="button" onClick={handleAddRisk} variant="default" className="w-full">
                {editingIndex !== null ? (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Actualizar Riesgo
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Asignar Riesgo
                  </>
                )}
              </Button>
            </div>

            {/* Lista de asignaciones agrupadas */}
            {assignments.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Riesgos Asignados por Ubicación:</h3>
                {Object.entries(groupedByLocation).map(([locationKey, group]) => (
                  <div key={locationKey} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900">{group.nodeName}</div>
                        <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
                          {(group.nodePath || '')
                            .split(' > ')
                            .map((p) => p.trim())
                            .filter(Boolean)
                            .map((part, i, arr) => (
                              <span key={`${locationKey}-bc-${i}`} className="flex items-center gap-1">
                                {part}
                                {i < arr.length - 1 && <ChevronRight className="h-3 w-3 shrink-0" />}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 ml-6">
                      {group.assignments.map(({ assignment, originalIndex }) => (
                        <div
                          key={originalIndex}
                          className="w-full space-y-2 rounded-lg border border-gray-200 bg-white p-3"
                        >
                          {/* Línea 1: categoría + acciones */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="min-w-0 text-sm font-medium text-gray-900">
                              {getCategoryLabel(assignment.risk.categoria)}
                            </span>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditRisk(originalIndex)}
                                title="Editar riesgo"
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAssignment(originalIndex)}
                                title="Eliminar riesgo"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                          {/* Línea 2: probabilidad | consecuencia + nivel */}
                          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                            <span className="min-w-0 shrink text-xs text-gray-600 sm:hidden">
                              P: {assignment.risk.probabilidad} - C: {assignment.risk.consecuencias}
                            </span>
                            <span className="hidden min-w-0 text-xs text-gray-600 sm:inline">
                              Probabilidad: {getProbabilidadLabel(assignment.risk.probabilidad)} ·
                              Consecuencias: {getConsecuenciasLabel(assignment.risk.consecuencias)}
                            </span>
                            <Badge className={`${getRiskLevelColor(assignment.risk.nivel)} shrink-0`}>
                              {getRiskLevelLabel(assignment.risk.nivel)}
                            </Badge>
                          </div>
                          {/* Línea 3: descripción a ancho completo */}
                          <p className="w-full text-sm leading-snug text-gray-900">
                            {assignment.risk.descripcion}
                          </p>
                          {/* Línea 4: medidas a ancho completo */}
                          {assignment.risk.medidasControl ? (
                            <p className="w-full rounded-md bg-blue-50 p-2 text-xs leading-snug text-gray-700">
                              <span className="font-medium text-gray-800">Medidas: </span>
                              {assignment.risk.medidasControl}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
