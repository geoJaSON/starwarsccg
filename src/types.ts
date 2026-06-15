export type Side = 'Dark' | 'Light';

/** A single catalogue card (slimmed from the upstream swccg-card-json data). */
export interface Card {
  id: number;
  gempId: string;
  title: string;
  type: string;
  subType?: string;
  side: Side;
  rarity: string;
  set: string;
  imageUrl: string;
  backImageUrl?: string;
  gametext?: string;
  lore?: string;
  icons?: string[];
  uniqueness?: string;
  stats?: Record<string, string>;
  abbr?: string;
  /** Lowercased haystack for text search; attached at load time. */
  _search?: string;
}

export interface SetInfo {
  id: string;
  name: string;
  abbr: string;
  release: string | null;
  position: number;
  count: number;
}

/** Physical card condition grades. */
export type Condition = 'M' | 'NM' | 'EX' | 'VG' | 'GD' | 'PR';

/** What the user owns / wants for a single card. Sparse: only present if non-empty. */
export interface CollectionEntry {
  /** Standard copies owned. */
  qty: number;
  /** Foil / premium copies owned (Reflections etc.). */
  foil?: number;
  /** On the want list. */
  want?: boolean;
  condition?: Condition;
  notes?: string;
}

export type StatusFilter = 'all' | 'owned' | 'missing' | 'want';
export type SortMode = 'set' | 'name' | 'rarity';
export type ViewMode = 'grid' | 'list';
