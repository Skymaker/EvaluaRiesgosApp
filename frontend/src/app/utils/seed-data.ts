import { JobPositionCategory, WorkCenter, RiskEvaluation, StructureNode, Risk, RiskLevel, RiskCategory } from '../types';
import { apiRequest } from './api-client';

// Función auxiliar para generar IDs únicos
const generateId = () => crypto.randomUUID();

// Función para calcular nivel de riesgo (matriz 3x3)
const calculateRiskLevel = (probabilidad: number, consecuencias: number): RiskLevel => {
  if (probabilidad === 1 && consecuencias === 1) return 'trivial';
  if (probabilidad === 1 && consecuencias === 2) return 'tolerable';
  if (probabilidad === 1 && consecuencias === 3) return 'moderado';

  if (probabilidad === 2 && consecuencias === 1) return 'tolerable';
  if (probabilidad === 2 && consecuencias === 2) return 'moderado';
  if (probabilidad === 2 && consecuencias === 3) return 'importante';

  if (probabilidad === 3 && consecuencias === 1) return 'moderado';
  if (probabilidad === 3 && consecuencias === 2) return 'importante';
  if (probabilidad === 3 && consecuencias === 3) return 'intolerable';

  return 'moderado';
};

// 10 Categorías de Puestos de Trabajo
export const jobPositionCategories: JobPositionCategory[] = [
  {
    id: generateId(),
    nombre: 'Operario de Producción',
    descripcion: 'Responsable de la operación de maquinaria y procesos de producción',
    actividades: [
      { id: generateId(), nombre: 'Operación de maquinaria', descripcion: 'Manejo de equipos de producción', riesgosAsignados: [] },
      { id: generateId(), nombre: 'Control de calidad', descripcion: 'Verificación de productos', riesgosAsignados: [] },
    ],
    riesgosGenericos: [
      { id: generateId(), categoria: 'seguridad', descripcion: 'Atrapamiento por partes móviles de maquinaria', nivel: 'importante', probabilidad: 1, consecuencias: 2, medidasControl: 'Resguardos en máquinas, formación específica' },
      { id: generateId(), categoria: 'ergonomico', descripcion: 'Posturas forzadas durante operaciones', nivel: 'moderado', probabilidad: 1, consecuencias: 1, medidasControl: 'Rotación de tareas, pausas programadas' },
      { id: generateId(), categoria: 'fisico', descripcion: 'Exposición a ruido de maquinaria', nivel: 'moderado', probabilidad: 2, consecuencias: 1, medidasControl: 'Protección auditiva obligatoria' },
      { id: generateId(), categoria: 'psicosocial', descripcion: 'Monotonía en tareas repetitivas', nivel: 'tolerable', probabilidad: 1, consecuencias: 1, medidasControl: 'Rotación de puestos, pausas' },
    ],
    episGenericos: [
      { id: generateId(), tipo: 'Guantes de protección mecánica', descripcion: 'Cat. II nivel 3', normativa: 'EN 388' },
      { id: generateId(), tipo: 'Calzado de seguridad', descripcion: 'Con puntera reforzada', normativa: 'EN ISO 20345' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    nombre: 'Técnico de Mantenimiento',
    descripcion: 'Encargado del mantenimiento preventivo y correctivo de instalaciones',
    actividades: [
      { id: generateId(), nombre: 'Mantenimiento preventivo', descripcion: 'Revisiones periódicas programadas', riesgosAsignados: [] },
      { id: generateId(), nombre: 'Reparaciones', descripcion: 'Solución de averías', riesgosAsignados: [] },
    ],
    riesgosGenericos: [
      { id: generateId(), categoria: 'seguridad', descripcion: 'Contacto eléctrico directo o indirecto', nivel: 'intolerable', probabilidad: 1, consecuencias: 3, medidasControl: 'Bloqueo/etiquetado, uso de EPIs dieléctricos' },
      { id: generateId(), categoria: 'seguridad', descripcion: 'Caídas desde altura en trabajos en cubiertas', nivel: 'importante', probabilidad: 1, consecuencias: 2, medidasControl: 'Arnés anticaídas, líneas de vida' },
      { id: generateId(), categoria: 'fisico', descripcion: 'Exposición a temperaturas extremas', nivel: 'moderado', probabilidad: 1, consecuencias: 1, medidasControl: 'Ropa térmica adecuada' },
      { id: generateId(), categoria: 'ergonomico', descripcion: 'Manipulación manual de cargas pesadas', nivel: 'moderado', probabilidad: 1, consecuencias: 1, medidasControl: 'Ayudas mecánicas, técnicas de levantamiento' },
    ],
    episGenericos: [
      { id: generateId(), tipo: 'Guantes dieléctricos', descripcion: 'Clase 00', normativa: 'EN 60903' },
      { id: generateId(), tipo: 'Arnés anticaídas', descripcion: 'Punto de anclaje dorsal', normativa: 'EN 361' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    nombre: 'Administrativo de Oficina',
    descripcion: 'Gestión administrativa y tareas de oficina',
    actividades: [
      { id: generateId(), nombre: 'Gestión documental', descripcion: 'Archivo y clasificación de documentos', riesgosAsignados: [] },
      { id: generateId(), nombre: 'Atención telefónica', descripcion: 'Gestión de llamadas y consultas', riesgosAsignados: [] },
    ],
    riesgosGenericos: [
      { id: generateId(), categoria: 'ergonomico', descripcion: 'Trastornos musculoesqueléticos por uso de PVD', nivel: 'moderado', probabilidad: 2, consecuencias: 1, medidasControl: 'Mobiliario ergonómico, pausas cada hora' },
      { id: generateId(), categoria: 'fisico', descripcion: 'Fatiga visual por uso prolongado de pantallas', nivel: 'tolerable', probabilidad: 3, consecuencias: 1, medidasControl: 'Iluminación adecuada, descansos visuales' },
      { id: generateId(), categoria: 'psicosocial', descripcion: 'Estrés por carga de trabajo', nivel: 'tolerable', probabilidad: 2, consecuencias: 1, medidasControl: 'Organización de tareas, pausas' },
      { id: generateId(), categoria: 'seguridad', descripcion: 'Caídas al mismo nivel por cables', nivel: 'trivial', probabilidad: 1, consecuencias: 1, medidasControl: 'Orden y limpieza, canaletas para cables' },
    ],
    episGenericos: [
      { id: generateId(), tipo: 'Reposapiés', descripcion: 'Ajustable en altura', normativa: '' },
      { id: generateId(), tipo: 'Soporte para documentos', descripcion: 'Regulable', normativa: '' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    nombre: 'Almacenero',
    descripcion: 'Gestión y control de almacenes y mercancías',
    actividades: [
      { id: generateId(), nombre: 'Recepción de mercancías', descripcion: 'Control de entrada de productos', riesgosAsignados: [] },
      { id: generateId(), nombre: 'Preparación de pedidos', descripcion: 'Picking y empaquetado', riesgosAsignados: [] },
    ],
    riesgosGenericos: [
      { id: generateId(), categoria: 'seguridad', descripcion: 'Atropello por carretillas elevadoras', nivel: 'importante', probabilidad: 1, consecuencias: 2, medidasControl: 'Señalización, pasos peatonales, formación' },
      { id: generateId(), categoria: 'seguridad', descripcion: 'Caída de objetos desde estanterías', nivel: 'importante', probabilidad: 1, consecuencias: 3, medidasControl: 'Revisión de estanterías, señalización de cargas' },
      { id: generateId(), categoria: 'ergonomico', descripcion: 'Sobreesfuerzo en manipulación de cargas', nivel: 'moderado', probabilidad: 2, consecuencias: 1, medidasControl: 'Ayudas mecánicas, formación en MMC' },
      { id: generateId(), categoria: 'fisico', descripcion: 'Exposición a temperaturas bajas en cámaras', nivel: 'moderado', probabilidad: 1, consecuencias: 1, medidasControl: 'Ropa de abrigo, limitación de tiempo de exposición' },
    ],
    episGenericos: [
      { id: generateId(), tipo: 'Chaleco alta visibilidad', descripcion: 'Clase 2', normativa: 'EN 471' },
      { id: generateId(), tipo: 'Faja lumbar', descripcion: 'Con tirantes', normativa: '' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    nombre: 'Conductor de Reparto',
    descripcion: 'Transporte y entrega de mercancías',
    actividades: [
      { id: generateId(), nombre: 'Conducción de vehículos', descripcion: 'Transporte de mercancías', riesgosAsignados: [] },
      { id: generateId(), nombre: 'Carga y descarga', descripcion: 'Manipulación de paquetes', riesgosAsignados: [] },
    ],
    riesgosGenericos: [
      { id: generateId(), categoria: 'seguridad', descripcion: 'Accidente de tráfico in itinere o in misión', nivel: 'importante', probabilidad: 1, consecuencias: 2, medidasControl: 'Mantenimiento del vehículo, formación en conducción defensiva' },
      { id: generateId(), categoria: 'ergonomico', descripcion: 'Lesiones lumbares por manipulación de cargas', nivel: 'moderado', probabilidad: 1, consecuencias: 1, medidasControl: 'Carros auxiliares, técnicas de levantamiento' },
      { id: generateId(), categoria: 'psicosocial', descripcion: 'Estrés por cumplimiento de plazos', nivel: 'tolerable', probabilidad: 1, consecuencias: 1, medidasControl: 'Planificación de rutas, pausas programadas' },
      { id: generateId(), categoria: 'fisico', descripcion: 'Exposición a vibraciones del vehículo', nivel: 'tolerable', probabilidad: 3, consecuencias: 1, medidasControl: 'Asientos con suspensión, mantenimiento' },
    ],
    episGenericos: [
      { id: generateId(), tipo: 'Calzado de seguridad', descripcion: 'Con suela antideslizante', normativa: 'EN ISO 20345' },
      { id: generateId(), tipo: 'Guantes de protección', descripcion: 'Para manipulación', normativa: 'EN 388' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    nombre: 'Laboratorista Químico',
    descripcion: 'Análisis y control de calidad en laboratorio',
    actividades: [
      { id: generateId(), nombre: 'Análisis químicos', descripcion: 'Pruebas de control de calidad', riesgosAsignados: [] },
      { id: generateId(), nombre: 'Preparación de muestras', descripcion: 'Manejo de reactivos', riesgosAsignados: [] },
    ],
    riesgosGenericos: [
      { id: generateId(), categoria: 'quimico', descripcion: 'Exposición a sustancias químicas peligrosas', nivel: 'importante', probabilidad: 1, consecuencias: 2, medidasControl: 'Extracción localizada, EPIs adecuados, fichas de seguridad' },
      { id: generateId(), categoria: 'seguridad', descripcion: 'Contacto con productos corrosivos', nivel: 'importante', probabilidad: 1, consecuencias: 2, medidasControl: 'Gafas de seguridad, guantes químicos, ducha de emergencia' },
      { id: generateId(), categoria: 'biologico', descripcion: 'Exposición a agentes biológicos en muestras', nivel: 'moderado', probabilidad: 1, consecuencias: 1, medidasControl: 'Cabina de seguridad biológica, guantes' },
      { id: generateId(), categoria: 'fisico', descripcion: 'Cortes con material de vidrio', nivel: 'tolerable', probabilidad: 2, consecuencias: 1, medidasControl: 'Guantes anticorte, procedimientos seguros' },
    ],
    episGenericos: [
      { id: generateId(), tipo: 'Gafas de seguridad química', descripcion: 'Con protección lateral', normativa: 'EN 166' },
      { id: generateId(), tipo: 'Bata de laboratorio', descripcion: 'Ignífuga', normativa: 'EN 340' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    nombre: 'Soldador',
    descripcion: 'Trabajos de soldadura y corte de metales',
    actividades: [
      { id: generateId(), nombre: 'Soldadura MIG/MAG', descripcion: 'Soldadura con gas', riesgosAsignados: [] },
      { id: generateId(), nombre: 'Corte con oxicorte', descripcion: 'Corte térmico de metales', riesgosAsignados: [] },
    ],
    riesgosGenericos: [
      { id: generateId(), categoria: 'seguridad', descripcion: 'Quemaduras por proyección de chispas', nivel: 'importante', probabilidad: 1, consecuencias: 2, medidasControl: 'Pantalla de soldadura, ropa ignífuga, delantal de cuero' },
      { id: generateId(), categoria: 'fisico', descripcion: 'Radiaciones ultravioleta e infrarroja', nivel: 'importante', probabilidad: 2, consecuencias: 1, medidasControl: 'Pantalla de soldadura con filtro adecuado' },
      { id: generateId(), categoria: 'quimico', descripcion: 'Inhalación de humos metálicos', nivel: 'moderado', probabilidad: 1, consecuencias: 1, medidasControl: 'Extracción localizada, mascarilla FFP3' },
      { id: generateId(), categoria: 'seguridad', descripcion: 'Contacto eléctrico en soldadura eléctrica', nivel: 'importante', probabilidad: 1, consecuencias: 3, medidasControl: 'Equipos con protección, guantes dieléctricos' },
    ],
    episGenericos: [
      { id: generateId(), tipo: 'Pantalla de soldadura', descripcion: 'Con filtro DIN 11', normativa: 'EN 175' },
      { id: generateId(), tipo: 'Guantes de soldador', descripcion: 'De cuero resistente al calor', normativa: 'EN 12477' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    nombre: 'Limpiador',
    descripcion: 'Servicios de limpieza y mantenimiento de instalaciones',
    actividades: [
      { id: generateId(), nombre: 'Limpieza de superficies', descripcion: 'Barrido, fregado y desinfección', riesgosAsignados: [] },
      { id: generateId(), nombre: 'Gestión de residuos', descripcion: 'Recogida y clasificación', riesgosAsignados: [] },
    ],
    riesgosGenericos: [
      { id: generateId(), categoria: 'quimico', descripcion: 'Contacto dérmico con productos de limpieza', nivel: 'moderado', probabilidad: 2, consecuencias: 1, medidasControl: 'Guantes de protección química, formación' },
      { id: generateId(), categoria: 'seguridad', descripcion: 'Caídas al mismo nivel por suelos mojados', nivel: 'moderado', probabilidad: 1, consecuencias: 1, medidasControl: 'Señalización de suelo mojado, calzado antideslizante' },
      { id: generateId(), categoria: 'ergonomico', descripcion: 'Posturas forzadas y movimientos repetitivos', nivel: 'moderado', probabilidad: 2, consecuencias: 1, medidasControl: 'Rotación de tareas, herramientas ergonómicas' },
      { id: generateId(), categoria: 'biologico', descripcion: 'Exposición a residuos biológicos', nivel: 'tolerable', probabilidad: 2, consecuencias: 1, medidasControl: 'Guantes desechables, higiene de manos' },
    ],
    episGenericos: [
      { id: generateId(), tipo: 'Guantes de protección química', descripcion: 'Nitrilo o látex', normativa: 'EN 374' },
      { id: generateId(), tipo: 'Calzado antideslizante', descripcion: 'Con suela SRC', normativa: 'EN ISO 20347' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    nombre: 'Operador de Carretilla Elevadora',
    descripcion: 'Manejo de carretillas elevadoras y transpaletas',
    actividades: [
      { id: generateId(), nombre: 'Transporte de mercancías', descripcion: 'Movimiento interno de materiales', riesgosAsignados: [] },
      { id: generateId(), nombre: 'Carga y descarga', descripcion: 'Apilado en estanterías', riesgosAsignados: [] },
    ],
    riesgosGenericos: [
      { id: generateId(), categoria: 'seguridad', descripcion: 'Vuelco de la carretilla por sobrecarga', nivel: 'intolerable', probabilidad: 1, consecuencias: 3, medidasControl: 'Respetar carga máxima, inspecciones periódicas' },
      { id: generateId(), categoria: 'seguridad', descripcion: 'Atropello de personas en maniobras', nivel: 'importante', probabilidad: 1, consecuencias: 2, medidasControl: 'Señalización acústica, espejos, pasos peatonales' },
      { id: generateId(), categoria: 'seguridad', descripcion: 'Caída de carga transportada', nivel: 'importante', probabilidad: 1, consecuencias: 2, medidasControl: 'Correcta sujeción de cargas, velocidad adecuada' },
      { id: generateId(), categoria: 'fisico', descripcion: 'Exposición a vibraciones', nivel: 'tolerable', probabilidad: 3, consecuencias: 1, medidasControl: 'Asiento con suspensión, mantenimiento' },
    ],
    episGenericos: [
      { id: generateId(), tipo: 'Chaleco reflectante', descripcion: 'Alta visibilidad', normativa: 'EN 471' },
      { id: generateId(), tipo: 'Calzado de seguridad', descripcion: 'Con puntera', normativa: 'EN ISO 20345' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    nombre: 'Recepcionista',
    descripcion: 'Atención al público y gestión de entrada',
    actividades: [
      { id: generateId(), nombre: 'Atención al público', descripcion: 'Información y registro de visitantes', riesgosAsignados: [] },
      { id: generateId(), nombre: 'Gestión telefónica', descripcion: 'Centralita y derivación de llamadas', riesgosAsignados: [] },
    ],
    riesgosGenericos: [
      { id: generateId(), categoria: 'psicosocial', descripcion: 'Estrés por trato con público', nivel: 'tolerable', probabilidad: 1, consecuencias: 1, medidasControl: 'Protocolos de atención, formación en gestión de conflictos' },
      { id: generateId(), categoria: 'ergonomico', descripcion: 'Bipedestación prolongada', nivel: 'tolerable', probabilidad: 3, consecuencias: 1, medidasControl: 'Asiento alto regulable, alfombrilla antifatiga' },
      { id: generateId(), categoria: 'seguridad', descripcion: 'Agresiones verbales o físicas', nivel: 'tolerable', probabilidad: 1, consecuencias: 2, medidasControl: 'Botón de alarma, protocolo de emergencia' },
      { id: generateId(), categoria: 'fisico', descripcion: 'Fatiga visual por uso de pantallas', nivel: 'trivial', probabilidad: 2, consecuencias: 1, medidasControl: 'Iluminación adecuada, pausas visuales' },
    ],
    episGenericos: [
      { id: generateId(), tipo: 'Reposapiés', descripcion: 'Ajustable', normativa: '' },
      { id: generateId(), tipo: 'Filtro de pantalla', descripcion: 'Anti-reflejo', normativa: '' },
    ],
    createdAt: new Date().toISOString(),
  },
];

// Función para crear estructura jerárquica de un edificio
const createBuildingStructure = (buildingName: string, workCenterId: string): StructureNode => {
  const buildingId = generateId();
  const floors: StructureNode[] = [];

  for (let floor = 0; floor <= 5; floor++) {
    const floorId = generateId();
    const locations: StructureNode[] = [];

    // Diferentes configuraciones por planta
    if (floor === 0) {
      // Planta baja: recepción, almacén, vestuarios
      locations.push(
        { id: generateId(), workCenterId, tipo: 'despacho', nombre: 'Recepción', descripcion: 'Área de recepción y control de acceso', superficie: 25, parentId: floorId, children: [], riesgosAsignados: [] },
        { id: generateId(), workCenterId, tipo: 'almacen', nombre: 'Almacén Principal', descripcion: 'Almacenamiento de materiales', superficie: 200, parentId: floorId, children: [], riesgosAsignados: [] },
        { id: generateId(), workCenterId, tipo: 'vestuario', nombre: 'Vestuario Hombres', descripcion: 'Vestuario y duchas', superficie: 30, parentId: floorId, children: [], riesgosAsignados: [] },
        { id: generateId(), workCenterId, tipo: 'vestuario', nombre: 'Vestuario Mujeres', descripcion: 'Vestuario y duchas', superficie: 30, parentId: floorId, children: [], riesgosAsignados: [] },
        { id: generateId(), workCenterId, tipo: 'elemento_comunicacion_vertical', nombre: 'Escalera Principal', descripcion: 'Escalera de acceso a plantas superiores', parentId: floorId, children: [], riesgosAsignados: [] },
      );
    } else if (floor === 1) {
      // Planta 1: oficinas y sala de reuniones
      locations.push(
        { id: generateId(), workCenterId, tipo: 'despacho', nombre: `Despacho ${floor}01`, descripcion: 'Despacho dirección', superficie: 20, parentId: floorId, children: [], riesgosAsignados: [] },
        { id: generateId(), workCenterId, tipo: 'despacho', nombre: `Despacho ${floor}02`, descripcion: 'Despacho administración', superficie: 15, parentId: floorId, children: [], riesgosAsignados: [] },
        { id: generateId(), workCenterId, tipo: 'despacho', nombre: `Despacho ${floor}03`, descripcion: 'Oficina técnica', superficie: 40, parentId: floorId, children: [], riesgosAsignados: [] },
        { id: generateId(), workCenterId, tipo: 'sala_reuniones', nombre: `Sala de Reuniones ${floor}`, descripcion: 'Sala de juntas', superficie: 30, parentId: floorId, children: [], riesgosAsignados: [], metadata: { capacidad: 12 } },
        { id: generateId(), workCenterId, tipo: 'aseo', nombre: `Aseos Planta ${floor}`, descripcion: 'Servicios', superficie: 15, parentId: floorId, children: [], riesgosAsignados: [] },
      );
    } else if (floor === 2) {
      // Planta 2: taller y laboratorio
      locations.push(
        { id: generateId(), workCenterId, tipo: 'taller', nombre: 'Taller Mecánico', descripcion: 'Zona de mantenimiento y reparaciones', superficie: 100, parentId: floorId, children: [], riesgosAsignados: [] },
        { id: generateId(), workCenterId, tipo: 'despacho', nombre: 'Laboratorio Calidad', descripcion: 'Análisis y control de calidad', superficie: 60, parentId: floorId, children: [], riesgosAsignados: [] },
        { id: generateId(), workCenterId, tipo: 'almacen', nombre: 'Almacén Herramientas', descripcion: 'Almacenamiento de herramientas', superficie: 40, parentId: floorId, children: [], riesgosAsignados: [] },
        { id: generateId(), workCenterId, tipo: 'aseo', nombre: `Aseos Planta ${floor}`, descripcion: 'Servicios', superficie: 15, parentId: floorId, children: [], riesgosAsignados: [] },
      );
    } else {
      // Plantas 3-5: oficinas abiertas y despachos
      locations.push(
        { id: generateId(), workCenterId, tipo: 'despacho', nombre: `Oficina Diáfana ${floor}`, descripcion: 'Espacio de trabajo abierto', superficie: 120, parentId: floorId, children: [], riesgosAsignados: [] },
        { id: generateId(), workCenterId, tipo: 'despacho', nombre: `Despacho ${floor}01`, descripcion: 'Despacho individual', superficie: 12, parentId: floorId, children: [], riesgosAsignados: [] },
        { id: generateId(), workCenterId, tipo: 'despacho', nombre: `Despacho ${floor}02`, descripcion: 'Despacho individual', superficie: 12, parentId: floorId, children: [], riesgosAsignados: [] },
        { id: generateId(), workCenterId, tipo: 'sala_reuniones', nombre: `Sala Reuniones ${floor}`, descripcion: 'Sala de reuniones', superficie: 20, parentId: floorId, children: [], riesgosAsignados: [], metadata: { capacidad: 8 } },
        { id: generateId(), workCenterId, tipo: 'aseo', nombre: `Aseos Planta ${floor}`, descripcion: 'Servicios', superficie: 15, parentId: floorId, children: [], riesgosAsignados: [] },
      );
    }

    floors.push({
      id: floorId,
      workCenterId,
      tipo: 'planta',
      nombre: floor === 0 ? 'Planta Baja' : `Planta ${floor}`,
      descripcion: `Nivel ${floor} del edificio`,
      parentId: buildingId,
      children: locations,
      riesgosAsignados: [],
      metadata: { numeroPlanta: floor },
    });
  }

  return {
    id: buildingId,
    workCenterId,
    tipo: 'edificio',
    nombre: buildingName,
    descripcion: 'Edificio principal',
    parentId: undefined,
    children: floors,
    riesgosAsignados: [],
  };
};

// 3 Centros de Trabajo
export const workCenters: WorkCenter[] = [
  {
    id: generateId(),
    nombre: 'Planta Industrial Norte',
    direccion: 'Polígono Industrial Las Américas, Calle 42, Nave 15',
    ciudad: 'Madrid',
    responsable: 'Carlos Méndez García',
    telefono: '+34 91 234 5678',
    email: 'carlos.mendez@empresa.com',
    numeroEmpleados: 85,
    fechaCreacion: new Date('2023-01-15').toISOString(),
    estructura: [],
    estructuraJerarquica: [],
    puestosTrabajo: [],
  },
  {
    id: generateId(),
    nombre: 'Centro Logístico Valencia',
    direccion: 'Zona Franca, Sector 7, Parcela 23',
    ciudad: 'Valencia',
    responsable: 'Laura Fernández Ruiz',
    telefono: '+34 96 345 6789',
    email: 'laura.fernandez@empresa.com',
    numeroEmpleados: 62,
    fechaCreacion: new Date('2023-03-20').toISOString(),
    estructura: [],
    estructuraJerarquica: [],
    puestosTrabajo: [],
  },
  {
    id: generateId(),
    nombre: 'Oficinas Centrales Barcelona',
    direccion: 'Avenida Diagonal, 525, Edificio Torre Norte',
    ciudad: 'Barcelona',
    responsable: 'Miguel Ángel Torres Sánchez',
    telefono: '+34 93 456 7890',
    email: 'miguel.torres@empresa.com',
    numeroEmpleados: 120,
    fechaCreacion: new Date('2022-11-10').toISOString(),
    estructura: [],
    estructuraJerarquica: [],
    puestosTrabajo: [],
  },
];

// Completar centros con estructura y puestos
workCenters[0].estructuraJerarquica = [createBuildingStructure('Edificio Producción', workCenters[0].id)];
workCenters[0].puestosTrabajo = [
  { id: generateId(), workCenterId: workCenters[0].id, categoryId: jobPositionCategories[0].id, categoryName: jobPositionCategories[0].nombre, numeroEmpleados: 25, riesgosEspecificos: [], episEspecificos: [], actividadesPersonalizadas: [], observaciones: '' },
  { id: generateId(), workCenterId: workCenters[0].id, categoryId: jobPositionCategories[1].id, categoryName: jobPositionCategories[1].nombre, numeroEmpleados: 8, riesgosEspecificos: [], episEspecificos: [], actividadesPersonalizadas: [], observaciones: '' },
  { id: generateId(), workCenterId: workCenters[0].id, categoryId: jobPositionCategories[3].id, categoryName: jobPositionCategories[3].nombre, numeroEmpleados: 15, riesgosEspecificos: [], episEspecificos: [], actividadesPersonalizadas: [], observaciones: '' },
  { id: generateId(), workCenterId: workCenters[0].id, categoryId: jobPositionCategories[6].id, categoryName: jobPositionCategories[6].nombre, numeroEmpleados: 12, riesgosEspecificos: [], episEspecificos: [], actividadesPersonalizadas: [], observaciones: '' },
];

workCenters[1].estructuraJerarquica = [createBuildingStructure('Edificio Logística', workCenters[1].id)];
workCenters[1].puestosTrabajo = [
  { id: generateId(), workCenterId: workCenters[1].id, categoryId: jobPositionCategories[3].id, categoryName: jobPositionCategories[3].nombre, numeroEmpleados: 30, riesgosEspecificos: [], episEspecificos: [], actividadesPersonalizadas: [], observaciones: '' },
  { id: generateId(), workCenterId: workCenters[1].id, categoryId: jobPositionCategories[4].id, categoryName: jobPositionCategories[4].nombre, numeroEmpleados: 18, riesgosEspecificos: [], episEspecificos: [], actividadesPersonalizadas: [], observaciones: '' },
  { id: generateId(), workCenterId: workCenters[1].id, categoryId: jobPositionCategories[8].id, categoryName: jobPositionCategories[8].nombre, numeroEmpleados: 10, riesgosEspecificos: [], episEspecificos: [], actividadesPersonalizadas: [], observaciones: '' },
];

workCenters[2].estructuraJerarquica = [createBuildingStructure('Torre Corporativa', workCenters[2].id)];
workCenters[2].puestosTrabajo = [
  { id: generateId(), workCenterId: workCenters[2].id, categoryId: jobPositionCategories[2].id, categoryName: jobPositionCategories[2].nombre, numeroEmpleados: 80, riesgosEspecificos: [], episEspecificos: [], actividadesPersonalizadas: [], observaciones: '' },
  { id: generateId(), workCenterId: workCenters[2].id, categoryId: jobPositionCategories[9].id, categoryName: jobPositionCategories[9].nombre, numeroEmpleados: 3, riesgosEspecificos: [], episEspecificos: [], actividadesPersonalizadas: [], observaciones: '' },
  { id: generateId(), workCenterId: workCenters[2].id, categoryId: jobPositionCategories[7].id, categoryName: jobPositionCategories[7].nombre, numeroEmpleados: 5, riesgosEspecificos: [], episEspecificos: [], actividadesPersonalizadas: [], observaciones: '' },
];

// Función auxiliar para obtener nodos de estructura
const getAllStructureNodes = (nodes: StructureNode[]): StructureNode[] => {
  let allNodes: StructureNode[] = [];
  nodes.forEach(node => {
    allNodes.push(node);
    if (node.children && node.children.length > 0) {
      allNodes = allNodes.concat(getAllStructureNodes(node.children));
    }
  });
  return allNodes;
};

// Función auxiliar para obtener ruta de nodo
const getNodePath = (nodes: StructureNode[], nodeId: string, path: string[] = []): string => {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return [...path, node.nombre].join(' > ');
    }
    if (node.children && node.children.length > 0) {
      const result = getNodePath(node.children, nodeId, [...path, node.nombre]);
      if (result) return result;
    }
  }
  return '';
};

// Función para crear riesgo aleatorio
const createRandomRisk = (categories: RiskCategory[] = ['seguridad', 'ergonomico', 'quimico', 'biologico', 'fisico', 'psicosocial']): Risk => {
  const categoria = categories[Math.floor(Math.random() * categories.length)];
  const probabilidad = Math.floor(Math.random() * 3) + 1;
  const consecuencias = Math.floor(Math.random() * 3) + 1;
  const nivel = calculateRiskLevel(probabilidad, consecuencias);

  const descripciones: Record<RiskCategory, string[]> = {
    seguridad: [
      'Riesgo de caída desde altura',
      'Atrapamiento por maquinaria',
      'Contacto eléctrico',
      'Incendio por sobrecarga eléctrica',
      'Caída de objetos en altura'
    ],
    ergonomico: [
      'Posturas forzadas prolongadas',
      'Movimientos repetitivos',
      'Manipulación manual de cargas',
      'Esfuerzo físico excesivo',
      'Iluminación inadecuada'
    ],
    quimico: [
      'Exposición a productos de limpieza',
      'Inhalación de vapores químicos',
      'Contacto con sustancias corrosivas',
      'Derrame de productos químicos',
      'Almacenamiento inadecuado de químicos'
    ],
    biologico: [
      'Exposición a agentes biológicos',
      'Contacto con residuos sanitarios',
      'Proliferación de microorganismos',
      'Falta de higiene en áreas comunes',
      'Contaminación cruzada'
    ],
    fisico: [
      'Ruido ambiental elevado',
      'Temperaturas extremas',
      'Vibraciones de equipos',
      'Radiación no ionizante',
      'Iluminación deficiente'
    ],
    psicosocial: [
      'Carga mental elevada',
      'Estrés laboral',
      'Monotonía en tareas',
      'Falta de comunicación',
      'Conflictos interpersonales'
    ],
  };

  const medidas: Record<RiskCategory, string[]> = {
    seguridad: [
      'Uso de arnés anticaídas y líneas de vida',
      'Resguardos de protección en maquinaria',
      'Revisión periódica de instalaciones eléctricas',
      'Sistema de detección y extinción de incendios',
      'Señalización de zonas de riesgo'
    ],
    ergonomico: [
      'Rotación de tareas y pausas activas',
      'Ergonomía del puesto de trabajo',
      'Ayudas mecánicas para manipulación',
      'Formación en técnicas de levantamiento',
      'Ajuste de iluminación a normativa'
    ],
    quimico: [
      'Uso de EPIs químicos adecuados',
      'Ventilación y extracción localizada',
      'Fichas de seguridad disponibles',
      'Protocolo de actuación ante derrames',
      'Almacenamiento en armarios específicos'
    ],
    biologico: [
      'Protocolos de higiene y desinfección',
      'Gestión adecuada de residuos',
      'Ventilación de espacios',
      'Limpieza y desinfección periódica',
      'Separación de áreas limpias/sucias'
    ],
    fisico: [
      'Protección auditiva obligatoria',
      'Control de temperatura ambiental',
      'Mantenimiento preventivo de equipos',
      'Apantallamiento de fuentes',
      'Ajuste de niveles de iluminación'
    ],
    psicosocial: [
      'Organización de tareas y prioridades',
      'Programas de gestión del estrés',
      'Rotación y enriquecimiento de tareas',
      'Canales de comunicación efectivos',
      'Protocolos de resolución de conflictos'
    ],
  };

  return {
    id: generateId(),
    categoria,
    descripcion: descripciones[categoria][Math.floor(Math.random() * descripciones[categoria].length)],
    nivel,
    probabilidad,
    consecuencias,
    medidasControl: medidas[categoria][Math.floor(Math.random() * medidas[categoria].length)],
  };
};

// Función para seed de datos
export const seedData = async () => {
  // Crear 4 evaluaciones
  const evaluations: RiskEvaluation[] = [];

  workCenters.slice(0, 3).forEach((center, index) => {
    const allNodes = getAllStructureNodes(center.estructuraJerarquica);
    const riesgosEstructura = [];
    const riesgosPuestos = [];

    // Seleccionar 10 nodos aleatorios para asignar riesgos
    const selectedNodes = allNodes
      .filter(n => n.tipo !== 'edificio' && n.tipo !== 'planta')
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);

    selectedNodes.forEach(node => {
      riesgosEstructura.push({
        structureNodeId: node.id,
        structureNodeName: node.nombre,
        structureNodePath: getNodePath(center.estructuraJerarquica, node.id),
        risk: createRandomRisk(),
      });
    });

    // Asignar 5 riesgos específicos a puestos
    center.puestosTrabajo.forEach(position => {
      const category = jobPositionCategories.find(c => c.id === position.categoryId);

      // Agregar riesgos genéricos
      if (category) {
        category.riesgosGenericos.forEach(risk => {
          riesgosPuestos.push({
            jobPositionId: position.id,
            jobPositionName: position.categoryName,
            risk: risk,
            isGeneric: true,
          });
        });
      }
    });

    // Agregar algunos riesgos específicos adicionales
    const selectedPositions = center.puestosTrabajo.slice(0, Math.min(3, center.puestosTrabajo.length));
    selectedPositions.forEach(position => {
      riesgosPuestos.push({
        jobPositionId: position.id,
        jobPositionName: position.categoryName,
        risk: createRandomRisk(),
        isGeneric: false,
      });
    });

    const evaluation: RiskEvaluation = {
      id: generateId(),
      workCenterId: center.id,
      workCenterName: center.nombre,
      fecha: new Date(2024, index * 2, 15).toISOString(),
      evaluador: index === 0 ? 'Ana García López' : index === 1 ? 'Pedro Martínez Ruiz' : 'Isabel Rodríguez Sanz',
      cargo: 'Técnico de Prevención de Riesgos Laborales',
      riesgos: [],
      riesgosEstructura,
      riesgosPuestos,
      observaciones: `Evaluación inicial del centro de trabajo. Se han identificado ${riesgosEstructura.length} riesgos en ubicaciones específicas y ${riesgosPuestos.length} riesgos en puestos de trabajo.`,
      estado: index === 0 ? 'completada' : index === 1 ? 'en_progreso' : 'completada',
    };

    evaluations.push(evaluation);
  });

  // Crear una evaluación adicional para el primer centro (seguimiento)
  const followUpCenter = workCenters[0];
  const allNodes = getAllStructureNodes(followUpCenter.estructuraJerarquica);
  const riesgosEstructura = [];
  const riesgosPuestos = [];

  const selectedNodes = allNodes
    .filter(n => n.tipo !== 'edificio' && n.tipo !== 'planta')
    .sort(() => 0.5 - Math.random())
    .slice(0, 10);

  selectedNodes.forEach(node => {
    riesgosEstructura.push({
      structureNodeId: node.id,
      structureNodeName: node.nombre,
      structureNodePath: getNodePath(followUpCenter.estructuraJerarquica, node.id),
      risk: createRandomRisk(),
    });
  });

  followUpCenter.puestosTrabajo.forEach(position => {
    const category = jobPositionCategories.find(c => c.id === position.categoryId);
    if (category) {
      category.riesgosGenericos.forEach(risk => {
        riesgosPuestos.push({
          jobPositionId: position.id,
          jobPositionName: position.categoryName,
          risk: risk,
          isGeneric: true,
        });
      });
    }
  });

  evaluations.push({
    id: generateId(),
    workCenterId: followUpCenter.id,
    workCenterName: followUpCenter.nombre,
    fecha: new Date(2024, 8, 20).toISOString(),
    evaluador: 'Roberto Sánchez Díaz',
    cargo: 'Técnico Superior de PRL',
    riesgos: [],
    riesgosEstructura,
    riesgosPuestos,
    observaciones: 'Evaluación de seguimiento. Se han revisado las medidas preventivas implementadas tras la evaluación inicial.',
    estado: 'revision',
  });

  await apiRequest('/sistema/cargar-datos-prueba', {
    method: 'POST',
    body: JSON.stringify({
      jobCategories: jobPositionCategories,
      workCenters,
      evaluations,
    }),
  });

  console.log('✅ Datos de prueba cargados correctamente:');
  console.log(`   - ${jobPositionCategories.length} categorías de puestos de trabajo`);
  console.log(`   - ${workCenters.length} centros de trabajo`);
  console.log(`   - ${evaluations.length} evaluaciones`);

  return {
    jobPositionCategories,
    workCenters,
    evaluations,
  };
};
