import type { Card } from '@/types';
import { matchByText, type Candidate, type TitleIndexEntry } from './match';
import { hashSimilarity } from './dhash';
import type { ScanCapture } from './capture';

/**
 * Combine the OCR title match with the card-art fingerprint into a single
 * ranked candidate list.
 *
 *  - With OCR text: title match finds candidates, then the dHash re-ranks
 *    them (decisive when several printings share a title).
 *  - Without OCR (e.g. web with no ML Kit): fall back to pure image-hash
 *    similarity across the whole catalogue.
 */
/**
 * Trim a ranked list to the candidates worth showing: only those within `gap`
 * of the best score, capped at `limit`. A clear winner yields one or two
 * results; genuine ambiguity (e.g. same-title reprints) yields a few.
 */
function topCluster(ranked: Candidate[], limit: number, gap: number): Candidate[] {
  if (!ranked.length) return ranked;
  const top = ranked[0].score;
  return ranked.filter((c) => c.score >= top - gap).slice(0, limit);
}

export function identify(
  capture: ScanCapture,
  index: TitleIndexEntry[],
  refHashes: Record<number, string> | null,
  opts: { limit?: number } = {}
): Candidate[] {
  const { limit = 6 } = opts;

  if (capture.lines.length) {
    const byText = matchByText(capture.lines, index, { limit: 20 });
    if (!refHashes) return topCluster(byText, limit, 0.12);

    // Blend title confidence (primary) with art similarity (disambiguator).
    const blended = byText.map(({ card, score }) => {
      const ref = refHashes[card.id];
      const art = ref ? hashSimilarity(capture.dhash, ref) : 0;
      return { card, score: 0.72 * score + 0.28 * art };
    });
    blended.sort((a, b) => b.score - a.score);
    return topCluster(blended, limit, 0.1);
  }

  // Image-only fallback (no OCR): art hash is weaker, so keep a wider net.
  if (refHashes) {
    const ranked: Candidate[] = [];
    for (const entry of index) {
      const ref = refHashes[entry.card.id];
      if (ref) ranked.push({ card: entry.card, score: hashSimilarity(capture.dhash, ref) });
    }
    ranked.sort((a, b) => b.score - a.score);
    return ranked.slice(0, Math.max(limit, 10));
  }

  return [];
}

export type { Candidate, Card };
