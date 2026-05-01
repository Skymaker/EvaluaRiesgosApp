import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router';
import { FileText, ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { getWorkCenters, saveEvaluation, getEvaluations } from '../utils/storage';
import {
  WorkCenter,
  RiskEvaluation,
  StructureRiskAssignment,
  JobPositionRiskAssignment,
  JobPositionCategory,
} from '../types';
import { StructureRiskAssignmentComponent } from './StructureRiskAssignment';
import { JobPositionRiskAssignmentComponent } from './JobPositionRiskAssignment';
import { getJobCategories } from '../utils/job-storage';
import { toast } from 'sonner';

export function EvaluationForm() {
  const navigate = useNavigate();
  const { id: evaluationId } = useParams();
  const [searchParams] = useSearchParams();
  const centerId = searchParams.get('centerId');
  const isEditing = !!evaluationId;

  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<WorkCenter | null>(null);
  const [jobCategories, setJobCategories] = useState<JobPositionCategory[]>([]);

  const [formData, setFormData] = useState({
    workCenterId: centerId || '',
    fecha: new Date().toISOString().split('T')[0],
    evaluador: '',
    cargo: '',
    observaciones: '',
    estado: 'en_progreso' as const,
  });

  const [riesgosEstructura, setRiesgosEstructura] = useState<StructureRiskAssignment[]>([]);
  const [riesgosPuestos, setRiesgosPuestos] = useState<JobPositionRiskAssignment[]>([]);

  // Cargar centros y categorías al inicio
  useEffect(() => {
    const centers = getWorkCenters();
    setWorkCenters(centers);

    const categories = getJobCategories();
    setJobCategories(categories);

    console.log('📋 Centros y categorías cargados:', {
      centros: centers.length,
      categorias: categories.length,
    });
  }, []);

  // Cargar datos de la evaluación cuando estamos editando
  useEffect(() => {
    if (!isEditing || !evaluationId || workCenters.length === 0) {
      return;
    }

    const evaluations = getEvaluations();
    const evaluation = evaluations.find(e => e.id === evaluationId);

    if (evaluation) {
      // Formatear fecha para input date (YYYY-MM-DD)
      const fechaFormateada = evaluation.fecha.split('T')[0];

      console.log('🔵 Cargando evaluación para editar:', {
        id: evaluation.id,
        workCenter: evaluation.workCenterName,
        workCenterId: evaluation.workCenterId,
        riesgosEstructura: evaluation.riesgosEstructura?.length || 0,
        riesgosPuestos: evaluation.riesgosPuestos?.length || 0,
      });

      setFormData({
        workCenterId: evaluation.workCenterId,
        fecha: fechaFormateada,
        evaluador: evaluation.evaluador,
        cargo: evaluation.cargo,
        observaciones: evaluation.observaciones,
        estado: evaluation.estado,
      });
      setRiesgosEstructura(evaluation.riesgosEstructura || []);
      setRiesgosPuestos(evaluation.riesgosPuestos || []);

      const center = workCenters.find(c => c.id === evaluation.workCenterId);
      setSelectedCenter(center || null);

      console.log('✅ Datos cargados correctamente:', {
        centro: center?.nombre || 'No encontrado',
        formData: {
          workCenterId: evaluation.workCenterId,
          fecha: fechaFormateada,
          evaluador: evaluation.evaluador,
          cargo: evaluation.cargo,
        },
        riesgosEstructura: evaluation.riesgosEstructura?.length || 0,
        riesgosPuestos: evaluation.riesgosPuestos?.length || 0,
      });
    } else {
      console.error('❌ No se encontró la evaluación con ID:', evaluationId);
    }
  }, [isEditing, evaluationId, workCenters]);

  // Manejar selección inicial cuando NO estamos editando
  useEffect(() => {
    if (isEditing) {
      return;
    }

    if (workCenters.length === 1 && !centerId) {
      setFormData((prev) => ({ ...prev, workCenterId: workCenters[0].id }));
      setSelectedCenter(workCenters[0]);
    } else if (centerId) {
      const center = workCenters.find((c) => c.id === centerId);
      if (center) {
        setFormData((prev) => ({ ...prev, workCenterId: centerId }));
        setSelectedCenter(center);
      }
    }
  }, [centerId, workCenters, isEditing]);

  const handleCenterChange = (centerId: string) => {
    const center = workCenters.find((c) => c.id === centerId);
    setFormData({ ...formData, workCenterId: centerId });
    setSelectedCenter(center || null);
    // Limpiar asignaciones al cambiar de centro (solo en modo creación)
    if (!isEditing) {
      setRiesgosEstructura([]);
      setRiesgosPuestos([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.workCenterId) {
      toast.error('Selecciona un centro de trabajo');
      return;
    }

    if (!formData.evaluador || !formData.cargo) {
      toast.error('Completa los campos del evaluador');
      return;
    }

    if (riesgosEstructura.length === 0 && riesgosPuestos.length === 0) {
      toast.error('Debes asignar al menos un riesgo (ubicación o puesto)');
      return;
    }

    const workCenter = workCenters.find((c) => c.id === formData.workCenterId);
    if (!workCenter) return;

    const evaluation: RiskEvaluation = {
      id: isEditing ? evaluationId! : crypto.randomUUID(),
      workCenterId: formData.workCenterId,
      workCenterName: workCenter.nombre,
      fecha: formData.fecha,
      evaluador: formData.evaluador,
      cargo: formData.cargo,
      riesgos: [], // Mantener vacío para compatibilidad
      riesgosEstructura,
      riesgosPuestos,
      observaciones: formData.observaciones,
      estado: formData.estado,
    };

    saveEvaluation(evaluation);
    toast.success(isEditing ? 'Evaluación actualizada correctamente' : 'Evaluación guardada correctamente');
    navigate('/evaluaciones');
  };

  const totalRiesgos = riesgosEstructura.length + riesgosPuestos.length;

  // Debug: Log del estado actual en cada render
  console.log('🔍 Estado actual del formulario:', {
    isEditing,
    evaluationId,
    formData,
    selectedCenter: selectedCenter?.nombre || 'null',
    riesgosEstructura: riesgosEstructura.length,
    riesgosPuestos: riesgosPuestos.length,
    totalRiesgos,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/evaluaciones')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {isEditing ? 'Editar Evaluación de Riesgos' : 'Nueva Evaluación de Riesgos'}
          </h2>
          <p className="text-gray-600 mt-1">
            Asocia riesgos a ubicaciones y puestos de trabajo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workCenter">Centro de Trabajo *</Label>
              <Select value={formData.workCenterId} onValueChange={handleCenterChange} disabled={isEditing}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un centro" />
                </SelectTrigger>
                <SelectContent>
                  {workCenters.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditing && (
                <p className="text-sm text-gray-500">
                  No se puede cambiar el centro de trabajo al editar una evaluación
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evaluador">Evaluador *</Label>
                <Input
                  id="evaluador"
                  value={formData.evaluador}
                  onChange={(e) => setFormData({ ...formData, evaluador: e.target.value })}
                  required
                  placeholder="Nombre del evaluador"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo *</Label>
                <Input
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  required
                  placeholder="Ej: Técnico PRL"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones Generales</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Añade observaciones generales sobre la evaluación..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Asignación de Riesgos */}
        {selectedCenter ? (
          <Tabs defaultValue="estructura" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="estructura">
                Riesgos por Ubicación ({riesgosEstructura.length})
              </TabsTrigger>
              <TabsTrigger value="puestos">
                Riesgos por Puesto ({riesgosPuestos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="estructura" className="mt-6">
              <StructureRiskAssignmentComponent
                structureTree={selectedCenter.estructuraJerarquica || []}
                assignments={riesgosEstructura}
                onUpdate={setRiesgosEstructura}
              />
            </TabsContent>

            <TabsContent value="puestos" className="mt-6">
              <JobPositionRiskAssignmentComponent
                jobPositions={selectedCenter.puestosTrabajo || []}
                jobCategories={jobCategories}
                assignments={riesgosPuestos}
                onUpdate={setRiesgosPuestos}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Selecciona un centro de trabajo para comenzar a asignar riesgos
            </CardContent>
          </Card>
        )}

        {/* Resumen y Acciones */}
        {selectedCenter && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-900 font-medium">
                    Total de Riesgos Identificados
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mt-1">{totalRiesgos}</div>
                  <div className="text-xs text-blue-700 mt-1">
                    {riesgosEstructura.length} en ubicaciones • {riesgosPuestos.length} en puestos
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => navigate('/evaluaciones')}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={totalRiesgos === 0}>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? 'Actualizar Evaluación' : 'Guardar Evaluación'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
