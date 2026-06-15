import type { Card, CollectionEntry, SetInfo, SortMode, StatusFilter, Side } from '@/types';
import { isOwned } from '@/store/collection';
import { rarityMeta } from './rarity';

export interface FilterState {
  search: string;
  side: 'all' | Side;
  sets: string[];
  rarityGroups: string[];
  types: string[];
  status: StatusFilter;
}

export function selectCards(
  cards: Card[],
  f: FilterState,
  sort: SortMode,
  entries: Record<number, CollectionEntry>,
  setById: Map<string, SetInfo>
): Card[] {
  const terms = f.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const setSet = f.sets.length ? new Set(f.sets) : null;
  const raritySet = f.rarityGroups.length ? new Set(f.rarityGroups) : null;
  const typeSet = f.types.length ? new Set(f.types) : null;

  const out = cards.filter((c) => {
    if (f.side !== 'all' && c.side !== f.side) return false;
    if (setSet && !setSet.has(c.set)) return false;
    if (raritySet && !raritySet.has(rarityMeta(c.rarity).group)) return false;
    if (typeSet && !typeSet.has(c.type)) return false;

    if (f.status !== 'all') {
      const e = entries[c.id];
      if (f.status === 'owned' && !isOwned(e)) return false;
      if (f.status === 'missing' && isOwned(e)) return false;
      if (f.status === 'want' && !e?.want) return false;
    }

    if (terms.length) {
      const hay = c._search ?? '';
      for (const t of terms) if (!hay.includes(t)) return false;
    }
    return true;
  });

  const setPos = (c: Card) => setById.get(c.set)?.position ?? 9999;

  // Deterministic tiebreaker for cards that share a title (e.g. "Alter" exists
  // on both sides and in several sets): set, then side, then id.
  const tie = (a: Card, b: Card) => {
    const ds = setPos(a) - setPos(b);
    if (ds) return ds;
    if (a.side !== b.side) return a.side.localeCompare(b.side);
    return a.id - b.id;
  };

  out.sort((a, b) => {
    if (sort === 'name') {
      const d = a.title.localeCompare(b.title);
      return d || tie(a, b);
    }
    if (sort === 'rarity') {
      const d = rarityMeta(a.rarity).order - rarityMeta(b.rarity).order;
      if (d) return d;
      const t = a.title.localeCompare(b.title);
      return t || tie(a, b);
    }
    // 'set'
    const d = setPos(a) - setPos(b);
    if (d) return d;
    if (a.side !== b.side) return a.side.localeCompare(b.side);
    return a.title.localeCompare(b.title) || a.id - b.id;
  });

  return out;
}
