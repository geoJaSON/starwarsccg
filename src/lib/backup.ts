import type { CollectionEntry, Condition } from '@/types';

const CONDITIONS: Condition[] = ['M', 'NM', 'EX', 'VG', 'GD', 'PR'];

export interface BackupFile {
  app: 'swccg-catalogue';
  version: 1;
  exportedAt: string;
  count: number;
  entries: Record<string, CollectionEntry>;
}

export function buildBackup(
  entries: Record<number, CollectionEntry>,
  now: string
): BackupFile {
  return {
    app: 'swccg-catalogue',
    version: 1,
    exportedAt: now,
    count: Object.keys(entries).length,
    entries: entries as Record<string, CollectionEntry>,
  };
}

function sanitizeEntry(raw: unknown): CollectionEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  // Coerce first so numeric strings ("3") from hand-edited files survive,
  // while NaN / objects still fall back to 0.
  const q = Number(r.qty);
  const qty = Number.isFinite(q) ? Math.max(0, Math.floor(q)) : 0;
  const f = Number(r.foil);
  const foilRaw = Number.isFinite(f) ? Math.max(0, Math.floor(f)) : 0;
  const want = r.want === true;
  const condition =
    typeof r.condition === 'string' && CONDITIONS.includes(r.condition as Condition)
      ? (r.condition as Condition)
      : undefined;
  const notes = typeof r.notes === 'string' && r.notes.trim() ? r.notes.slice(0, 2000) : undefined;

  const entry: CollectionEntry = { qty };
  if (foilRaw > 0) entry.foil = foilRaw;
  if (want) entry.want = true;
  if (condition) entry.condition = condition;
  if (notes) entry.notes = notes;

  const empty = qty <= 0 && foilRaw <= 0 && !want && !condition && !notes;
  return empty ? null : entry;
}

/** Parse + sanitize an imported backup. Throws on a clearly invalid file. */
export function parseBackup(text: string): Record<number, CollectionEntry> {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Not a valid JSON file.');
  }
  const obj = data as Record<string, unknown>;
  const rawEntries =
    obj && typeof obj === 'object' && obj.entries && typeof obj.entries === 'object'
      ? (obj.entries as Record<string, unknown>)
      : null;
  if (!rawEntries) throw new Error('No "entries" found — is this a SWCCG Catalogue backup?');

  const out: Record<number, CollectionEntry> = {};
  for (const [key, value] of Object.entries(rawEntries)) {
    const id = Number(key);
    if (!Number.isFinite(id)) continue;
    const entry = sanitizeEntry(value);
    if (entry) out[id] = entry;
  }
  if (Object.keys(out).length === 0) throw new Error('Backup contained no collection entries.');
  return out;
}

export function mergeEntries(
  base: Record<number, CollectionEntry>,
  incoming: Record<number, CollectionEntry>
): Record<number, CollectionEntry> {
  const out = { ...base };
  for (const [key, inc] of Object.entries(incoming)) {
    const id = Number(key);
    const existing = out[id];
    if (!existing) {
      out[id] = inc;
      continue;
    }
    out[id] = {
      qty: Math.max(existing.qty ?? 0, inc.qty ?? 0),
      foil: Math.max(existing.foil ?? 0, inc.foil ?? 0) || undefined,
      want: existing.want || inc.want || undefined,
      condition: existing.condition ?? inc.condition,
      notes: existing.notes ?? inc.notes,
    };
  }
  return out;
}
