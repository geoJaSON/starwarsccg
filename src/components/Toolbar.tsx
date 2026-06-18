import type { SortMode } from '@/types';
import { useUi } from '@/store/ui';

interface Props {
  total: number;
  shown: number;
  onOpenFilters: () => void;
}

const SORTS: { key: SortMode; label: string }[] = [
  { key: 'set', label: 'Set' },
  { key: 'name', label: 'Name' },
  { key: 'rarity', label: 'Rarity' },
];

export default function Toolbar({ total, shown, onOpenFilters }: Props) {
  const ui = useUi();
  const filtered = shown !== total;

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-space-800 bg-space-950/80 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
      {/* Search — its own full-width row */}
      <div className="relative mb-2">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          ⌕
        </span>
        <input
          type="search"
          value={ui.search}
          onChange={(e) => ui.setSearch(e.target.value)}
          placeholder="Search title, lore, game text…"
          className="input w-full pl-8"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-outline lg:hidden" onClick={onOpenFilters} aria-label="Open filters">
          ☰ Filters
        </button>

        <div className="flex items-center gap-1 rounded-lg bg-space-850 p-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => ui.setSort(s.key)}
              className={`seg ${ui.sort === s.key ? 'seg-active' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-space-850 p-1">
          <button
            onClick={() => ui.setView('grid')}
            aria-label="Grid view"
            className={`seg ${ui.view === 'grid' ? 'seg-active' : ''}`}
          >
            ▦
          </button>
          <button
            onClick={() => ui.setView('list')}
            aria-label="List view"
            className={`seg ${ui.view === 'list' ? 'seg-active' : ''}`}
          >
            ☰
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          <span className="tabular-nums">
            {filtered ? (
              <>
                <span className="text-slate-200">{shown.toLocaleString()}</span> / {total.toLocaleString()}
              </>
            ) : (
              <>
                <span className="text-slate-200">{total.toLocaleString()}</span> cards
              </>
            )}
          </span>
          {ui.hasActiveFilters() && (
            <button onClick={ui.clearFilters} className="btn-ghost px-2 py-1 text-xs">
              Clear ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
