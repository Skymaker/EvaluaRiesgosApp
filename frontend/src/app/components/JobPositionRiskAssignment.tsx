import { useState, useEffect } from 'react';
import {
  JobPositionInstance,
  Risk,
  RiskCategory,
  JobPositionRiskAssignment,
  JobPositionCategory,
} from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Briefcase, Plus, Trash2, AlertTriangle, Info, Edit, X } from 'lucide-react';
import {
  calculateRiskLevel,
  getCategoryLabel,
  getRiskLevelColor,
  getRiskLevelLabel,
} from '../utils/risk-utils';
import { toast } from 'sonner';

interface JobPositionRiskAssignmentProps {
  jobPositions: JobPositionInstance[];
  jobCategories: JobPositionCategory[];
  assignments: JobPositionRiskAssignment[];
  onUpdate: (assignments: JobPositionRiskAssignment[]) => void;
}

export function JobPositionRiskAssignmentComponent({
  jobPositions,
  jobCategories,
  assignments,
  onUpdate,
}: JobPositionRiskAssignmentProps) {
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentRisk, setCurrentRisk] = useState<Partial<Risk>>({
    categoria: 'seguridad',
    descripcion: '',
    probabilidad: 2,
    consecuencias: 2,
    medidasControl: '',
  });
  const [genericRisksLoaded, setGenericRisksLoaded] = useState(false);

  // Cargar riesgos genéricos automáticamente
  useEffect(() => {
    if (jobPositions.length > 0 && !genericRisksLoaded) {
      loadGenericRisks();
      setGenericRisksLoaded(true);
    }
  }, [jobPositions, genericRisksLoaded]);

  const loadGenericRisks = () => {
    const genericAssignments: JobPositionRiskAssignment[] = [];

    jobPositions.forEach((position) => {
      const category = jobCategories.find((c) => c.id === position.categoryId);
      if (category && category.riesgosGenericos) {
        category.riesgosGenericos.forEach((risk) => {
          // Verificar que no esté ya agregado
          const alreadyExists = assignments.some(
            (a) => a.jobPositionId === position.id && a.risk.id === risk.id && a.isGeneric
          );

          if (!alreadyExists) {
            genericAssignments.push({
              jobPositionId: position.id,
              jobPositionName: position.categoryName,
              risk: risk,
              isGeneric: true,
            });
          }
        });
      }
    });

    if (genericAssignments.length > 0) {
      onUpdate([...assignments, ...genericAssignments]);
    }
  };

  const handleAddRisk = () => {
    if (!selectedPositionId) {
      toast.error('Selecciona un puesto de trabajo');
      return;
    }

    if (!currentRisk.descripcion) {
      toast.error('Ingresa una descripción del riesgo');
      return;
    }

    const selectedPosition = jobPositions.find((p) => p.id === selectedPositionId);
    if (!selectedPosition) return;

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
      const newAssignment: JobPositionRiskAssignment = {
        jobPositionId: selectedPosition.id,
        jobPositionName: selectedPosition.categoryName,
        risk: newRisk,
        isGeneric: false, // Riesgo específico del centro
      };
      onUpdate([...assignments, newAssignment]);
      toast.success('Riesgo específico asociado al puesto');
    }

    // Resetear formulario
    handleCancelEdit();
  };

  const handleEditRisk = (index: number) => {
    const assignment = assignments[index];

    // No permitir editar riesgos genéricos
    if (assignment.isGeneric) {
      toast.error('No se pueden editar riesgos genéricos. Edítalos desde la categoría del puesto.');
      return;
    }

    setEditingIndex(index);
    setSelectedPositionId(assignment.jobPositionId);
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
    setSelectedPositionId('');
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

  // Debug: Log de assignments recibidos
  console.log('💼 JobPositionRiskAssignment - assignments recibidos:', assignments.length, assignments);

  // Agrupar por puesto
  const groupedByPosition = assignments.reduce(
    (acc, assignment, index) => {
      const key = assignment.jobPositionId;
      if (!acc[key]) {
        acc[key] = {
          positionName: assignment.jobPositionName,
          assignments: [],
        };
      }
      acc[key].assignments.push({ assignment, originalIndex: index });
      return acc;
    },
    {} as Record<
      string,
      {
        positionName: string;
        assignments: { assignment: JobPositionRiskAssignment; originalIndex: number }[];
      }
    >
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-purple-600" />
          Riesgos por Puesto de Trabajo ({assignments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {jobPositions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No hay puestos de trabajo asignados en este centro.</p>
            <p className="text-sm mt-1">
              Define los puestos en el apartado "Centros de Trabajo" antes de asignar riesgos.
            </p>
          </div>
        ) : (
          <>
            {/* Información */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Riesgos Genéricos y Específicos</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>
                      <strong>Genéricos:</strong> Se cargan automáticamente de las categorías de puestos
                    </li>
                    <li>
                      <strong>Específicos:</strong> Riesgos adicionales propios de este centro de
                      trabajo
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Formulario de asignación de riesgos específicos */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  {editingIndex !== null ? 'Editar Riesgo Específico' : 'Agregar Riesgo Específico al Puesto'}
                </h3>
                {editingIndex !== null && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Puesto de Trabajo *</Label>
                <Select value={selectedPositionId} onValueChange={setSelectedPositionId} disabled={editingIndex !== null}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un puesto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobPositions.map((position) => (
                      <SelectItem key={position.id} value={position.id}>
                        {position.categoryName} ({position.numeroEmpleados} empleado
                        {position.numeroEmpleados !== 1 ? 's' : ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingIndex !== null && (
                  <p className="text-xs text-gray-500">No se puede cambiar el puesto al editar</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  placeholder="Describe el riesgo específico de este puesto en el centro..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    Agregar Riesgo Específico
                  </>
                )}
              </Button>
            </div>

            {/* Lista de asignaciones agrupadas */}
            {assignments.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Riesgos Asignados por Puesto:</h3>
                {Object.values(groupedByPosition).map((group, groupIndex) => (
                  <div
                    key={groupIndex}
                    className="border border-gray-200 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start gap-2 text-sm">
                      <Briefcase className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="font-medium text-gray-900">{group.positionName}</div>
                    </div>

                    <div className="space-y-2 ml-6">
                      {group.assignments.map(({ assignment, originalIndex }) => (
                        <div
                          key={originalIndex}
                          className="p-3 bg-white border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                {assignment.isGeneric && (
                                  <Badge variant="secondary" className="text-xs">
                                    Genérico
                                  </Badge>
                                )}
                                {!assignment.isGeneric && (
                                  <Badge variant="default" className="text-xs">
                                    Específico
                                  </Badge>
                                )}
                                <Badge className={getRiskLevelColor(assignment.risk.nivel)}>
                                  {getRiskLevelLabel(assignment.risk.nivel)}
                                </Badge>
                                <Badge variant="outline">
                                  {getCategoryLabel(assignment.risk.categoria)}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  P: {assignment.risk.probabilidad} | C:{' '}
                                  {assignment.risk.consecuencias}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900">{assignment.risk.descripcion}</p>
                              {assignment.risk.medidasControl && (
                                <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                                  <span className="font-medium">Medidas:</span>{' '}
                                  {assignment.risk.medidasControl}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {!assignment.isGeneric && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRisk(originalIndex)}
                                  title="Editar riesgo"
                                >
                                  <Edit className="w-4 h-4 text-blue-600" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAssignment(originalIndex)}
                                title="Eliminar riesgo"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
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
