import { StructureNode } from '../types';

// Función recursiva para encontrar un nodo en el árbol
export function findNodeById(
  nodes: StructureNode[],
  nodeId: string
): StructureNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
}

// Función para agregar un nodo hijo
export function addNodeToTree(
  nodes: StructureNode[],
  newNode: StructureNode,
  parentId: string | null | undefined
): StructureNode[] {
  if (!parentId) {
    // Agregar al nivel raíz
    return [...nodes, newNode];
  }

  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children || []), newNode],
      };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: addNodeToTree(node.children, newNode, parentId),
      };
    }
    return node;
  });
}

// Función para actualizar un nodo en el árbol
export function updateNodeInTree(
  nodes: StructureNode[],
  updatedNode: StructureNode
): StructureNode[] {
  return nodes.map((node) => {
    if (node.id === updatedNode.id) {
      return {
        ...updatedNode,
        children: node.children, // Mantener los hijos existentes
      };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: updateNodeInTree(node.children, updatedNode),
      };
    }
    return node;
  });
}

// Función para eliminar un nodo del árbol (incluyendo sus hijos)
export function deleteNodeFromTree(
  nodes: StructureNode[],
  nodeId: string
): StructureNode[] {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({
      ...node,
      children: node.children ? deleteNodeFromTree(node.children, nodeId) : [],
    }));
}

// Función para contar todos los nodos (incluyendo hijos)
export function countAllNodes(nodes: StructureNode[]): number {
  return nodes.reduce((count, node) => {
    return count + 1 + (node.children ? countAllNodes(node.children) : 0);
  }, 0);
}

// Función para contar riesgos totales (incluyendo hijos)
export function countAllRisks(nodes: StructureNode[]): number {
  return nodes.reduce((count, node) => {
    const nodeRisks = node.riesgosAsignados?.length || 0;
    const childRisks = node.children ? countAllRisks(node.children) : 0;
    return count + nodeRisks + childRisks;
  }, 0);
}

// Función para calcular superficie total (incluyendo hijos)
export function calculateTotalArea(nodes: StructureNode[]): number {
  return nodes.reduce((total, node) => {
    const nodeArea = node.superficie || 0;
    const childArea = node.children ? calculateTotalArea(node.children) : 0;
    return total + nodeArea + childArea;
  }, 0);
}

// Función para aplanar el árbol en una lista
export function flattenTree(nodes: StructureNode[]): StructureNode[] {
  const result: StructureNode[] = [];

  function traverse(node: StructureNode) {
    result.push(node);
    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return result;
}

// Función para obtener la ruta de un nodo (breadcrumb)
export function getNodePath(
  nodes: StructureNode[],
  nodeId: string,
  currentPath: StructureNode[] = []
): StructureNode[] | null {
  for (const node of nodes) {
    const path = [...currentPath, node];

    if (node.id === nodeId) {
      return path;
    }

    if (node.children && node.children.length > 0) {
      const found = getNodePath(node.children, nodeId, path);
      if (found) return found;
    }
  }

  return null;
}
