import type { Side } from '@/types';

export const SIDE_META: Record<
  Side,
  { label: string; text: string; border: string; dot: string; glow: string; soft: string }
> = {
  Light: {
    label: 'Light Side',
    text: 'text-light',
    border: 'border-light/50',
    dot: 'bg-light',
    glow: 'hover:shadow-glow-light',
    soft: 'bg-light/10 text-light ring-light/30',
  },
  Dark: {
    label: 'Dark Side',
    text: 'text-dark',
    border: 'border-dark/50',
    dot: 'bg-dark',
    glow: 'hover:shadow-glow-dark',
    soft: 'bg-dark/10 text-dark-bright ring-dark/30',
  },
};

export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function formatYear(release: string | null): string {
  if (!release) return '';
  return release.slice(0, 4);
}

/** Uniqueness glyphs shown next to a card title (• unique, ◊ restricted). */
export function uniquenessDots(uniqueness?: string): string {
  if (!uniqueness) return '';
  switch (uniqueness.trim()) {
    case '*':
      return '•';
    case '**':
      return '••';
    case '***':
      return '•••';
    case '<>':
      return '◊';
    case '<><><>':
      return '◊◊◊';
    default:
      // Never leak a raw upstream token into the UI.
      return '•';
  }
}
