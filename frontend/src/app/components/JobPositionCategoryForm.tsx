import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Plus, Trash2, Save, Edit, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { getJobCategories, saveJobCategory } from '../utils/job-storage';
import { JobPositionCategory, Activity, Risk, EPI, RiskCategory } from '../types';
import { calculateRiskLevel, getRiskLevelColor, getRiskLevelLabel, getCategoryLabel } from '../utils/risk-utils';
import { toast } from 'sonner';

export function JobPositionCategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });

  const [actividades, setActividades] = useState<Activity[]>([]);
  const [riesgosGenericos, setRiesgosGenericos] = useState<Risk[]>([]);
  const [episGenericos, setEpisGenericos] = useState<EPI[]>([]);

  // Formularios temporales
  const [currentActivity, setCurrentActivity] = useState({
    nombre: '',
    descripcion: '',
  });

  const [currentRisk, setCurrentRisk] = useState({
    categoria: 'seguridad' as RiskCategory,
    descripcion: '',
    probabilidad: 2,
    consecuencias: 2,
    medidasControl: '',
  });

  const [currentEPI, setCurrentEPI] = useState({
    tipo: '',
    descripcion: '',
    normativa: '',
  });

  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityDraft, setActivityDraft] = useState({ nombre: '', descripcion: '' });

  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [riskDraft, setRiskDraft] = useState({
    categoria: 'seguridad' as RiskCategory,
    descripcion: '',
    probabilidad: 2,
    consecuencias: 2,
    medidasControl: '',
  });

  const [editingEpiId, setEditingEpiId] = useState<string | null>(null);
  const [epiDraft, setEpiDraft] = useState({ tipo: '', descripcion: '', normativa: '' });

  const loadCategoryIntoForm = (categoryId: string) => {
    const categories = getJobCategories();
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      setFormData({
        nombre: category.nombre,
        descripcion: category.descripcion,
      });
      setActividades([...category.actividades]);
      setRiesgosGenericos([...category.riesgosGenericos]);
      setEpisGenericos([...category.episGenericos]);
    }
  };

  useEffect(() => {
    if (isEditing && id) {
      loadCategoryIntoForm(id);
    }
  }, [id, isEditing]);

  const handleCancelNavigation = () => {
    cancelActivityEdit();
    cancelRiskEdit();
    cancelEpiEdit();
    setCurrentActivity({ nombre: '', descripcion: '' });
    setCurrentRisk({
      categoria: 'seguridad',
      descripcion: '',
      probabilidad: 2,
      consecuencias: 2,
      medidasControl: '',
    });
    setCurrentEPI({ tipo: '', descripcion: '', normativa: '' });
    if (isEditing && id) {
      loadCategoryIntoForm(id);
    } else {
      setFormData({ nombre: '', descripcion: '' });
      setActividades([]);
      setRiesgosGenericos([]);
      setEpisGenericos([]);
    }
    navigate('/puestos/categorias');
  };

  const cancelActivityEdit = () => {
    setEditingActivityId(null);
    setActivityDraft({ nombre: '', descripcion: '' });
  };

  const startEditActivity = (activity: Activity) => {
    setEditingActivityId(activity.id);
    setActivityDraft({ nombre: activity.nombre, descripcion: activity.descripcion });
  };

  const saveActivityEdit = () => {
    if (!editingActivityId) return;
    if (!activityDraft.nombre.trim()) {
      toast.error('Ingresa un nombre para la actividad');
      return;
    }
    setActividades((prev) =>
      prev.map((a) =>
        a.id === editingActivityId
          ? { ...a, nombre: activityDraft.nombre.trim(), descripcion: activityDraft.descripcion.trim() }
          : a,
      ),
    );
    cancelActivityEdit();
    toast.success('Actividad actualizada');
  };

  const handleAddActivity = () => {
    if (!currentActivity.nombre) {
      toast.error('Ingresa un nombre para la actividad');
      return;
    }

    const newActivity: Activity = {
      id: crypto.randomUUID(),
      nombre: currentActivity.nombre,
      descripcion: currentActivity.descripcion,
      riesgosAsignados: [],
    };

    setActividades([...actividades, newActivity]);
    setCurrentActivity({ nombre: '', descripcion: '' });
    toast.success('Actividad agregada');
  };

  const cancelRiskEdit = () => {
    setEditingRiskId(null);
    setRiskDraft({
      categoria: 'seguridad',
      descripcion: '',
      probabilidad: 2,
      consecuencias: 2,
      medidasControl: '',
    });
  };

  const startEditRisk = (risk: Risk) => {
    setEditingRiskId(risk.id);
    setRiskDraft({
      categoria: risk.categoria,
      descripcion: risk.descripcion,
      probabilidad: risk.probabilidad,
      consecuencias: risk.consecuencias,
      medidasControl: risk.medidasControl,
    });
  };

  const saveRiskEdit = () => {
    if (!editingRiskId) return;
    if (!riskDraft.descripcion.trim()) {
      toast.error('Ingresa una descripción del riesgo');
      return;
    }
    const nivel = calculateRiskLevel(riskDraft.probabilidad, riskDraft.consecuencias);
    setRiesgosGenericos((prev) =>
      prev.map((r) =>
        r.id === editingRiskId
          ? {
              ...r,
              categoria: riskDraft.categoria,
              descripcion: riskDraft.descripcion.trim(),
              medidasControl: riskDraft.medidasControl.trim(),
              probabilidad: riskDraft.probabilidad,
              consecuencias: riskDraft.consecuencias,
              nivel,
            }
          : r,
      ),
    );
    cancelRiskEdit();
    toast.success('Riesgo actualizado');
  };

  const handleAddRisk = () => {
    if (!currentRisk.descripcion) {
      toast.error('Ingresa una descripción del riesgo');
      return;
    }

    const nivel = calculateRiskLevel(currentRisk.probabilidad, currentRisk.consecuencias);

    const newRisk: Risk = {
      id: crypto.randomUUID(),
      categoria: currentRisk.categoria,
      descripcion: currentRisk.descripcion,
      nivel,
      medidasControl: currentRisk.medidasControl,
      probabilidad: currentRisk.probabilidad,
      consecuencias: currentRisk.consecuencias,
    };

    setRiesgosGenericos([...riesgosGenericos, newRisk]);
    setCurrentRisk({
      categoria: 'seguridad',
      descripcion: '',
      probabilidad: 2,
      consecuencias: 2,
      medidasControl: '',
    });
    toast.success('Riesgo genérico agregado');
  };

  const cancelEpiEdit = () => {
    setEditingEpiId(null);
    setEpiDraft({ tipo: '', descripcion: '', normativa: '' });
  };

  const startEditEpi = (epi: EPI) => {
    setEditingEpiId(epi.id);
    setEpiDraft({
      tipo: epi.tipo,
      descripcion: epi.descripcion,
      normativa: epi.normativa || '',
    });
  };

  const saveEpiEdit = () => {
    if (!editingEpiId) return;
    if (!epiDraft.tipo.trim() || !epiDraft.descripcion.trim()) {
      toast.error('Completa tipo y descripción del EPI');
      return;
    }
    setEpisGenericos((prev) =>
      prev.map((e) =>
        e.id === editingEpiId
          ? {
              ...e,
              tipo: epiDraft.tipo.trim(),
              descripcion: epiDraft.descripcion.trim(),
              normativa: epiDraft.normativa.trim(),
            }
          : e,
      ),
    );
    cancelEpiEdit();
    toast.success('EPI actualizado');
  };

  const handleAddEPI = () => {
    if (!currentEPI.tipo || !currentEPI.descripcion) {
      toast.error('Completa tipo y descripción del EPI');
      return;
    }

    const newEPI: EPI = {
      id: crypto.randomUUID(),
      tipo: currentEPI.tipo,
      descripcion: currentEPI.descripcion,
      normativa: currentEPI.normativa,
    };

    setEpisGenericos([...episGenericos, newEPI]);
    setCurrentEPI({ tipo: '', descripcion: '', normativa: '' });
    toast.success('EPI genérico agregado');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre) {
      toast.error('Ingresa un nombre para la categoría');
      return;
    }

    const category: JobPositionCategory = {
      id: isEditing ? id! : crypto.randomUUID(),
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      actividades,
      riesgosGenericos,
      episGenericos,
      createdAt: isEditing
        ? getJobCategories().find(c => c.id === id)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    saveJobCategory(category);
    toast.success(isEditing ? 'Categoría actualizada' : 'Categoría creada');
    navigate('/puestos/categorias');
  };

  const calculatedLevel = calculateRiskLevel(currentRisk.probabilidad, currentRisk.consecuencias);
  const editingRiskCalculatedLevel = calculateRiskLevel(riskDraft.probabilidad, riskDraft.consecuencias);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
        <Button variant="ghost" size="sm" className="shrink-0" onClick={() => navigate('/puestos/categorias')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            {isEditing ? 'Editar Categoría de Puesto' : 'Nueva Categoría de Puesto'}
          </h2>
          <p className="mt-1 text-gray-600">
            Define una categoría reutilizable con actividades, riesgos y EPIs genéricos
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Categoría *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                placeholder="Ej: Operario de Almacén"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Describe las características generales de este puesto..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs para Actividades, Riesgos y EPIs */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de la Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="activities" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-1 gap-1 p-1 min-[440px]:grid-cols-3">
                <TabsTrigger value="activities" className="whitespace-normal px-2 py-2 text-center text-xs sm:text-sm">
                  Actividades ({actividades.length})
                </TabsTrigger>
                <TabsTrigger value="risks" className="whitespace-normal px-2 py-2 text-center text-xs sm:text-sm">
                  Riesgos ({riesgosGenericos.length})
                </TabsTrigger>
                <TabsTrigger value="epis" className="whitespace-normal px-2 py-2 text-center text-xs sm:text-sm">
                  EPIs ({episGenericos.length})
                </TabsTrigger>
              </TabsList>

              {/* Actividades */}
              <TabsContent value="activities" className="space-y-4">
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Nombre de la Actividad</Label>
                    <Input
                      value={currentActivity.nombre}
                      onChange={(e) =>
                        setCurrentActivity({ ...currentActivity, nombre: e.target.value })
                      }
                      placeholder="Ej: Carga y descarga de mercancías"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={currentActivity.descripcion}
                      onChange={(e) =>
                        setCurrentActivity({ ...currentActivity, descripcion: e.target.value })
                      }
                      placeholder="Describe la actividad..."
                      rows={2}
                    />
                  </div>

                  <Button type="button" onClick={handleAddActivity} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Actividad
                  </Button>
                </div>

                {actividades.length > 0 && (
                  <div className="space-y-2">
                    {actividades.map((activity, index) => (
                      <div key={activity.id} className="space-y-3 rounded-lg border bg-white p-3">
                        {editingActivityId === activity.id ? (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-gray-700">
                                Editar actividad #{index + 1}
                              </span>
                              <Button type="button" variant="ghost" size="sm" onClick={cancelActivityEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <Label>Nombre</Label>
                              <Input
                                value={activityDraft.nombre}
                                onChange={(e) =>
                                  setActivityDraft({ ...activityDraft, nombre: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Descripción</Label>
                              <Textarea
                                value={activityDraft.descripcion}
                                onChange={(e) =>
                                  setActivityDraft({ ...activityDraft, descripcion: e.target.value })
                                }
                                rows={2}
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" onClick={saveActivityEdit}>
                                Guardar cambios
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={cancelActivityEdit}>
                                Cancelar
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900">
                                {index + 1}. {activity.nombre}
                              </div>
                              {activity.descripcion && (
                                <p className="mt-1 text-sm text-gray-600">{activity.descripcion}</p>
                              )}
                            </div>
                            <div className="flex shrink-0 gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title="Editar actividad"
                                onClick={() => startEditActivity(activity)}
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title="Eliminar actividad"
                                onClick={() => setActividades(actividades.filter((a) => a.id !== activity.id))}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Riesgos Genéricos */}
              <TabsContent value="risks" className="space-y-4">
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Categoría</Label>
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
                    <Label>Descripción del Riesgo</Label>
                    <Textarea
                      value={currentRisk.descripcion}
                      onChange={(e) => setCurrentRisk({ ...currentRisk, descripcion: e.target.value })}
                      placeholder="Describe el riesgo genérico..."
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
                      placeholder="Medidas de control genéricas..."
                      rows={2}
                    />
                  </div>

                  <Button type="button" onClick={handleAddRisk} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Riesgo Genérico
                  </Button>
                </div>

                {riesgosGenericos.length > 0 && (
                  <div className="space-y-2">
                    {riesgosGenericos.map((risk, index) => (
                      <div key={risk.id} className="space-y-3 rounded-lg border bg-white p-3">
                        {editingRiskId === risk.id ? (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-gray-700">
                                Editar riesgo #{index + 1}
                              </span>
                              <Button type="button" variant="ghost" size="sm" onClick={cancelRiskEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Categoría</Label>
                                <Select
                                  value={riskDraft.categoria}
                                  onValueChange={(value) =>
                                    setRiskDraft({ ...riskDraft, categoria: value as RiskCategory })
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
                                <Label>Nivel calculado</Label>
                                <div className="flex h-10 items-center">
                                  <Badge className={getRiskLevelColor(editingRiskCalculatedLevel)}>
                                    {getRiskLevelLabel(editingRiskCalculatedLevel)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Descripción del riesgo</Label>
                              <Textarea
                                value={riskDraft.descripcion}
                                onChange={(e) =>
                                  setRiskDraft({ ...riskDraft, descripcion: e.target.value })
                                }
                                rows={2}
                              />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Probabilidad (1-3): {riskDraft.probabilidad}</Label>
                                <Input
                                  type="range"
                                  min="1"
                                  max="3"
                                  value={riskDraft.probabilidad}
                                  onChange={(e) =>
                                    setRiskDraft({
                                      ...riskDraft,
                                      probabilidad: parseInt(e.target.value, 10),
                                    })
                                  }
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Baja</span>
                                  <span>Alta</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Consecuencias (1-3): {riskDraft.consecuencias}</Label>
                                <Input
                                  type="range"
                                  min="1"
                                  max="3"
                                  value={riskDraft.consecuencias}
                                  onChange={(e) =>
                                    setRiskDraft({
                                      ...riskDraft,
                                      consecuencias: parseInt(e.target.value, 10),
                                    })
                                  }
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Ligeramente dañino</span>
                                  <span>Extremadamente dañino</span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Medidas de control</Label>
                              <Textarea
                                value={riskDraft.medidasControl}
                                onChange={(e) =>
                                  setRiskDraft({ ...riskDraft, medidasControl: e.target.value })
                                }
                                rows={2}
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" onClick={saveRiskEdit}>
                                Guardar cambios
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={cancelRiskEdit}>
                                Cancelar
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-gray-900">#{index + 1}</span>
                                <Badge className={getRiskLevelColor(risk.nivel)}>
                                  {getRiskLevelLabel(risk.nivel)}
                                </Badge>
                                <Badge variant="outline">{getCategoryLabel(risk.categoria)}</Badge>
                              </div>
                              <p className="text-sm text-gray-900">{risk.descripcion}</p>
                              {risk.medidasControl && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Medidas:</span> {risk.medidasControl}
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title="Editar riesgo"
                                onClick={() => startEditRisk(risk)}
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title="Eliminar riesgo"
                                onClick={() =>
                                  setRiesgosGenericos(riesgosGenericos.filter((r) => r.id !== risk.id))
                                }
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* EPIs Genéricos */}
              <TabsContent value="epis" className="space-y-4">
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Tipo de EPI</Label>
                    <Input
                      value={currentEPI.tipo}
                      onChange={(e) => setCurrentEPI({ ...currentEPI, tipo: e.target.value })}
                      placeholder="Ej: Guantes de seguridad"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={currentEPI.descripcion}
                      onChange={(e) => setCurrentEPI({ ...currentEPI, descripcion: e.target.value })}
                      placeholder="Características del EPI..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Normativa (Opcional)</Label>
                    <Input
                      value={currentEPI.normativa}
                      onChange={(e) => setCurrentEPI({ ...currentEPI, normativa: e.target.value })}
                      placeholder="Ej: EN 388:2016"
                    />
                  </div>

                  <Button type="button" onClick={handleAddEPI} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar EPI Genérico
                  </Button>
                </div>

                {episGenericos.length > 0 && (
                  <div className="space-y-2">
                    {episGenericos.map((epi, index) => (
                      <div key={epi.id} className="space-y-3 rounded-lg border bg-white p-3">
                        {editingEpiId === epi.id ? (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-gray-700">
                                Editar EPI #{index + 1}
                              </span>
                              <Button type="button" variant="ghost" size="sm" onClick={cancelEpiEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <Label>Tipo de EPI</Label>
                              <Input
                                value={epiDraft.tipo}
                                onChange={(e) => setEpiDraft({ ...epiDraft, tipo: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Descripción</Label>
                              <Textarea
                                value={epiDraft.descripcion}
                                onChange={(e) =>
                                  setEpiDraft({ ...epiDraft, descripcion: e.target.value })
                                }
                                rows={2}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Normativa (opcional)</Label>
                              <Input
                                value={epiDraft.normativa}
                                onChange={(e) =>
                                  setEpiDraft({ ...epiDraft, normativa: e.target.value })
                                }
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" onClick={saveEpiEdit}>
                                Guardar cambios
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={cancelEpiEdit}>
                                Cancelar
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900">
                                {index + 1}. {epi.tipo}
                              </div>
                              <p className="mt-1 text-sm text-gray-600">{epi.descripcion}</p>
                              {epi.normativa && (
                                <p className="mt-1 text-xs text-gray-500">Normativa: {epi.normativa}</p>
                              )}
                            </div>
                            <div className="flex shrink-0 gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title="Editar EPI"
                                onClick={() => startEditEpi(epi)}
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title="Eliminar EPI"
                                onClick={() =>
                                  setEpisGenericos(episGenericos.filter((e) => e.id !== epi.id))
                                }
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex gap-3">
          <Button type="submit" className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? 'Actualizar Categoría' : 'Guardar Categoría'}
          </Button>
          <Button type="button" variant="outline" onClick={handleCancelNavigation}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
