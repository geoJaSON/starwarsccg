import { useEffect, useRef, useState } from 'react';
import type { Card } from '@/types';
import { useUi } from '@/store/ui';
import { useCollection } from '@/store/collection';
import { rarityClasses, rarityMeta } from '@/lib/rarity';
import { captureCard, ensureCameraPermission } from '@/lib/scan/capture';
import { identify, type Candidate } from '@/lib/scan/identify';
import { loadReferenceHashes } from '@/lib/scan/dhash';
import { matchByText, type TitleIndexEntry } from '@/lib/scan/match';
import CardImage from './CardImage';

const HASHES_URL = import.meta.env.BASE_URL.replace(/\/$/, '') + '/data/hashes.json';

type Phase = 'idle' | 'working' | 'results' | 'error';

function confidenceLabel(score: number): { text: string; cls: string } {
  if (score >= 0.8) return { text: 'High match', cls: 'bg-green-500/20 text-green-300 ring-green-500/40' };
  if (score >= 0.6) return { text: 'Likely', cls: 'bg-gold/20 text-gold ring-gold/40' };
  return { text: 'Maybe', cls: 'bg-space-700 text-slate-400 ring-space-600' };
}

interface Props {
  index: TitleIndexEntry[];
  onClose: () => void;
}

export default function ScanModal({ index, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [ocrAvailable, setOcrAvailable] = useState(true);
  const [manual, setManual] = useState('');
  const [added, setAdded] = useState<Record<number, number>>({});

  const adjustQty = useCollection((s) => s.adjustQty);
  const entries = useCollection((s) => s.entries);
  const select = useUi((s) => s.select);
  const startedRef = useRef(false);

  async function scan() {
    setError(null);
    setPhase('working');
    try {
      if (!(await ensureCameraPermission())) {
        setError('Camera permission was denied. Enable it in Settings to scan cards.');
        setPhase('error');
        return;
      }
      const capture = await captureCard();
      setPreview(capture.previewUrl);
      setOcrAvailable(capture.ocrAvailable);
      const refHashes = await loadReferenceHashes(HASHES_URL);
      const results = identify(capture, index, refHashes);
      setCandidates(results);
      setPhase('results');
    } catch (e) {
      // A user-cancelled camera prompt rejects — treat as a quiet return to idle.
      const msg = e instanceof Error ? e.message : String(e);
      if (/cancel/i.test(msg)) {
        setPhase('idle');
        return;
      }
      setError(msg);
      setPhase('error');
    }
  }

  // Auto-launch the camera the first time the modal opens.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  function add(card: Card) {
    adjustQty(card.id, 1);
    setAdded((a) => ({ ...a, [card.id]: (a[card.id] ?? 0) + 1 }));
  }

  const manualResults = manual.trim() ? matchByText([manual], index, { limit: 12, minScore: 0.3 }) : [];
  const list = manual.trim() ? manualResults : candidates;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-space-950/85 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="panel my-auto w-full max-w-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Scan a card"
      >
        <div className="flex items-center justify-between border-b border-space-700 px-5 py-3">
          <h2 className="font-display text-lg font-bold text-white">
            ⊹ Scan a card
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-space-700 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-5">
          {phase === 'working' && (
            <div className="grid place-items-center py-16 text-center">
              <div className="mb-3 animate-pulse text-3xl">⊹</div>
              <p className="text-slate-400">Reading the card…</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="grid place-items-center py-8 text-center">
              <p className="max-w-sm text-dark-bright">{error}</p>
              <button className="btn-outline mt-4" onClick={scan}>
                ↻ Try again
              </button>
              <p className="mt-6 text-xs text-slate-500">…or add a card by searching its title:</p>
            </div>
          )}

          {(phase === 'results' || phase === 'error') && (
            <div className="space-y-4">
              {phase === 'results' && (
              <div className="flex items-center gap-3">
                {preview && (
                  <img
                    src={preview}
                    alt="Captured card"
                    className="h-20 w-16 shrink-0 rounded-md object-cover ring-1 ring-space-600"
                  />
                )}
                <div className="min-w-0 text-sm text-slate-400">
                  {list.length > 0 ? (
                    <>
                      Best guesses below — tap <span className="text-gold">＋</span> to add a copy to your
                      collection.
                    </>
                  ) : (
                    <>No confident match. Try again with better lighting, or search by title below.</>
                  )}
                  {!ocrAvailable && (
                    <div className="mt-1 text-[11px] text-slate-500">
                      On-device text recognition isn’t available here — matching by image only.
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Manual fallback search */}
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="Not right? Type part of the title…"
                className="input w-full"
              />

              <ul className="space-y-2">
                {list.map(({ card, score }) => {
                  const conf = confidenceLabel(score);
                  const owned = entries[card.id]?.qty ?? 0;
                  const justAdded = added[card.id];
                  return (
                    <li
                      key={card.id}
                      className="flex items-center gap-3 rounded-lg border border-space-700 bg-space-850/60 p-2"
                    >
                      <button
                        onClick={() => select(card.id)}
                        className="shrink-0"
                        aria-label={`View ${card.title}`}
                      >
                        <CardImage src={card.imageUrl} alt={card.title} className="h-20 w-[57px] rounded" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-white">{card.title}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className={`chip ${conf.cls}`}>{conf.text}</span>
                          <span className={`chip ${rarityClasses(card.rarity)}`}>
                            {rarityMeta(card.rarity).label}
                          </span>
                          <span className="text-[11px] text-slate-500">{card.type}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          Owned: {owned}
                          {justAdded ? <span className="ml-1 text-green-400">(+{justAdded})</span> : null}
                        </div>
                      </div>
                      <button
                        onClick={() => add(card)}
                        className="btn-gold shrink-0"
                        aria-label={`Add a copy of ${card.title}`}
                      >
                        ＋ Add
                      </button>
                    </li>
                  );
                })}
              </ul>

              <button className="btn-outline w-full" onClick={scan}>
                ⊹ Scan another card
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
