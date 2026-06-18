/**
 * Difference hash (dHash) for card-art disambiguation.
 *
 * After OCR narrows the scan to a few same-/similar-title candidates, we
 * compare the captured frame's art against the reference catalogue images to
 * pick the closest printing. dHash is cheap, computable in-browser from a
 * canvas, and reasonably robust to lighting/scale (less so to perspective —
 * hence it only *re-ranks* OCR candidates rather than identifying outright).
 *
 * Reference hashes for every catalogue image are precomputed by
 * `scripts/build-hashes.mjs` into `public/data/hashes.json` ({ [id]: hex }).
 */

const W = 9; // sample grid is (W-1) x H comparisons -> 64 bits
const H = 8;

/** Compute a 64-bit dHash (16-char hex) from a canvas-drawable source. */
export function dhashFromImage(img: CanvasImageSource): string {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);

  // Row-wise: is each pixel brighter than the one to its right?
  let bits = 0n;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W - 1; x++) {
      const i = (y * W + x) * 4;
      const j = (y * W + x + 1) * 4;
      const l1 = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const l2 = data[j] * 0.299 + data[j + 1] * 0.587 + data[j + 2] * 0.114;
      bits = (bits << 1n) | (l1 > l2 ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, '0');
}

/** Hamming distance between two 16-char hex hashes (0 = identical, 64 = opposite). */
export function hamming(a: string, b: string): number {
  let x = BigInt('0x' + a) ^ BigInt('0x' + b);
  let count = 0;
  while (x) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
}

/** Similarity in [0,1] from a Hamming distance over 64 bits. */
export function hashSimilarity(a: string, b: string): number {
  return 1 - hamming(a, b) / 64;
}

let hashesPromise: Promise<Record<number, string>> | null = null;

/** Lazily load the precomputed reference hashes (null if not generated yet). */
export async function loadReferenceHashes(assetUrl: string): Promise<Record<number, string> | null> {
  if (!hashesPromise) {
    hashesPromise = fetch(assetUrl)
      .then((r) => (r.ok ? (r.json() as Promise<Record<number, string>>) : null))
      .catch(() => null) as Promise<Record<number, string>>;
  }
  return hashesPromise;
}
