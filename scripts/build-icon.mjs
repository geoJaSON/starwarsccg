// Generate the Android launcher icon set from brand-coloured SVGs.
// A gold ✦ sparkle (the app's logo glyph) on a deep-space gradient.
//
//   node scripts/build-icon.mjs
//
// Writes adaptive foreground/background + legacy square/round icons at every
// density, and a 1024px master to assets/icon.png for reference.

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

// Brand palette (tailwind.config.js)
const GOLD = '#f2c14e';
const GOLD_HI = '#ffd76b';
const GOLD_LO = '#c79a2e';

// A 4-point sparkle centred at 512,512 (outer radius 300, sharp inner cusps).
const SPARKLE =
  'M512 212 L567 457 L812 512 L567 567 L512 812 L457 567 L212 512 L457 457 Z';

const backgroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="78%">
      <stop offset="0%" stop-color="#1b2130"/>
      <stop offset="55%" stop-color="#0a0c12"/>
      <stop offset="100%" stop-color="#05060a"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <g fill="#ffffff">
    <circle cx="210" cy="300" r="3" opacity="0.5"/>
    <circle cx="804" cy="244" r="2.5" opacity="0.4"/>
    <circle cx="700" cy="720" r="3" opacity="0.35"/>
    <circle cx="300" cy="784" r="2" opacity="0.45"/>
    <circle cx="850" cy="600" r="2" opacity="0.3"/>
    <circle cx="168" cy="560" r="2" opacity="0.3"/>
    <circle cx="560" cy="170" r="1.8" opacity="0.35"/>
  </g>
</svg>`;

const sparkleDefs = `
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${GOLD_HI}"/>
      <stop offset="55%" stop-color="${GOLD}"/>
      <stop offset="100%" stop-color="${GOLD_LO}"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>`;

const sparkle = `
  <circle cx="512" cy="512" r="330" fill="url(#halo)"/>
  <path d="${SPARKLE}" fill="url(#g)" stroke="${GOLD_HI}" stroke-width="6" stroke-linejoin="round"/>`;

// Transparent foreground (adaptive). Art stays within the centre safe zone.
const foregroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>${sparkleDefs}</defs>${sparkle}
</svg>`;

// Full-bleed master for the legacy (pre-API 26) square/round icons.
const masterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>${sparkleDefs}</defs>
  ${backgroundSvg.replace(/<\/?svg[^>]*>/g, '')}
  ${sparkle}
</svg>`;

const ADAPTIVE = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
const LEGACY = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png().toBuffer();

const circleMask = (size) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );

async function main() {
  // Adaptive layers
  for (const [d, size] of Object.entries(ADAPTIVE)) {
    const dir = path.join(RES, `mipmap-${d}`);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'ic_launcher_foreground.png'), await png(foregroundSvg, size));
    await writeFile(path.join(dir, 'ic_launcher_background.png'), await png(backgroundSvg, size));
  }

  // Legacy square + round
  for (const [d, size] of Object.entries(LEGACY)) {
    const dir = path.join(RES, `mipmap-${d}`);
    await mkdir(dir, { recursive: true });
    const square = await png(masterSvg, size);
    await writeFile(path.join(dir, 'ic_launcher.png'), square);
    const round = await sharp(square)
      .composite([{ input: circleMask(size), blend: 'dest-in' }])
      .png()
      .toBuffer();
    await writeFile(path.join(dir, 'ic_launcher_round.png'), round);
  }

  // Point the adaptive icons at the gradient background mipmap.
  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  const anydpi = path.join(RES, 'mipmap-anydpi-v26');
  await mkdir(anydpi, { recursive: true });
  await writeFile(path.join(anydpi, 'ic_launcher.xml'), adaptiveXml);
  await writeFile(path.join(anydpi, 'ic_launcher_round.xml'), adaptiveXml);

  // Reference master + Play Store icon (512px, handy if you ever publish).
  await mkdir(path.join(ROOT, 'assets'), { recursive: true });
  await writeFile(path.join(ROOT, 'assets', 'icon.png'), await png(masterSvg, 1024));
  await writeFile(path.join(ROOT, 'android', 'app', 'src', 'main', 'ic_launcher-playstore.png'), await png(masterSvg, 512));

  console.log('Icon set written to', path.relative(ROOT, RES));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
