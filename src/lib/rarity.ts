// Rarity metadata for the original Decipher SWCCG rarity codes.
// Codes present in the Decipher data: C, C1, C2, C3, U, U1, U2, R, R1, R2, F, PM, UR, XR.

export interface RarityMeta {
  /** Display label. */
  label: string;
  /** Coarse grouping used for the rarity filter and colour. */
  group: 'common' | 'uncommon' | 'rare' | 'fixed' | 'premium' | 'exclusive';
  /** Sort order, scarcer = larger. */
  order: number;
}

export const RARITY: Record<string, RarityMeta> = {
  C: { label: 'Common', group: 'common', order: 10 },
  C1: { label: 'Common 1', group: 'common', order: 11 },
  C2: { label: 'Common 2', group: 'common', order: 12 },
  C3: { label: 'Common 3', group: 'common', order: 13 },
  F: { label: 'Fixed', group: 'fixed', order: 45 },
  U: { label: 'Uncommon', group: 'uncommon', order: 30 },
  U1: { label: 'Uncommon 1', group: 'uncommon', order: 31 },
  U2: { label: 'Uncommon 2', group: 'uncommon', order: 32 },
  R: { label: 'Rare', group: 'rare', order: 40 },
  R1: { label: 'Rare 1', group: 'rare', order: 41 },
  R2: { label: 'Rare 2', group: 'rare', order: 42 },
  PM: { label: 'Premium', group: 'premium', order: 50 },
  UR: { label: 'Ultra Rare', group: 'exclusive', order: 60 },
  XR: { label: 'Exclusive Rare', group: 'exclusive', order: 61 },
};

export const RARITY_GROUPS: { key: RarityMeta['group']; label: string }[] = [
  { key: 'common', label: 'Common' },
  { key: 'uncommon', label: 'Uncommon' },
  { key: 'rare', label: 'Rare' },
  { key: 'fixed', label: 'Fixed' },
  { key: 'premium', label: 'Premium' },
  { key: 'exclusive', label: 'Ultra / Exclusive' },
];

export function rarityMeta(code: string): RarityMeta {
  return RARITY[code] ?? { label: code || 'Unknown', group: 'common', order: 99 };
}

const GROUP_CLASSES: Record<RarityMeta['group'], string> = {
  common: 'bg-slate-500/15 text-slate-300 ring-slate-400/30',
  uncommon: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  rare: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
  fixed: 'bg-zinc-500/15 text-zinc-300 ring-zinc-400/30',
  premium: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  exclusive: 'bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/30',
};

export function rarityClasses(code: string): string {
  return GROUP_CLASSES[rarityMeta(code).group];
}
