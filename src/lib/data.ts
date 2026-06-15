import type { Card, SetInfo } from '@/types';

export interface CatalogueData {
  cards: Card[];
  sets: SetInfo[];
  setById: Map<string, SetInfo>;
  cardById: Map<number, Card>;
  /** Distinct card types present, sorted. */
  types: string[];
}

let cache: CatalogueData | null = null;

function asset(path: string): string {
  // Respect a non-root deploy base (Vite injects BASE_URL).
  return import.meta.env.BASE_URL.replace(/\/$/, '') + '/' + path;
}

export async function loadCatalogue(): Promise<CatalogueData> {
  if (cache) return cache;

  const [cards, sets] = await Promise.all([
    fetch(asset('data/cards.json')).then((r) => {
      if (!r.ok) throw new Error(`cards.json: ${r.status}`);
      return r.json() as Promise<Card[]>;
    }),
    fetch(asset('data/sets.json')).then((r) => {
      if (!r.ok) throw new Error(`sets.json: ${r.status}`);
      return r.json() as Promise<SetInfo[]>;
    }),
  ]);

  // Precompute a lowercase search haystack once.
  for (const c of cards) {
    c._search = [c.title, c.subType, c.type, c.abbr, c.gametext, c.lore]
      .filter(Boolean)
      .join('  ')
      .toLowerCase();
  }

  const setById = new Map(sets.map((s) => [s.id, s]));
  const cardById = new Map(cards.map((c) => [c.id, c]));
  const types = [...new Set(cards.map((c) => c.type))].sort((a, b) => a.localeCompare(b));

  cache = { cards, sets, setById, cardById, types };
  return cache;
}
