import { useEffect, useRef, useState } from 'react';
import { pct } from '@/lib/format';
import BackupMenu from './BackupMenu';

export interface CollectionStats {
  ownedDistinct: number;
  totalCards: number;
  copies: number;
  wantCount: number;
}

export default function Header({ stats }: { stats: CollectionStats }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const percent = pct(stats.ownedDistinct, stats.totalCards);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <header className="border-b border-space-800 bg-space-950/60">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-gold/30 to-dark/20 ring-1 ring-gold/30">
            <span className="text-lg">✦</span>
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-lg font-bold tracking-wide text-white">
              SWCCG <span className="text-gold">Catalogue</span>
            </h1>
            <p className="hidden text-[11px] text-slate-500 sm:block">
              Star Wars CCG · Decipher era (1995–2001)
            </p>
          </div>
        </div>

        {/* Completion */}
        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div className="text-right leading-tight">
            <div className="text-sm font-semibold tabular-nums text-white">
              {stats.ownedDistinct.toLocaleString()}
              <span className="font-normal text-slate-500"> / {stats.totalCards.toLocaleString()}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {stats.copies.toLocaleString()} copies · {stats.wantCount} wanted
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-space-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="w-9 text-right text-sm font-semibold tabular-nums text-gold">
              {percent}%
            </span>
          </div>
        </div>

        <div className="relative md:ml-2" ref={wrapRef}>
          <button className="btn-outline" onClick={() => setMenuOpen((v) => !v)}>
            ⚙ Backup
          </button>
          {menuOpen && <BackupMenu onClose={() => setMenuOpen(false)} />}
        </div>
      </div>

      {/* Compact completion bar for small screens */}
      <div className="flex items-center gap-2 px-4 pb-2 md:hidden">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-space-700">
          <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-xs tabular-nums text-slate-400">
          {stats.ownedDistinct}/{stats.totalCards} · {percent}%
        </span>
      </div>
    </header>
  );
}
