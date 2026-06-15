import { memo } from 'react';
import type { Card, SetInfo } from '@/types';
import { useCollection, isOwned } from '@/store/collection';
import { useUi } from '@/store/ui';
import { rarityClasses, rarityMeta } from '@/lib/rarity';
import { SIDE_META, uniquenessDots } from '@/lib/format';

interface Props {
  card: Card;
  set?: SetInfo;
}

function CardListRowBase({ card, set }: Props) {
  const entry = useCollection((s) => s.entries[card.id]);
  const acquire = useCollection((s) => s.acquire);
  const setQty = useCollection((s) => s.setQty);
  const adjustQty = useCollection((s) => s.adjustQty);
  const toggleWant = useCollection((s) => s.toggleWant);
  const select = useUi((s) => s.select);

  const owned = isOwned(entry);
  const qty = entry?.qty ?? 0;
  const want = !!entry?.want;
  const side = SIDE_META[card.side];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => select(card.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(card.id);
        }
      }}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors cursor-pointer
        ${owned ? `${side.border} bg-space-900/60` : 'border-space-800 bg-space-900/30 hover:bg-space-800/40'}`}
    >
      <button
        type="button"
        aria-label={owned ? 'Owned. Set copies to zero' : 'Mark as owned'}
        aria-pressed={owned}
        onClick={(e) => {
          e.stopPropagation();
          owned ? setQty(card.id, 0) : acquire(card.id);
        }}
        className={`grid h-7 min-w-7 shrink-0 place-items-center rounded-full px-1.5 text-xs font-bold
          tabular-nums ring-1 ${
            owned
              ? 'bg-gold text-space-950 ring-gold-bright'
              : 'bg-space-950/60 text-slate-400 ring-white/15 hover:text-white'
          }`}
      >
        {owned ? (qty > 1 ? `×${qty}` : '✓') : '+'}
      </button>

      <span className={`h-2 w-2 shrink-0 rounded-full ${side.dot}`} title={side.label} />

      <span className="min-w-0 flex-1 truncate text-sm text-slate-100">
        {card.uniqueness && <span className="mr-1 text-gold">{uniquenessDots(card.uniqueness)}</span>}
        {card.title}
      </span>

      <span className="hidden w-28 shrink-0 truncate text-xs text-slate-500 sm:block">{card.type}</span>
      <span className={`chip hidden shrink-0 sm:inline-flex ${side.soft}`}>{set?.abbr ?? card.set}</span>
      <span className={`chip shrink-0 ${rarityClasses(card.rarity)}`} title={rarityMeta(card.rarity).label}>
        {card.rarity}
      </span>

      {owned && (
        <span className="hidden items-center gap-0.5 coarse:flex md:flex" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            aria-label="One fewer copy"
            onClick={() => adjustQty(card.id, -1)}
            className="h-6 w-6 rounded border border-space-600 text-slate-300 hover:text-white"
          >
            −
          </button>
          <button
            type="button"
            aria-label="One more copy"
            onClick={() => adjustQty(card.id, 1)}
            className="h-6 w-6 rounded border border-space-600 text-slate-300 hover:text-white"
          >
            +
          </button>
        </span>
      )}

      <button
        type="button"
        aria-label={want ? 'Remove from want list' : 'Add to want list'}
        aria-pressed={want}
        onClick={(e) => {
          e.stopPropagation();
          toggleWant(card.id);
        }}
        className={`shrink-0 text-base ${want ? 'text-gold' : 'text-slate-600 hover:text-gold'}`}
      >
        {want ? '★' : '☆'}
      </button>
    </div>
  );
}

const CardListRow = memo(CardListRowBase);
export default CardListRow;
