import type { Card } from '@/types';

/**
 * Fuzzy matching of OCR'd card text against the catalogue.
 *
 * SWCCG cards have no barcode, so we identify a card by reading its printed
 * title with on-device OCR and fuzzy-matching it to the ~2,500 catalogue
 * titles. The title is the strong signal; the rest of the OCR'd text (game
 * text / lore) is used only as a weak tiebreaker between same-title printings.
 */

export interface Candidate {
  card: Card;
  /** 0–1 confidence that this card matches the scanned text. */
  score: number;
}

/** Lowercase, strip accents and punctuation, collapse whitespace. */
export function normalize(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function tokens(s: string): string[] {
  return s ? s.split(' ').filter(Boolean) : [];
}

/** Levenshtein distance (iterative, two-row). */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    const ai = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cost = ai === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Similarity ratio in [0,1] from edit distance. */
function ratio(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  return max === 0 ? 1 : 1 - levenshtein(a, b) / max;
}

export interface TitleIndexEntry {
  card: Card;
  title: string;
  tokens: string[];
}

/** Precompute normalized titles once per catalogue load. */
export function buildTitleIndex(cards: Card[]): TitleIndexEntry[] {
  return cards.map((card) => {
    const title = normalize(card.title);
    return { card, title, tokens: tokens(title) };
  });
}

/** A normalized OCR line plus its token set, for per-line scoring. */
interface ScoreLine {
  text: string;
  tokenSet: Set<string>;
  tokenCount: number;
}

/**
 * Score one card title against the OCR lines.
 *
 * The printed title is a single (sometimes two-line) run of text near the top
 * of the card, so we score each line *independently* and take the best — never
 * pooling tokens across the whole card. Three per-line views, max wins:
 *  - whole-line fuzzy ratio (title ≈ line, tolerant of OCR noise),
 *  - containment scaled by length (a title buried in a long lore line scores
 *    low; a line that *is* the title scores high),
 *  - token coverage × precision (every title word is on the line, and the line
 *    is mostly the title — not a lore sentence that happens to contain them).
 */
function scoreTitle(entry: TitleIndexEntry, lines: ScoreLine[]): number {
  if (!entry.title) return 0;
  let best = 0;

  for (const line of lines) {
    const r = ratio(entry.title, line.text);
    if (r > best) best = r;

    if (line.text.includes(entry.title)) {
      const s = entry.title.length / line.text.length; // 1.0 when the line is exactly the title
      if (s > best) best = s;
    }

    if (entry.tokens.length && line.tokenCount) {
      let hit = 0;
      for (const t of entry.tokens) if (line.tokenSet.has(t)) hit++;
      if (hit) {
        const coverage = hit / entry.tokens.length; // how much of the title we found
        const precision = hit / line.tokenCount; // how much of the line is the title
        const s = coverage * precision;
        if (s > best) best = s;
      }
    }
  }

  return best;
}

/**
 * Rank catalogue cards by how well their title matches the OCR text.
 * Returns the top candidates above a minimum confidence, best first.
 */
export function matchByText(
  ocrLines: string[],
  index: TitleIndexEntry[],
  opts: { limit?: number; minScore?: number } = {}
): Candidate[] {
  const { limit = 12, minScore = 0.5 } = opts;
  const normLines = ocrLines.map(normalize).filter(Boolean);
  if (!normLines.length) return [];

  // Score against each line, plus adjacent pairs so titles that OCR wrapped
  // onto two lines (e.g. "A Disturbance In / The Force") still match cleanly.
  const texts = [...normLines];
  for (let i = 0; i < normLines.length - 1; i++) texts.push(`${normLines[i]} ${normLines[i + 1]}`);
  const lines: ScoreLine[] = texts.map((text) => {
    const toks = tokens(text);
    return { text, tokenSet: new Set(toks), tokenCount: toks.length };
  });

  const scored: Candidate[] = [];
  for (const entry of index) {
    const score = scoreTitle(entry, lines);
    if (score >= minScore) scored.push({ card: entry.card, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
