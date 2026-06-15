import { memo } from 'react';
import type { Card, SetInfo } from '@/types';
import { useCollection, isOwned } from '@/store/collection';
import { useUi } from '@/store/ui';
import { rarityClasses, rarityMeta } from '@/lib/rarity';
import { SIDE_META, uniquenessDots } from '@/lib/format';
import CardImage from './CardImage';

interface Props {
  card: Card;
  set?: SetInfo;
}

function CardTileBase({ card, set }: Props) {
  const entry = useCollection((s) => s.entries[card.id]);
  const acquire = useCollection((s) => s.acquire);
  const setQty = useCollection((s) => s.setQty);
  const adjustQty = useCollection((s) => s.adjustQty);
  const toggleWant = useCollection((s) => s.toggleWant);
  const select = useUi((s) => s.select);

  const owned = isOwned(entry);
  const qty = entry?.qty ?? 0;
  const foil = entry?.foil ?? 0;
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
      className={`group relative cursor-pointer rounded-xl border bg-space-900/60 p-1.5
        transition-all ${side.glow} ${
          owned ? `${side.border} shadow-sm` : 'border-space-700/70 hover:border-space-600'
        }`}
    >
      {/* Card art */}
      <div className="relative">
        <CardImage
          src={card.imageUrl}
          alt={card.title}
          className={`aspect-[5/7] w-full rounded-lg transition ${
            owned ? '' : 'opacity-70 saturate-[0.6] group-hover:opacity-95 group-hover:saturate-100'
          }`}
        />

        {/* Ownership toggle (top-left) */}
        <button
          type="button"
          aria-label={owned ? `Owned ${qty}. Set copies to zero` : 'Mark as owned'}
          aria-pressed={owned}
          title={owned ? 'Owned — click to clear copies' : 'Mark as owned'}
          onClick={(e) => {
            e.stopPropagation();
            owned ? setQty(card.id, 0) : acquire(card.id);
          }}
          className={`absolute left-1.5 top-1.5 grid h-7 min-w-7 place-items-center rounded-full
            px-1.5 text-xs font-bold tabular-nums shadow-md ring-1 transition ${
              owned
                ? 'bg-gold text-space-950 ring-gold-bright'
                : 'bg-space-950/70 text-slate-300 ring-white/15 hover:bg-space-800 hover:text-white'
            }`}
        >
          {owned ? (qty > 1 ? `×${qty}` : '✓') : '+'}
        </button>

        {/* Want star (top-right) */}
        <button
          type="button"
          aria-label={want ? 'Remove from want list' : 'Add to want list'}
          aria-pressed={want}
          title={want ? 'On want list' : 'Add to want list'}
          onClick={(e) => {
            e.stopPropagation();
            toggleWant(card.id);
          }}
          className={`absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full
            text-sm shadow-md ring-1 transition ${
              want
                ? 'bg-space-950/70 text-gold ring-gold/50'
                : 'bg-space-950/50 text-slate-400 opacity-0 ring-white/10 hover:text-gold focus:opacity-100 group-hover:opacity-100 coarse:opacity-100'
            }`}
        >
          {want ? '★' : '☆'}
        </button>

        {foil > 0 && (
          <span className="absolute bottom-1.5 right-1.5 chip bg-amber-400/90 text-space-950 ring-amber-200">
            ✦ {foil}
          </span>
        )}

        {/* Hover quick-stepper */}
        {owned && (
          <div
            className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded-lg bg-space-950/80
              px-0.5 opacity-0 ring-1 ring-white/10 backdrop-blur-sm transition group-hover:opacity-100
              focus-within:opacity-100 coarse:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="One fewer copy"
              onClick={() => adjustQty(card.id, -1)}
              className="h-6 w-6 rounded text-slate-200 hover:text-white"
            >
              −
            </button>
            <span className="w-5 text-center text-xs font-semibold tabular-nums">{qty}</span>
            <button
              type="button"
              aria-label="One more copy"
              onClick={() => adjustQty(card.id, 1)}
              className="h-6 w-6 rounded text-slate-200 hover:text-white"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="px-1 pb-0.5 pt-1.5">
        <div className="flex items-center gap-1">
          {card.uniqueness && (
            <span className="text-[11px] leading-none text-gold" title="Unique">
              {uniquenessDots(card.uniqueness)}
            </span>
          )}
          <p className="truncate text-[13px] font-medium text-slate-100" title={card.title}>
            {card.title}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-1">
          <span className={`chip ${side.soft}`} title={side.label}>
            {set?.abbr ?? card.set}
          </span>
          <span className={`chip ${rarityClasses(card.rarity)}`} title={rarityMeta(card.rarity).label}>
            {card.rarity}
          </span>
          <span className="ml-auto truncate text-[11px] text-slate-500">{card.type}</span>
        </div>
      </div>
    </div>
  );
}

const CardTile = memo(CardTileBase);
export default CardTile;
