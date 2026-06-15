import { useEffect, useRef, useState } from 'react';
import type { Card, Condition, SetInfo } from '@/types';
import { useUi } from '@/store/ui';
import { useCollection } from '@/store/collection';
import { rarityClasses, rarityMeta } from '@/lib/rarity';
import { SIDE_META, formatYear, uniquenessDots } from '@/lib/format';
import CardImage from './CardImage';
import QtyStepper from './QtyStepper';

const CONDITIONS: { key: Condition; label: string }[] = [
  { key: 'M', label: 'Mint' },
  { key: 'NM', label: 'Near Mint' },
  { key: 'EX', label: 'Excellent' },
  { key: 'VG', label: 'Very Good' },
  { key: 'GD', label: 'Good' },
  { key: 'PR', label: 'Poor' },
];

const STAT_LABELS: Record<string, string> = {
  deploy: 'Deploy',
  destiny: 'Destiny',
  power: 'Power',
  forfeit: 'Forfeit',
  ability: 'Ability',
  armor: 'Armor',
  maneuver: 'Maneuver',
  hyperspeed: 'Hyperspeed',
  landspeed: 'Landspeed',
  parsec: 'Parsec',
  ferocity: 'Ferocity',
  politics: 'Politics',
};

interface Props {
  card: Card;
  set?: SetInfo;
}

function Detail({ card, set }: Props) {
  const select = useUi((s) => s.select);
  const entry = useCollection((s) => s.entries[card.id]);
  const c = useCollection();
  const [showBack, setShowBack] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Move focus into the dialog on open and restore it to the trigger on close.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => prev?.focus?.();
  }, []);

  function trapTab(e: React.KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const root = dialogRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === root)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const side = SIDE_META[card.side];
  const qty = entry?.qty ?? 0;
  const foil = entry?.foil ?? 0;

  const img = showBack && card.backImageUrl ? card.backImageUrl : card.imageUrl;
  const statEntries = card.stats ? Object.entries(card.stats) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-space-950/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={() => select(null)}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="panel my-auto w-full max-w-4xl overflow-hidden shadow-2xl focus:outline-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={trapTab}
        role="dialog"
        aria-modal="true"
        aria-label={card.title}
      >
        <div className="grid gap-0 md:grid-cols-[minmax(0,360px)_1fr]">
          {/* Art */}
          <div className="relative bg-space-850 p-4">
            <CardImage key={img} src={img} alt={card.title} eager className="aspect-[5/7] w-full rounded-lg" />
            {card.backImageUrl && (
              <button
                className="btn-outline mt-3 w-full"
                onClick={() => setShowBack((v) => !v)}
              >
                ⟲ Show {showBack ? 'front' : 'back'}
              </button>
            )}
          </div>

          {/* Info + controls */}
          <div className="flex max-h-[85vh] flex-col overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-xl font-bold leading-tight text-white">
                  {card.uniqueness && <span className="mr-1 text-gold">{uniquenessDots(card.uniqueness)}</span>}
                  {card.title}
                </h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  {card.type}
                  {card.subType ? ` · ${card.subType}` : ''}
                </p>
              </div>
              <button
                onClick={() => select(null)}
                aria-label="Close"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-space-700 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className={`chip ${side.soft}`}>{side.label}</span>
              <span className={`chip ${rarityClasses(card.rarity)}`}>
                {rarityMeta(card.rarity).label} ({card.rarity})
              </span>
              {set && (
                <span className="chip bg-space-700 text-slate-300 ring-space-600">
                  {set.name}
                  {set.release ? ` · ${formatYear(set.release)}` : ''}
                </span>
              )}
              {card.abbr && (
                <span className="chip bg-space-800 text-slate-400 ring-space-700">#{card.abbr}</span>
              )}
            </div>

            {statEntries.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {statEntries.map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-lg border border-space-700 bg-space-850 px-2.5 py-1 text-center"
                  >
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">
                      {STAT_LABELS[k] ?? k}
                    </div>
                    <div className="text-sm font-semibold tabular-nums text-slate-100">{v}</div>
                  </div>
                ))}
              </div>
            )}

            {card.icons && card.icons.length > 0 && (
              <p className="mt-3 text-xs text-slate-500">
                <span className="text-slate-400">Icons:</span> {card.icons.join(', ')}
              </p>
            )}

            {card.gametext && (
              <div className="mt-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Game text
                </h3>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                  {card.gametext}
                </p>
              </div>
            )}

            {card.lore && (
              <div className="mt-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Lore
                </h3>
                <p className="mt-1 text-sm italic leading-relaxed text-slate-400">{card.lore}</p>
              </div>
            )}

            {/* Collection controls */}
            <div className="mt-5 space-y-3 rounded-xl border border-space-700 bg-space-850/60 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">My collection</h3>
                <button
                  onClick={() => c.toggleWant(card.id)}
                  className={`chip ${entry?.want ? 'bg-gold/20 text-gold ring-gold/50' : 'bg-space-800 text-slate-400 ring-space-700'}`}
                >
                  {entry?.want ? '★ On want list' : '☆ Want'}
                </button>
              </div>

              <QtyStepper label="Copies owned" value={qty} onChange={(n) => c.setQty(card.id, n)} />
              <QtyStepper
                label="Foil / premium"
                value={foil}
                accent="gold"
                onChange={(n) => c.setFoil(card.id, n)}
              />

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-300">Condition</span>
                <select
                  value={entry?.condition ?? ''}
                  onChange={(e) =>
                    c.setCondition(card.id, (e.target.value || undefined) as Condition | undefined)
                  }
                  className="input py-1.5"
                >
                  <option value="">—</option>
                  {CONDITIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label} ({opt.key})
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={entry?.notes ?? ''}
                onChange={(e) => c.setNotes(card.id, e.target.value)}
                placeholder="Notes (e.g. graded, signed, trade copy…)"
                rows={2}
                className="input w-full resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CardDetail({
  cardById,
  setById,
}: {
  cardById: Map<number, Card>;
  setById: Map<string, SetInfo>;
}) {
  const selectedId = useUi((s) => s.selectedId);
  const select = useUi((s) => s.select);

  useEffect(() => {
    if (selectedId == null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && select(null);
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [selectedId, select]);

  if (selectedId == null) return null;
  const card = cardById.get(selectedId);
  if (!card) return null;
  return <Detail card={card} set={setById.get(card.set)} />;
}
