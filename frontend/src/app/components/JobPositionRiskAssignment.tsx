import { useState, useEffect, useMemo } from 'react';
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
  getConsecuenciasLabel,
  getProbabilidadLabel,
  getRiskLevelColor,
  getRiskLevelLabel,
} from '../utils/risk-utils';
import { toast } from 'sonner';
import { IfInformationUI } from '../contexts/UiPreferencesContext';
import { syncJobPositionGenericRisksWithCategories } from '../utils/evaluation-assignments';

interface JobPositionRiskAssignmentProps {
  jobPositions: JobPositionInstance[];
  jobCategories: JobPositionCategory[];
  assignments: JobPositionRiskAssignment[];
  onUpdate: (assignments: JobPositionRiskAssignment[]) => void;
  /**
   * En evaluación nueva, true: inyectar genéricos de categoría y permitir quitarlos de esta evaluación.
   * En edición, false: los genéricos se sincronizan con las categorías (no editar ni borrar aquí).
   */
  enableAutoGenericRisks?: boolean;
}

export function JobPositionRiskAssignmentComponent({
  jobPositions,
  jobCategories,
  assignments,
  onUpdate,
  enableAutoGenericRisks = true,
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

  const syncedAssignments = useMemo(() => {
    if (enableAutoGenericRisks) {
      return assignments;
    }
    const synced = syncJobPositionGenericRisksWithCategories(
      assignments,
      jobPositions,
      jobCategories,
    );
    return JSON.stringify(synced) === JSON.stringify(assignments) ? assignments : synced;
  }, [assignments, jobPositions, jobCategories, enableAutoGenericRisks]);

  useEffect(() => {
    if (enableAutoGenericRisks) {
      return;
    }
    if (syncedAssignments !== assignments) {
      onUpdate(syncedAssignments);
    }
  }, [enableAutoGenericRisks, assignments, syncedAssignments, onUpdate]);

  // Cargar riesgos genéricos solo en evaluación nueva (no al editar: los datos guardados ya incluyen plantillas)
  useEffect(() => {
    if (
      !enableAutoGenericRisks ||
      jobPositions.length === 0 ||
      genericRisksLoaded
    ) {
      return;
    }
    loadGenericRisks();
    setGenericRisksLoaded(true);
  }, [jobPositions, genericRisksLoaded, enableAutoGenericRisks]);

  const loadGenericRisks = () => {
    const genericAssignments: JobPositionRiskAssignment[] = [];

    jobPositions.forEach((position) => {
      const category = jobCategories.find((c) => c.id === position.categoryId);
      if (category && category.riesgosGenericos) {
        category.riesgosGenericos.forEach((risk) => {
          // Misma posición + mismo id de riesgo (genérico o ya guardado), no duplicar
          const alreadyExists = assignments.some(
            (a) => a.jobPositionId === position.id && a.risk.id === risk.id,
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
    const row = assignments[index];
    if (!enableAutoGenericRisks && row?.isGeneric) {
      toast.error(
        'Los riesgos genéricos no se pueden eliminar desde la evaluación. Edítalos o bórralos en Puestos de trabajo (categorías).',
      );
      return;
    }
    const updated = assignments.filter((_, i) => i !== index);
    onUpdate(updated);
    toast.success('Riesgo eliminado');
  };

  const calculatedLevel = calculateRiskLevel(
    currentRisk.probabilidad || 2,
    currentRisk.consecuencias || 2
  );

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
            <IfInformationUI>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div className="text-sm text-blue-900">
                    <p className="mb-1 font-medium">Riesgos Genéricos y Específicos</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>
                        <strong>Genéricos:</strong> Se cargan automáticamente de las categorías de
                        puestos
                      </li>
                      <li>
                        <strong>Específicos:</strong> Riesgos adicionales propios de este centro de
                        trabajo
                      </li>
                      {!enableAutoGenericRisks && (
                        <li>
                          <strong>Al editar la evaluación:</strong> los genéricos coinciden con las
                          categorías y no se pueden editar ni eliminar aquí. Hazlo en{' '}
                          <span className="font-medium">Puestos de trabajo</span>; los cambios se
                          aplican a las evaluaciones que usen esos puestos.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </IfInformationUI>

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
                  placeholder="Describe el riesgo específico de este puesto en el centro..."
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
                    Agregar Riesgo Específico
                  </>
                )}
              </Button>
            </div>

            {/* Lista de asignaciones agrupadas */}
            {assignments.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Riesgos Asignados por Puesto:</h3>
                {Object.entries(groupedByPosition).map(([positionId, group]) => (
                  <div key={positionId} className="space-y-3 rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start gap-2 text-sm">
                      <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
                      <div className="font-medium text-gray-900">{group.positionName}</div>
                    </div>

                    <div className="ml-6 space-y-2">
                      {group.assignments.map(({ assignment, originalIndex }) => (
                        <div
                          key={originalIndex}
                          className="w-full space-y-2 rounded-lg border border-gray-200 bg-white p-3"
                        >
                          {/* Línea 1: solo genérico / específico + acciones (equivalente a categoría + acciones en ubicación) */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="min-w-0 text-sm font-medium text-gray-900">
                              {assignment.isGeneric ? (
                                <Badge variant="secondary" className="text-xs font-medium">
                                  Genérico
                                </Badge>
                              ) : (
                                <Badge variant="default" className="text-xs font-medium">
                                  Específico
                                </Badge>
                              )}
                            </span>
                            <div className="flex shrink-0 items-center gap-0.5">
                              {!assignment.isGeneric && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRisk(originalIndex)}
                                  title="Editar riesgo"
                                >
                                  <Edit className="h-4 w-4 text-blue-600" />
                                </Button>
                              )}
                              {(enableAutoGenericRisks || !assignment.isGeneric) && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveAssignment(originalIndex)}
                                  title="Eliminar riesgo"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {/* Línea 2: categoría del riesgo + misma fila P/C + nivel que en ubicación */}
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-800">
                              {getCategoryLabel(assignment.risk.categoria)}
                            </span>
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
