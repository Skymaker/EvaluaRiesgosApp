import { getProbabilidadLabel, getConsecuenciasLabel } from '../utils/risk-utils';
import { cn } from './ui/utils';

type ProbConsecInlineProps = {
  probabilidad: number;
  consecuencias: number;
  className?: string;
};

/**
 * Móvil: P: n | C: n. Escritorio e impresión: etiquetas completas (Baja/Media/Alta, etc.).
 */
export function ProbConsecInline({ probabilidad, consecuencias, className }: ProbConsecInlineProps) {
  return (
    <span className={cn('text-xs text-gray-500', className)}>
      <span className="whitespace-nowrap sm:hidden print:hidden">
        P: {probabilidad} | C: {consecuencias}
      </span>
      <span className="hidden text-right leading-snug sm:inline print:inline print:whitespace-normal">
        P: {getProbabilidadLabel(probabilidad)} | C: {getConsecuenciasLabel(consecuencias)}
      </span>
    </span>
  );
}
