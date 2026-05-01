export type RiskLevel = 'trivial' | 'tolerable' | 'moderado' | 'importante' | 'intolerable';

export type RiskCategory = 
  | 'seguridad'
  | 'ergonomico'
  | 'quimico'
  | 'biologico'
  | 'fisico'
  | 'psicosocial';

export type UserRole = 'administrador' | 'administrativo' | 'tecnico';

export interface User {
  id: string;
  username: string;
  password: string; // En producción usar hash
  nombre: string;
  email: string;
  role: UserRole;
  isBlocked: boolean;
  failedAttempts: number;
  createdAt: string;
  lastLogin?: string;
}

// Tipos de nodos en la jerarquía
export type StructureNodeType =
  | 'edificio'
  | 'planta'
  | 'elemento_comunicacion_vertical' // Escaleras, ascensores
  | 'elemento_comunicacion_horizontal' // Pasillos, halls
  | 'despacho'
  | 'almacen'
  | 'aseo'
  | 'vestuario'
  | 'taller'
  | 'sala_reuniones'
  | 'puesto_trabajo'
  | 'estacion_trabajo'
  | 'generico'; // Para elementos especiales como jardines, pabellones deportivos, etc.

// Nodo de estructura jerárquica
export interface StructureNode {
  id: string;
  workCenterId: string;
  tipo: StructureNodeType;
  nombre: string;
  descripcion: string;
  superficie?: number;
  parentId?: string; // ID del nodo padre (null para nivel raíz - edificios)
  children: StructureNode[]; // Nodos hijos
  riesgosAsignados: string[]; // IDs de riesgos (solo desde Evaluaciones)
  // Metadatos opcionales según tipo
  metadata?: {
    capacidad?: number; // Para despachos, salas
    tipoElemento?: string; // Para elementos genéricos
    numeroPlanta?: number; // Para plantas
  };
}

// Mantener WorkplaceStructure para compatibilidad temporal
export interface WorkplaceStructure {
  id: string;
  workCenterId: string;
  tipo: 'planta' | 'despacho' | 'almacen' | 'taller' | 'sala' | 'zona_comun' | 'otro';
  nombre: string;
  descripcion: string;
  superficie?: number;
  riesgosAsignados: string[]; // IDs de riesgos
}

export interface Activity {
  id: string;
  nombre: string;
  descripcion: string;
  riesgosAsignados: string[]; // IDs de riesgos
}

export interface EPI {
  id: string;
  tipo: string;
  descripcion: string;
  normativa?: string;
}

// Categoría de puesto global (compartida entre centros)
export interface JobPositionCategory {
  id: string;
  nombre: string;
  descripcion: string;
  actividades: Activity[];
  riesgosGenericos: Risk[]; // Riesgos inherentes a la categoría
  episGenericos: EPI[]; // EPIs estándar para esta categoría
  createdAt: string;
}

// Instancia de puesto específica de un centro de trabajo
export interface JobPositionInstance {
  id: string;
  workCenterId: string;
  categoryId: string; // Referencia a JobPositionCategory
  categoryName: string;
  numeroEmpleados: number;
  riesgosEspecificos: Risk[]; // Riesgos adicionales específicos del centro
  episEspecificos: EPI[]; // EPIs adicionales específicos del centro
  actividadesPersonalizadas: Activity[]; // Actividades adicionales o modificadas
  observaciones: string;
}

export interface WorkCenter {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  responsable: string;
  telefono: string;
  email: string;
  numeroEmpleados: number;
  fechaCreacion: string;
  estructura: WorkplaceStructure[]; // Estructura plana antigua (compatibilidad)
  estructuraJerarquica: StructureNode[]; // Nueva estructura jerárquica (árbol de edificios)
  puestosTrabajo: JobPositionInstance[]; // Cambiado a instancias
}

export interface Risk {
  id: string;
  categoria: RiskCategory;
  descripcion: string;
  nivel: RiskLevel;
  medidasControl: string;
  probabilidad: number; // 1-3 (Baja, Media, Alta)
  consecuencias: number; // 1-3 (Ligeramente dañino, Dañino, Extremadamente dañino)
}

// Asociación de riesgo con ubicación de la estructura
export interface StructureRiskAssignment {
  structureNodeId: string;
  structureNodeName: string;
  structureNodePath: string; // Ruta legible: "Edificio A > Planta 1 > Despacho 101"
  risk: Risk;
}

// Asociación de riesgo con puesto de trabajo
export interface JobPositionRiskAssignment {
  jobPositionId: string; // ID de JobPositionInstance
  jobPositionName: string;
  risk: Risk;
  isGeneric: boolean; // true si viene de la categoría, false si es específico del centro
}

export interface RiskEvaluation {
  id: string;
  workCenterId: string;
  workCenterName: string;
  fecha: string;
  evaluador: string;
  cargo: string;
  riesgos: Risk[]; // Riesgos generales (mantener compatibilidad)
  riesgosEstructura: StructureRiskAssignment[]; // Riesgos asociados a lugares
  riesgosPuestos: JobPositionRiskAssignment[]; // Riesgos asociados a puestos
  observaciones: string;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'revision';
}