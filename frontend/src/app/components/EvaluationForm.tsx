import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { useBlocker, useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { Slider } from './ui/slider';
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
import {
  enrichStructureRiskAssignments,
  enrichJobPositionRiskAssignments,
  syncJobPositionGenericRisksWithCategories,
} from '../utils/evaluation-assignments';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  useUnsavedEvaluationGuard,
  type EvaluationLeaveReason,
} from '../contexts/UnsavedEvaluationGuardContext';
import { IfInformationUI, useUiPreferences } from '../contexts/UiPreferencesContext';
import {
  estadoToSliderIndex,
  normalizeEvaluationEstadoForForm,
  sliderIndexToEstado,
  getStateColor,
} from '../utils/risk-utils';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_EVALUATOR_CARGO = 'Técnico PRL';

function buildEvalAutofill(
  nombreTecnico: string | undefined,
  prev: { evaluador: string; cargo: string },
): { evaluador: string; cargo: string } | null {
  const n = nombreTecnico?.trim();
  if (!n || prev.evaluador.trim() || prev.cargo.trim()) {
    return null;
  }
  return { evaluador: n, cargo: DEFAULT_EVALUATOR_CARGO };
}

function buildEvaluationSnapshot(
  fd: {
    workCenterId: string;
    fecha: string;
    evaluador: string;
    cargo: string;
    observaciones: string;
    estado: string;
  },
  struct: StructureRiskAssignment[],
  puestos: JobPositionRiskAssignment[],
): string {
  return JSON.stringify({
    workCenterId: fd.workCenterId,
    fecha: fd.fecha,
    evaluador: fd.evaluador,
    cargo: fd.cargo,
    observaciones: fd.observaciones,
    estado: fd.estado,
    riesgosEstructura: struct,
    riesgosPuestos: puestos,
  });
}

type EvaluationFormBaselinePayload = {
  workCenterId: string;
  fecha: string;
  evaluador: string;
  cargo: string;
  observaciones: string;
  estado: string;
  riesgosEstructura: StructureRiskAssignment[];
  riesgosPuestos: JobPositionRiskAssignment[];
};

export function EvaluationForm() {
  const navigate = useNavigate();
  const { setGuard } = useUnsavedEvaluationGuard();
  const { user } = useAuth();
  const { showInformationUI } = useUiPreferences();
  const { id: evaluationId } = useParams();
  const [searchParams] = useSearchParams();
  const centerId = searchParams.get('centerId');
  const isEditing = !!evaluationId;

  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<WorkCenter | null>(null);
  const [jobCategories, setJobCategories] = useState<JobPositionCategory[]>([]);

  const [formData, setFormData] = useState<{
    workCenterId: string;
    fecha: string;
    evaluador: string;
    cargo: string;
    observaciones: string;
    estado: RiskEvaluation['estado'];
  }>({
    workCenterId: centerId || '',
    fecha: new Date().toISOString().split('T')[0],
    evaluador: '',
    cargo: '',
    observaciones: '',
    estado: 'en_progreso',
  });

  const [riesgosEstructura, setRiesgosEstructura] = useState<StructureRiskAssignment[]>([]);
  const [riesgosPuestos, setRiesgosPuestos] = useState<JobPositionRiskAssignment[]>([]);

  /** Línea base para detectar cambios sin guardar (null = aún no fijada, no bloquear). */
  const [baselineSnapshot, setBaselineSnapshot] = useState<string | null>(null);
  const newEvaluationIdRef = useRef<string | null>(null);
  const prevCenterIdForBaselineRef = useRef<string | null>(null);
  const isDirtyRef = useRef(false);
  const [externalLeave, setExternalLeave] = useState<{
    proceed: () => void;
    reason: EvaluationLeaveReason;
  } | null>(null);

  // Cargar centros y categorías al inicio
  useEffect(() => {
    const centers = getWorkCenters();
    setWorkCenters(centers);

    const categories = getJobCategories();
    setJobCategories(categories);
  }, []);

  // Cargar datos de la evaluación cuando estamos editando (incluye jobCategories para normalizar puestos)
  useEffect(() => {
    if (!isEditing || !evaluationId || workCenters.length === 0) {
      return;
    }

    const evaluations = getEvaluations();
    const evaluation = evaluations.find((e) => e.id === evaluationId);

    if (evaluation) {
      const fechaFormateada = evaluation.fecha.split('T')[0];
      const estadoNorm = normalizeEvaluationEstadoForForm(evaluation.estado);
      const center = workCenters.find((c) => c.id === evaluation.workCenterId);
      const tree = center?.estructuraJerarquica || [];
      const positions = center?.puestosTrabajo || [];

      const rawStruct = evaluation.riesgosEstructura || [];
      const rawPuestos = evaluation.riesgosPuestos || [];
      const puestosSincronizados = syncJobPositionGenericRisksWithCategories(
        rawPuestos,
        positions,
        jobCategories,
      );

      setFormData({
        workCenterId: evaluation.workCenterId,
        fecha: fechaFormateada,
        evaluador: evaluation.evaluador,
        cargo: evaluation.cargo,
        observaciones: evaluation.observaciones,
        estado: estadoNorm,
      });
      setRiesgosEstructura(
        center ? enrichStructureRiskAssignments(tree, rawStruct) : rawStruct,
      );
      setRiesgosPuestos(
        enrichJobPositionRiskAssignments(positions, jobCategories, puestosSincronizados),
      );
      setSelectedCenter(center || null);
      setBaselineSnapshot(
        buildEvaluationSnapshot(
          {
            workCenterId: evaluation.workCenterId,
            fecha: fechaFormateada,
            evaluador: evaluation.evaluador,
            cargo: evaluation.cargo,
            observaciones: evaluation.observaciones,
            estado: estadoNorm,
          },
          center ? enrichStructureRiskAssignments(tree, rawStruct) : rawStruct,
          enrichJobPositionRiskAssignments(positions, jobCategories, puestosSincronizados),
        ),
      );
    }
  }, [isEditing, evaluationId, workCenters, jobCategories]);

  // Manejar selección inicial cuando NO estamos editando
  useEffect(() => {
    if (isEditing) {
      return;
    }

    if (workCenters.length === 1 && !centerId) {
      setFormData((prev) => {
        const fill = buildEvalAutofill(user?.nombre, prev);
        const wid = workCenters[0].id;
        if (prev.workCenterId === wid && !fill) {
          return prev;
        }
        return { ...prev, workCenterId: wid, ...(fill ?? {}) };
      });
      setSelectedCenter(workCenters[0]);
    } else if (centerId) {
      const center = workCenters.find((c) => c.id === centerId);
      if (center) {
        setFormData((prev) => {
          const fill = buildEvalAutofill(user?.nombre, prev);
          if (prev.workCenterId === centerId && !fill) {
            return prev;
          }
          return { ...prev, workCenterId: centerId, ...(fill ?? {}) };
        });
        setSelectedCenter(center);
      }
    } else {
      setFormData((prev) => {
        const fill = buildEvalAutofill(user?.nombre, prev);
        if (!fill) {
          return prev;
        }
        return { ...prev, ...fill };
      });
    }
  }, [centerId, workCenters, isEditing, user?.nombre]);

  // Línea base en evaluación nueva: al cambiar de centro (no en cada tecla)
  useEffect(() => {
    if (isEditing) {
      return;
    }
    if (!selectedCenter) {
      setBaselineSnapshot(null);
      prevCenterIdForBaselineRef.current = null;
      return;
    }
    if (prevCenterIdForBaselineRef.current !== selectedCenter.id) {
      prevCenterIdForBaselineRef.current = selectedCenter.id;
      setBaselineSnapshot(
        buildEvaluationSnapshot(formData, riesgosEstructura, riesgosPuestos),
      );
    }
  }, [isEditing, selectedCenter, formData, riesgosEstructura, riesgosPuestos]);

  // Si la línea base se fijó sin evaluador/cargo y luego llega el usuario (autorrelleno), alinear baseline
  useEffect(() => {
    if (isEditing || !selectedCenter || baselineSnapshot === null) {
      return;
    }
    let snap: EvaluationFormBaselinePayload;
    try {
      snap = JSON.parse(baselineSnapshot) as EvaluationFormBaselinePayload;
    } catch {
      return;
    }
    if (snap.workCenterId !== selectedCenter.id) {
      return;
    }
    if (snap.evaluador || snap.cargo) {
      return;
    }
    const ev = formData.evaluador?.trim();
    const cg = formData.cargo?.trim();
    if (!ev || !cg) {
      return;
    }
    setBaselineSnapshot(buildEvaluationSnapshot(formData, riesgosEstructura, riesgosPuestos));
  }, [
    isEditing,
    selectedCenter?.id,
    baselineSnapshot,
    formData,
    riesgosEstructura,
    riesgosPuestos,
  ]);

  const handleCenterChange = (centerId: string) => {
    const center = workCenters.find((c) => c.id === centerId);
    setFormData((prev) => {
      const fill = buildEvalAutofill(user?.nombre, prev);
      return { ...prev, workCenterId: centerId, ...(fill ?? {}) };
    });
    setSelectedCenter(center || null);
    if (!isEditing) {
      setRiesgosEstructura([]);
      setRiesgosPuestos([]);
      newEvaluationIdRef.current = null;
    }
  };

  const persistEvaluation = useCallback((): boolean => {
    if (!formData.workCenterId) {
      toast.error('Selecciona un centro de trabajo');
      return false;
    }

    if (!formData.evaluador || !formData.cargo) {
      toast.error('Completa los campos del evaluador');
      return false;
    }

    if (riesgosEstructura.length === 0 && riesgosPuestos.length === 0) {
      toast.error('Debes asignar al menos un riesgo (ubicación o puesto)');
      return false;
    }

    const workCenter = workCenters.find((c) => c.id === formData.workCenterId);
    if (!workCenter) {
      return false;
    }

    const id = isEditing
      ? evaluationId!
      : (newEvaluationIdRef.current ??= crypto.randomUUID());

    const evaluation: RiskEvaluation = {
      id,
      workCenterId: formData.workCenterId,
      workCenterName: workCenter.nombre,
      fecha: formData.fecha,
      evaluador: formData.evaluador,
      cargo: formData.cargo,
      riesgos: [],
      riesgosEstructura,
      riesgosPuestos,
      observaciones: formData.observaciones,
      estado: normalizeEvaluationEstadoForForm(formData.estado),
    };

    saveEvaluation(evaluation);
    toast.success(isEditing ? 'Evaluación actualizada correctamente' : 'Evaluación guardada correctamente');
    // Aplicar baseline de forma síncrona para que useBlocker no intercepte el navigate() del submit
    flushSync(() => {
      setBaselineSnapshot(buildEvaluationSnapshot(formData, riesgosEstructura, riesgosPuestos));
    });
    return true;
  }, [
    isEditing,
    evaluationId,
    formData,
    workCenters,
    riesgosEstructura,
    riesgosPuestos,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!persistEvaluation()) {
      return;
    }
    navigate('/evaluaciones');
  };

  const currentSnapshot = useMemo(
    () => buildEvaluationSnapshot(formData, riesgosEstructura, riesgosPuestos),
    [formData, riesgosEstructura, riesgosPuestos],
  );

  const isDirty =
    baselineSnapshot !== null && currentSnapshot !== baselineSnapshot;

  isDirtyRef.current = isDirty;

  useEffect(() => {
    setGuard({
      isDirty: () => isDirtyRef.current,
      requestLeave: (proceed, reason = 'default') => {
        setExternalLeave({ proceed, reason });
      },
    });
    return () => setGuard(null);
  }, [setGuard]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => {
      if (!isDirty) {
        return false;
      }
      return (
        currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search ||
        currentLocation.hash !== nextLocation.hash
      );
    },
  );

  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const handleBlockedSave = () => {
    if (!persistEvaluation()) {
      return;
    }
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  const handleBlockedCancel = () => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const handleExternalLeaveSave = () => {
    if (!persistEvaluation()) {
      return;
    }
    const proceed = externalLeave?.proceed;
    setExternalLeave(null);
    proceed?.();
  };

  const handleExternalLeaveCancel = () => {
    setExternalLeave(null);
  };

  const externalLeaveDescription: ReactNode =
    externalLeave?.reason === 'logout' ? (
      <>
        Has modificado la evaluación. Si cierras sesión sin guardar, los cambios se perderán.
        Puedes cancelar para seguir editando o guardar la evaluación antes de cerrar sesión.
      </>
    ) : (
      <>
        Has modificado la evaluación. Si continúas sin guardar, los cambios se perderán. Puedes
        cancelar para seguir editando o guardar la evaluación antes de salir.
      </>
    );

  const totalRiesgos = riesgosEstructura.length + riesgosPuestos.length;

  const handleCancelToList = useCallback(() => {
    if (baselineSnapshot !== null) {
      try {
        const snap = JSON.parse(baselineSnapshot) as EvaluationFormBaselinePayload;
        flushSync(() => {
          setFormData({
            workCenterId: snap.workCenterId,
            fecha: snap.fecha,
            evaluador: snap.evaluador,
            cargo: snap.cargo,
            observaciones: snap.observaciones,
            estado: normalizeEvaluationEstadoForForm(snap.estado),
          });
          setRiesgosEstructura(snap.riesgosEstructura ?? []);
          setRiesgosPuestos(snap.riesgosPuestos ?? []);
          setSelectedCenter(workCenters.find((w) => w.id === snap.workCenterId) ?? null);
        });
      } catch {
        // ignore
      }
    } else if (!isEditing) {
      flushSync(() => {
        setFormData({
          workCenterId: centerId || '',
          fecha: new Date().toISOString().split('T')[0],
          evaluador: '',
          cargo: '',
          observaciones: '',
          estado: 'en_progreso',
        });
        setRiesgosEstructura([]);
        setRiesgosPuestos([]);
        setSelectedCenter(centerId ? (workCenters.find((c) => c.id === centerId) ?? null) : null);
        newEvaluationIdRef.current = null;
      });
    }
    navigate('/evaluaciones');
  }, [baselineSnapshot, isEditing, workCenters, centerId, navigate]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
        <Button variant="ghost" size="sm" className="shrink-0" onClick={handleCancelToList}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            {isEditing ? 'Editar Evaluación de Riesgos' : 'Nueva Evaluación de Riesgos'}
          </h2>
          <IfInformationUI>
            <p className="mt-1 text-gray-600">Asocia riesgos a ubicaciones y puestos de trabajo</p>
          </IfInformationUI>
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

            <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
              <Label className="text-base">Estado de la evaluación</Label>
              <div className="flex justify-between gap-2 px-1 text-center">
                <span
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-semibold ${getStateColor('revision')}`}
                >
                  En revisión
                </span>
                <span
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-semibold ${getStateColor('en_progreso')}`}
                >
                  En progreso
                </span>
                <span
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-semibold ${getStateColor('completada')}`}
                >
                  Completada
                </span>
              </div>
              <Slider
                min={0}
                max={2}
                step={1}
                value={[estadoToSliderIndex(formData.estado)]}
                onValueChange={(v) => {
                  const idx = v[0] ?? 1;
                  setFormData({
                    ...formData,
                    estado: sliderIndexToEstado(idx),
                  });
                }}
                className="w-full py-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Asignación de Riesgos */}
        {selectedCenter ? (
          <Tabs defaultValue="estructura" className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-1 gap-1 p-1 sm:grid-cols-2">
              <TabsTrigger value="estructura" className="whitespace-normal px-2 py-2 text-center text-xs sm:text-sm">
                Ubicación ({riesgosEstructura.length})
              </TabsTrigger>
              <TabsTrigger value="puestos" className="whitespace-normal px-2 py-2 text-center text-xs sm:text-sm">
                Puesto ({riesgosPuestos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="estructura" className="mt-6">
              <StructureRiskAssignmentComponent
                key={isEditing ? evaluationId : 'new-eval'}
                structureTree={selectedCenter.estructuraJerarquica || []}
                assignments={riesgosEstructura}
                onUpdate={setRiesgosEstructura}
              />
            </TabsContent>

            <TabsContent value="puestos" className="mt-6">
              <JobPositionRiskAssignmentComponent
                key={isEditing ? evaluationId : 'new-eval'}
                jobPositions={selectedCenter.puestosTrabajo || []}
                jobCategories={jobCategories}
                assignments={riesgosPuestos}
                onUpdate={setRiesgosPuestos}
                enableAutoGenericRisks={!isEditing}
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
          <Card
            className={
              showInformationUI ? 'border-blue-200 bg-blue-50' : 'border border-gray-200 bg-white'
            }
          >
            <CardContent className="space-y-4 pt-6">
              {showInformationUI && (
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <div className="text-sm font-medium text-blue-900">
                      Total de Riesgos Identificados
                    </div>
                    <div className="mt-1 text-3xl font-bold text-blue-600">{totalRiesgos}</div>
                    <div className="mt-1 text-xs text-blue-700">
                      {riesgosEstructura.length} en ubicaciones • {riesgosPuestos.length} en puestos
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button type="button" variant="outline" onClick={handleCancelToList}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={totalRiesgos === 0}>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Actualizar Evaluación' : 'Guardar Evaluación'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>

      <AlertDialog open={blocker.state === 'blocked'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Has modificado la evaluación. Si sales de esta pantalla sin guardar, los cambios se
              perderán. Puedes cancelar para seguir editando o guardar la evaluación antes de salir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel type="button" onClick={handleBlockedCancel}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction type="button" onClick={handleBlockedSave}>
              {isEditing ? 'Actualizar evaluación' : 'Guardar evaluación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={externalLeave !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>{externalLeaveDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel type="button" onClick={handleExternalLeaveCancel}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction type="button" onClick={handleExternalLeaveSave}>
              {isEditing ? 'Actualizar evaluación' : 'Guardar evaluación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
