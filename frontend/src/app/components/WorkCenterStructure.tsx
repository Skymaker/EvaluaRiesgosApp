import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Building, ArrowLeft, Info, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { getWorkCenters, saveWorkCenter, getEvaluations } from '../utils/storage';
import { structureNodeDeletionBlockedByEvaluations } from '../utils/evaluation-references';
import { WorkCenter, StructureNode, StructureNodeType } from '../types';
import { HierarchicalStructureTree } from './HierarchicalStructureTree';
import { StructureNodeModal } from './StructureNodeModal';
import {
  addNodeToTree,
  updateNodeInTree,
  deleteNodeFromTree,
  findNodeById,
  countAllNodes,
  countAllRisks,
  calculateTotalArea,
} from '../utils/structure-utils';

const STRUCTURE_TYPE_CHILDREN: Record<StructureNodeType, StructureNodeType[]> = {
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
import { toast } from 'sonner';
import { IfInformationUI } from '../contexts/UiPreferencesContext';

export function WorkCenterStructure() {
  const navigate = useNavigate();
  const { centerId } = useParams();
  const [workCenter, setWorkCenter] = useState<WorkCenter | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parentNode, setParentNode] = useState<StructureNode | null>(null);
  const [editingNode, setEditingNode] = useState<StructureNode | null>(null);
  const [allowedTypes, setAllowedTypes] = useState<StructureNodeType[]>([]);
  const [nodeToDelete, setNodeToDelete] = useState<StructureNode | null>(null);

  useEffect(() => {
    if (centerId) {
      const centers = getWorkCenters();
      const center = centers.find((c) => c.id === centerId);
      if (center) {
        // Asegurar que estructuraJerarquica existe
        if (!center.estructuraJerarquica) {
          center.estructuraJerarquica = [];
        }
        setWorkCenter(center);
      }
    }
  }, [centerId]);

  const closeStructureModal = () => {
    setIsModalOpen(false);
    setEditingNode(null);
    setParentNode(null);
    setAllowedTypes([]);
  };

  const handleAddChild = (parent: StructureNode | null, _defaultType: StructureNodeType) => {
    setParentNode(parent);
    setEditingNode(null);

    if (!parent) {
      setAllowedTypes(['edificio']);
    } else {
      setAllowedTypes(STRUCTURE_TYPE_CHILDREN[parent.tipo] || []);
    }

    setIsModalOpen(true);
  };

  const handleEdit = (node: StructureNode) => {
    if (!workCenter) return;
    const tree = workCenter.estructuraJerarquica || [];
    const parent = node.parentId ? findNodeById(tree, node.parentId) : null;
    setEditingNode(node);
    setParentNode(parent);
    if (!parent) {
      // Raíz (sin parentId) → solo edificio; si hay parentId pero no se encontró el padre, al menos el tipo actual
      setAllowedTypes(node.parentId ? [node.tipo] : ['edificio']);
    } else {
      setAllowedTypes(STRUCTURE_TYPE_CHILDREN[parent.tipo] || []);
    }
    setIsModalOpen(true);
  };

  const handleDelete = (node: StructureNode) => {
    setNodeToDelete(node);
  };

  const confirmDelete = () => {
    if (!workCenter || !nodeToDelete) return;

    if (
      structureNodeDeletionBlockedByEvaluations(
        getEvaluations(),
        workCenter.id,
        workCenter.estructuraJerarquica || [],
        nodeToDelete.id,
      )
    ) {
      toast.error(
        'No se puede eliminar: hay riesgos en evaluaciones asociados a esta ubicación o a elementos que contiene.',
      );
      setNodeToDelete(null);
      return;
    }

    const updatedTree = deleteNodeFromTree(
      workCenter.estructuraJerarquica || [],
      nodeToDelete.id
    );

    const updatedCenter: WorkCenter = {
      ...workCenter,
      estructuraJerarquica: updatedTree,
    };

    saveWorkCenter(updatedCenter);
    setWorkCenter(updatedCenter);
    setNodeToDelete(null);
    toast.success('Elemento eliminado correctamente');
  };

  const handleSave = (nodeData: Partial<StructureNode>) => {
    if (!workCenter) return;

    if (editingNode) {
      // Actualizar nodo existente
      const updatedNode: StructureNode = {
        ...editingNode,
        ...nodeData,
      };

      const updatedTree = updateNodeInTree(
        workCenter.estructuraJerarquica || [],
        updatedNode
      );

      const updatedCenter: WorkCenter = {
        ...workCenter,
        estructuraJerarquica: updatedTree,
      };

      saveWorkCenter(updatedCenter);
      setWorkCenter(updatedCenter);
      toast.success('Elemento actualizado correctamente');
    } else {
      // Crear nuevo nodo
      const newNode: StructureNode = {
        id: crypto.randomUUID(),
        workCenterId: workCenter.id,
        tipo: nodeData.tipo!,
        nombre: nodeData.nombre!,
        descripcion: nodeData.descripcion || '',
        superficie: nodeData.superficie,
        parentId: parentNode?.id,
        children: [],
        riesgosAsignados: [],
        metadata: nodeData.metadata,
      };

      const updatedTree = addNodeToTree(
        workCenter.estructuraJerarquica || [],
        newNode,
        parentNode?.id
      );

      const updatedCenter: WorkCenter = {
        ...workCenter,
        estructuraJerarquica: updatedTree,
      };

      saveWorkCenter(updatedCenter);
      setWorkCenter(updatedCenter);
      toast.success('Elemento agregado correctamente');
    }

    closeStructureModal();
  };

  if (!workCenter) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Centro de trabajo no encontrado</p>
      </div>
    );
  }

  const hierarchicalStructure = workCenter.estructuraJerarquica || [];
  const totalNodes = countAllNodes(hierarchicalStructure);
  const totalArea = calculateTotalArea(hierarchicalStructure);

  return (
    <div className="space-y-6">
      <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
        <Button variant="ghost" size="sm" className="shrink-0" onClick={() => navigate('/centros')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Building className="h-5 w-5 shrink-0 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">{workCenter.nombre}</h2>
          </div>
          <IfInformationUI>
            <p className="text-gray-600">Estructura jerárquica del centro de trabajo</p>
          </IfInformationUI>
        </div>
      </div>

      {/* Información */}
      <IfInformationUI>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="text-sm text-blue-900">
                <p className="mb-1 font-medium">Estructura Jerárquica</p>
                <p>
                  Organiza tu centro de trabajo en una estructura de árbol: Edificios → Plantas →
                  Espacios (Despachos, Talleres, etc.) → Puestos de Trabajo. Los riesgos se asignarán
                  desde el módulo de Evaluaciones.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </IfInformationUI>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{totalNodes}</div>
              <div className="text-sm text-gray-600 mt-1">Elementos Totales</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {totalArea.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">m² Totales</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Árbol de estructura */}
      <Card>
        <CardHeader>
          <CardTitle>Estructura del Centro</CardTitle>
        </CardHeader>
        <CardContent>
          <HierarchicalStructureTree
            nodes={hierarchicalStructure}
            onAddChild={handleAddChild}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleteBlocked={(node) =>
              structureNodeDeletionBlockedByEvaluations(
                getEvaluations(),
                workCenter.id,
                hierarchicalStructure,
                node.id,
              )
            }
          />
        </CardContent>
      </Card>

      {/* Modal de agregar/editar */}
      <StructureNodeModal
        isOpen={isModalOpen}
        onClose={closeStructureModal}
        onSave={handleSave}
        parentNode={parentNode}
        editingNode={editingNode}
        workCenterId={workCenter.id}
        allowedTypes={allowedTypes}
      />

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={!!nodeToDelete} onOpenChange={() => setNodeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              ¿Eliminar elemento?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará <strong>{nodeToDelete?.nombre}</strong> y todos sus
              elementos hijos de forma permanente. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
