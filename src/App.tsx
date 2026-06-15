import { useEffect, useMemo, useState } from 'react';
import { loadCatalogue, type CatalogueData } from '@/lib/data';
import { selectCards } from '@/lib/filter';
import { useUi } from '@/store/ui';
import { useCollection, isOwned } from '@/store/collection';
import Header, { type CollectionStats } from '@/components/Header';
import Toolbar from '@/components/Toolbar';
import FilterSidebar from '@/components/FilterSidebar';
import CardGrid from '@/components/CardGrid';
import CardDetail from '@/components/CardDetail';

function Splash({ message, error }: { message: string; error?: boolean }) {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <div className={`mx-auto mb-4 text-4xl ${error ? '' : 'animate-pulse'}`}>✦</div>
        <p className={error ? 'text-dark-bright' : 'text-slate-400'}>{message}</p>
        {error && (
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Run <code className="rounded bg-space-800 px-1.5 py-0.5">npm run build-cards</code> to
            regenerate the catalogue data, then reload.
          </p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<CatalogueData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const ui = useUi();
  const entries = useCollection((s) => s.entries);
  const hydrated = useCollection((s) => s.hydrated);
  const [hydrationTimedOut, setHydrationTimedOut] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    loadCatalogue()
      .then(setData)
      .catch((e) => setLoadError(e instanceof Error ? e.message : String(e)));
  }, []);

  // Don't get stuck on the splash if IndexedDB hydration never resolves.
  useEffect(() => {
    const t = setTimeout(() => setHydrationTimedOut(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // Mobile filter drawer: Escape to close + lock background scroll while open.
  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFiltersOpen(false);
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [filtersOpen]);

  const allCards = data?.cards ?? [];

  // The filtered list only depends on the collection when filtering by ownership,
  // so routine qty edits don't recompute the list or reset scroll paging.
  const statusDep = ui.status === 'all' ? null : entries;
  const filtered = useMemo(
    () =>
      data
        ? selectCards(
            allCards,
            {
              search: ui.search,
              side: ui.side,
              sets: ui.sets,
              rarityGroups: ui.rarityGroups,
              types: ui.types,
              status: ui.status,
            },
            ui.sort,
            entries,
            data.setById
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, allCards, ui.search, ui.side, ui.sets, ui.rarityGroups, ui.types, ui.status, ui.sort, statusDep]
  );

  const { stats, ownedBySet } = useMemo(() => {
    let ownedDistinct = 0;
    let copies = 0;
    let wantCount = 0;
    const bySet = new Map<string, number>();
    for (const card of allCards) {
      const e = entries[card.id];
      if (!e) continue;
      if (e.want) wantCount++;
      if (isOwned(e)) {
        ownedDistinct++;
        copies += (e.qty ?? 0) + (e.foil ?? 0);
        bySet.set(card.set, (bySet.get(card.set) ?? 0) + 1);
      }
    }
    const s: CollectionStats = {
      ownedDistinct,
      totalCards: allCards.length,
      copies,
      wantCount,
    };
    return { stats: s, ownedBySet: bySet };
  }, [allCards, entries]);

  if (loadError) return <Splash message={`Couldn't load the card data: ${loadError}`} error />;
  if (!data || !(hydrated || hydrationTimedOut)) return <Splash message="Loading the archives…" />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header stats={stats} />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-6 px-4 py-4 sm:px-6">
        {/* Desktop sidebar */}
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 overflow-y-auto pb-6 pr-1 lg:block">
          <FilterSidebar sets={data.sets} types={data.types} ownedBySet={ownedBySet} />
        </aside>

        <main className="min-w-0 flex-1">
          <Toolbar total={allCards.length} shown={filtered.length} onOpenFilters={() => setFiltersOpen(true)} />
          {filtered.length > 0 ? (
            <CardGrid cards={filtered} setById={data.setById} view={ui.view} />
          ) : (
            <div className="grid place-items-center py-24 text-center">
              <div>
                <div className="mb-3 text-3xl opacity-40">⌕</div>
                <p className="text-slate-400">No cards match these filters.</p>
                <button className="btn-outline mt-3" onClick={ui.clearFilters}>
                  Clear filters
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-space-950/70 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs overflow-y-auto bg-space-900 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display font-semibold text-white">Filters</h2>
              <button
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-space-700 hover:text-white"
              >
                ✕
              </button>
            </div>
            <FilterSidebar sets={data.sets} types={data.types} ownedBySet={ownedBySet} />
          </div>
        </div>
      )}

      <CardDetail cardById={data.cardById} setById={data.setById} />

      <footer className="border-t border-space-800 px-6 py-4 text-center text-[11px] text-slate-400">
        Card data &amp; images courtesy of the SWCCG Players Committee (res.starwarsccg.org). This is a
        personal collection tracker and is not affiliated with Decipher or Lucasfilm.
      </footer>
    </div>
  );
}
