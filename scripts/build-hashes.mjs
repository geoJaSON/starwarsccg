// Precompute perceptual (dHash) fingerprints of every catalogue card image.
//
// The camera-scan feature uses these to disambiguate cards whose titles OCR
// to the same/similar text (e.g. reprints across sets) by comparing the
// captured frame's art to each candidate's reference art.
//
// The hash algorithm here MUST mirror src/lib/scan/dhash.ts: a 9x8 grayscale
// resample, comparing each pixel to its right neighbour, MSB first, 64 bits.
//
// Output: public/data/hashes.json  ->  { [cardId]: "<16-char hex>" }
//
// Resumable: re-running skips ids already present, so transient image
// download failures can be retried without re-fetching everything.
//
//   node scripts/build-hashes.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARDS = path.join(ROOT, 'public', 'data', 'cards.json');
const OUT = path.join(ROOT, 'public', 'data', 'hashes.json');

const W = 9;
const H = 8;
const CONCURRENCY = 10;
const FETCH_TIMEOUT_MS = 20_000;

async function dhash(buf) {
  const { data } = await sharp(buf)
    .removeAlpha()
    .resize(W, H, { fit: 'fill', kernel: 'cubic' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // After grayscale + removeAlpha, raw() yields 1 byte per pixel.
  let bits = 0n;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W - 1; x++) {
      const l1 = data[y * W + x];
      const l2 = data[y * W + x + 1];
      bits = (bits << 1n) | (l1 > l2 ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, '0');
}

async function fetchImage(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const cards = JSON.parse(await readFile(CARDS, 'utf8'));
  const hashes = existsSync(OUT) ? JSON.parse(await readFile(OUT, 'utf8')) : {};
  const todo = cards.filter((c) => c.imageUrl && !hashes[c.id]);

  console.log(`${cards.length} cards · ${Object.keys(hashes).length} already hashed · ${todo.length} to do`);

  let done = 0;
  let failed = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < todo.length) {
      const card = todo[cursor++];
      try {
        const buf = await fetchImage(card.imageUrl);
        hashes[card.id] = await dhash(buf);
      } catch (e) {
        failed++;
        console.warn(`  ! ${card.id} ${card.title}: ${e.message}`);
      }
      if (++done % 100 === 0) {
        process.stdout.write(`  …${done}/${todo.length}\n`);
        await writeFile(OUT, JSON.stringify(hashes)); // periodic checkpoint
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await writeFile(OUT, JSON.stringify(hashes));

  console.log(`Done. ${Object.keys(hashes).length} hashes written to ${path.relative(ROOT, OUT)} (${failed} failed).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
