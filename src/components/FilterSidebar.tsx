import { useState } from 'react';
import type { SetInfo, StatusFilter, Side } from '@/types';
import { useUi } from '@/store/ui';
import { RARITY_GROUPS } from '@/lib/rarity';
import { pct, formatYear } from '@/lib/format';

interface Props {
  sets: SetInfo[];
  types: string[];
  ownedBySet: Map<string, number>;
}

const STATUS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'owned', label: 'Owned' },
  { key: 'missing', label: 'Missing' },
  { key: 'want', label: 'Want' },
];

const SIDES: { key: 'all' | Side; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Light', label: 'Light' },
  { key: 'Dark', label: 'Dark' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

export default function FilterSidebar({ sets, types, ownedBySet }: Props) {
  const ui = useUi();
  const [showAllTypes, setShowAllTypes] = useState(false);
  const visibleTypes = showAllTypes ? types : types.slice(0, 8);

  return (
    <div className="flex flex-col gap-5">
      <Section title="Status">
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-space-850 p-1">
          {STATUS.map((s) => (
            <button
              key={s.key}
              onClick={() => ui.setStatus(s.key)}
              className={`seg ${ui.status === s.key ? 'seg-active' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Side">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-space-850 p-1">
          {SIDES.map((s) => (
            <button
              key={s.key}
              onClick={() => ui.setSide(s.key)}
              className={`seg ${ui.side === s.key ? 'seg-active' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Rarity">
        <div className="flex flex-wrap gap-1.5">
          {RARITY_GROUPS.map((g) => {
            const active = ui.rarityGroups.includes(g.key);
            return (
              <button
                key={g.key}
                onClick={() => ui.toggleRarityGroup(g.key)}
                className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition ${
                  active
                    ? 'bg-gold/20 text-gold ring-gold/50'
                    : 'bg-space-850 text-slate-400 ring-space-700 hover:text-slate-200'
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Card type">
        <div className="flex flex-wrap gap-1.5">
          {visibleTypes.map((t) => {
            const active = ui.types.includes(t);
            return (
              <button
                key={t}
                onClick={() => ui.toggleType(t)}
                className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition ${
                  active
                    ? 'bg-gold/20 text-gold ring-gold/50'
                    : 'bg-space-850 text-slate-400 ring-space-700 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            );
          })}
          {types.length > 8 && (
            <button
              onClick={() => setShowAllTypes((v) => !v)}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-200"
            >
              {showAllTypes ? 'Show fewer' : `+${types.length - 8} more`}
            </button>
          )}
        </div>
      </Section>

      <Section title="Sets">
        <div className="space-y-1">
          {sets.map((s) => {
            const owned = ownedBySet.get(s.id) ?? 0;
            const percent = pct(owned, s.count);
            const active = ui.sets.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => ui.toggleSet(s.id)}
                className={`block w-full rounded-lg border px-2.5 py-1.5 text-left transition ${
                  active
                    ? 'border-gold/50 bg-gold/10'
                    : 'border-transparent hover:border-space-700 hover:bg-space-850'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13px] font-medium text-slate-200">{s.name}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
                    {owned}/{s.count}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-space-700">
                    <div
                      className="h-full rounded-full bg-gold transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-7 shrink-0 text-right text-[10px] tabular-nums text-slate-500">
                    {percent}%
                  </span>
                  {s.release && (
                    <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-slate-400">
                      ’{formatYear(s.release).slice(2)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
