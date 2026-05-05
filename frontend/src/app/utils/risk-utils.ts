import { RiskLevel, RiskCategory, Risk } from '../types';

const RISK_LEVEL_RANK: Record<RiskLevel, number> = {
  trivial: 1,
  tolerable: 2,
  moderado: 3,
  importante: 4,
  intolerable: 5,
};

/** Mayor valor = riesgo más alto (útil para ordenar de mayor a menor). */
export function getRiskLevelRank(level: RiskLevel): number {
  return RISK_LEVEL_RANK[level] ?? 0;
}

/** Orden: nivel de riesgo (mayor primero), luego tipo (categoría), luego descripción. */
export function compareRisksByLevelDescThenCategory(a: Risk, b: Risk): number {
  const ra = getRiskLevelRank(a.nivel);
  const rb = getRiskLevelRank(b.nivel);
  if (rb !== ra) return rb - ra;
  const ca = getCategoryLabel(a.categoria);
  const cb = getCategoryLabel(b.categoria);
  const ccmp = ca.localeCompare(cb, 'es', { sensitivity: 'base' });
  if (ccmp !== 0) return ccmp;
  return a.descripcion.localeCompare(b.descripcion, 'es', { sensitivity: 'base' });
}

export const getRiskLevelColor = (level: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    trivial: 'bg-green-100 text-green-800 border-green-200',
    tolerable: 'bg-blue-100 text-blue-800 border-blue-200',
    moderado: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    importante: 'bg-orange-100 text-orange-800 border-orange-200',
    intolerable: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[level];
};

export const getRiskLevelLabel = (level: RiskLevel): string => {
  const labels: Record<RiskLevel, string> = {
    trivial: 'Trivial',
    tolerable: 'Tolerable',
    moderado: 'Moderado',
    importante: 'Importante',
    intolerable: 'Intolerable',
  };
  return labels[level];
};

export const getCategoryLabel = (category: RiskCategory): string => {
  const labels: Record<RiskCategory, string> = {
    seguridad: 'Seguridad',
    ergonomico: 'Ergonómico',
    quimico: 'Químico',
    biologico: 'Biológico',
    fisico: 'Físico',
    psicosocial: 'Psicosocial',
  };
  return labels[category];
};

export const getCategoryColor = (category: RiskCategory): string => {
  const colors: Record<RiskCategory, string> = {
    seguridad: 'bg-red-50 text-red-700 border-red-200',
    ergonomico: 'bg-blue-50 text-blue-700 border-blue-200',
    quimico: 'bg-purple-50 text-purple-700 border-purple-200',
    biologico: 'bg-green-50 text-green-700 border-green-200',
    fisico: 'bg-orange-50 text-orange-700 border-orange-200',
    psicosocial: 'bg-pink-50 text-pink-700 border-pink-200',
  };
  return colors[category];
};

// Nuevos niveles: 1=Baja, 2=Media, 3=Alta
// Nuevas consecuencias: 1=Ligeramente dañino, 2=Dañino, 3=Extremadamente dañino
export const calculateRiskLevel = (probabilidad: number, consecuencias: number): RiskLevel => {
  // Matriz de riesgo 3x3
  if (probabilidad === 1 && consecuencias === 1) return 'trivial';
  if (probabilidad === 1 && consecuencias === 2) return 'tolerable';
  if (probabilidad === 1 && consecuencias === 3) return 'moderado';

  if (probabilidad === 2 && consecuencias === 1) return 'tolerable';
  if (probabilidad === 2 && consecuencias === 2) return 'moderado';
  if (probabilidad === 2 && consecuencias === 3) return 'importante';

  if (probabilidad === 3 && consecuencias === 1) return 'moderado';
  if (probabilidad === 3 && consecuencias === 2) return 'importante';
  if (probabilidad === 3 && consecuencias === 3) return 'intolerable';

  return 'moderado'; // Valor por defecto
};

export const getProbabilidadLabel = (probabilidad: number): string => {
  const labels: Record<number, string> = {
    1: 'Baja',
    2: 'Media',
    3: 'Alta',
  };
  return labels[probabilidad] || 'Media';
};

export const getConsecuenciasLabel = (consecuencias: number): string => {
  const labels: Record<number, string> = {
    1: 'Ligeramente dañino',
    2: 'Dañino',
    3: 'Extremadamente dañino',
  };
  return labels[consecuencias] || 'Dañino';
};

/** Orden visual: izquierda → centro → derecha (selector de 3 posiciones). */
export const EVALUATION_ESTADOS_TRIPLES = ['revision', 'en_progreso', 'completada'] as const;
export type EvaluationEstadoTriple = (typeof EVALUATION_ESTADOS_TRIPLES)[number];

export function normalizeEvaluationEstadoForForm(state: string): EvaluationEstadoTriple {
  if (state === 'revision' || state === 'en_progreso' || state === 'completada') {
    return state;
  }
  return 'en_progreso';
}

export function estadoToSliderIndex(state: string): number {
  return EVALUATION_ESTADOS_TRIPLES.indexOf(normalizeEvaluationEstadoForForm(state));
}

export function sliderIndexToEstado(index: number): EvaluationEstadoTriple {
  const clamped = Math.max(0, Math.min(2, Math.round(index)));
  return EVALUATION_ESTADOS_TRIPLES[clamped];
}

export const getStateLabel = (state: string): string => {
  const labels: Record<string, string> = {
    pendiente: 'Pendiente',
    en_progreso: 'En progreso',
    completada: 'Completada',
    revision: 'En revisión',
  };
  return labels[state] || state;
};

export const getStateColor = (state: string): string => {
  const colors: Record<string, string> = {
    pendiente: 'bg-gray-100 text-gray-800 border-gray-200',
    en_progreso: 'bg-blue-100 text-blue-800 border-blue-200',
    completada: 'bg-green-100 text-green-800 border-green-200',
    revision: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };
  return colors[state] || 'bg-gray-100 text-gray-800 border-gray-200';
};
