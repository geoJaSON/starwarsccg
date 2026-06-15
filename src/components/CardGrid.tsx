import { useEffect, useRef, useState } from 'react';
import type { Card, SetInfo, ViewMode } from '@/types';
import CardTile from './CardTile';
import CardListRow from './CardListRow';

interface Props {
  cards: Card[];
  setById: Map<string, SetInfo>;
  view: ViewMode;
}

const PAGE = 60;

export default function CardGrid({ cards, setById, view }: Props) {
  const [count, setCount] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement | null>(null);

  // Reset paging whenever the result set changes.
  useEffect(() => {
    setCount(PAGE);
  }, [cards]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCount((c) => (c < cards.length ? c + PAGE : c));
        }
      },
      { rootMargin: '800px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [cards.length]);

  const shown = cards.slice(0, count);

  if (cards.length === 0) return null;

  return (
    <>
      {view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {shown.map((card) => (
            <div key={card.id} className="cv-auto">
              <CardTile card={card} set={setById.get(card.set)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {shown.map((card) => (
            <div key={card.id} className="cv-row">
              <CardListRow card={card} set={setById.get(card.set)} />
            </div>
          ))}
        </div>
      )}

      {count < cards.length && (
        <div ref={sentinel} className="py-8 text-center text-sm text-slate-500">
          Loading more… ({count} of {cards.length})
        </div>
      )}
    </>
  );
}
