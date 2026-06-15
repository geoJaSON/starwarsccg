import { useRef, useState } from 'react';
import { useCollection } from '@/store/collection';
import { buildBackup, parseBackup, mergeEntries } from '@/lib/backup';
import type { CollectionEntry } from '@/types';

export default function BackupMenu({ onClose }: { onClose: () => void }) {
  const entries = useCollection((s) => s.entries);
  const replaceAll = useCollection((s) => s.replaceAll);
  const reset = useCollection((s) => s.reset);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [pending, setPending] = useState<Record<number, CollectionEntry> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const ownedCount = Object.keys(entries).length;

  function handleExport() {
    const backup = buildBackup(entries, new Date().toISOString());
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swccg-collection-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    try {
      const text = await file.text();
      setPending(parseBackup(text));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that file.');
    }
  }

  function applyImport(mode: 'merge' | 'replace') {
    if (!pending) return;
    replaceAll(mode === 'merge' ? mergeEntries(entries, pending) : pending);
    setPending(null);
    onClose();
  }

  return (
    <div className="absolute right-0 top-full z-40 mt-2 w-72 panel p-3 text-sm shadow-xl">
      <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">Backup &amp; restore</p>

      {pending ? (
        <div className="space-y-2">
          <p className="text-slate-300">
            Found <strong className="text-white">{Object.keys(pending).length}</strong> entries in
            the file.
          </p>
          <div className="flex flex-col gap-1.5">
            <button className="btn-outline" onClick={() => applyImport('merge')}>
              Merge with my {ownedCount} entries
            </button>
            <button className="btn-outline" onClick={() => applyImport('replace')}>
              Replace everything
            </button>
            <button className="btn-ghost" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <button className="btn-outline w-full" onClick={handleExport} disabled={ownedCount === 0}>
            ⭳ Export ({ownedCount})
          </button>
          <button className="btn-outline w-full" onClick={() => fileRef.current?.click()}>
            ⭱ Import from file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFile}
          />

          {confirmReset ? (
            <div className="rounded-lg border border-dark/40 bg-dark/10 p-2">
              <p className="mb-2 text-[13px] text-dark-bright">Erase your whole collection?</p>
              <div className="flex gap-1.5">
                <button
                  className="btn bg-dark/90 text-white hover:bg-dark-bright"
                  onClick={() => {
                    reset();
                    setConfirmReset(false);
                    onClose();
                  }}
                >
                  Yes, erase
                </button>
                <button className="btn-ghost" onClick={() => setConfirmReset(false)}>
                  Keep
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn-ghost w-full text-slate-500 hover:text-dark-bright"
              onClick={() => setConfirmReset(true)}
              disabled={ownedCount === 0}
            >
              Reset collection…
            </button>
          )}

          {error && <p className="text-[12px] text-dark-bright">{error}</p>}
          <p className="pt-1 text-[11px] leading-snug text-slate-500">
            Your collection is stored only in this browser. Export regularly to keep a backup.
          </p>
        </div>
      )}
    </div>
  );
}
