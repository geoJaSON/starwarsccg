// Builds the bundled catalogue data for the app.
//
// Source: https://github.com/swccgpc/swccg-card-json  (the data behind swccgdb.com)
// We keep ONLY original Decipher physical releases (1995–2001). In the upstream
// data every set has a numeric id; the physical Decipher sets are id < 200
// (1–14 = main sets Premiere→Theed Palace, 101–112 = 2-player/anthology/enhanced/
// sealed packs). Everything >= 200 is a community "Virtual"/Players-Committee set.
//
// Card images are hot-linked from res.starwarsccg.org at runtime, so we only
// store the URLs here — not the image bytes.
//
// Run:  npm run build-cards
// It reads ./data/raw/*.json if present (fast, offline), otherwise fetches the
// latest from GitHub. Output: ./public/data/cards.json and ./public/data/sets.json

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'data', 'raw');
const OUT_DIR = path.join(ROOT, 'public', 'data');
const BASE = 'https://raw.githubusercontent.com/swccgpc/swccg-card-json/master';

const STAT_FIELDS = [
  'deploy', 'destiny', 'power', 'forfeit', 'ability', 'armor',
  'maneuver', 'hyperspeed', 'landspeed', 'parsec', 'ferocity', 'politics',
];

const DECIPHER_MAX_SET_ID = 200; // strict less-than => physical Decipher only

async function load(name) {
  const local = path.join(RAW_DIR, name);
  try {
    const txt = await fs.readFile(local, 'utf8');
    console.log(`  · ${name}  (local data/raw)`);
    return JSON.parse(txt);
  } catch {
    const url = `${BASE}/${name}`;
    console.log(`  · ${name}  (fetching ${url})`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return res.json();
  }
}

const cleanTitle = (t) => (t || '').replace(/^[\s•◊<>※‹›]+/, '').trim();

function slim(card) {
  const f = card.front || {};
  const stats = {};
  for (const k of STAT_FIELDS) {
    if (f[k] !== undefined && f[k] !== null && String(f[k]).trim() !== '') {
      stats[k] = String(f[k]);
    }
  }
  const out = {
    id: card.id,
    gempId: card.gempId,
    title: cleanTitle(f.title),
    type: f.type || 'Unknown',
    side: card.side,
    rarity: card.rarity || '',
    set: String(card.set),
    imageUrl: f.imageUrl || '',
  };
  if (f.subType) out.subType = f.subType;
  if (f.uniqueness) out.uniqueness = f.uniqueness;
  if (Array.isArray(f.icons) && f.icons.length) out.icons = f.icons;
  if (f.gametext) out.gametext = f.gametext;
  if (f.lore) out.lore = f.lore;
  if (Object.keys(stats).length) out.stats = stats;
  if (card.back && card.back.imageUrl) out.backImageUrl = card.back.imageUrl;
  if (Array.isArray(card.abbr) && card.abbr.length) out.abbr = card.abbr.join(', ');
  return out;
}

const isDecipher = (setId) => {
  const n = Number.parseInt(setId, 10);
  return Number.isFinite(n) && n < DECIPHER_MAX_SET_ID;
};

async function main() {
  console.log('Loading upstream data…');
  const [darkRaw, lightRaw, setsRaw] = await Promise.all([
    load('Dark.json'),
    load('Light.json'),
    load('sets.json'),
  ]);

  const rawCards = [
    ...(darkRaw.cards || darkRaw),
    ...(lightRaw.cards || lightRaw),
  ];

  const cards = rawCards
    .filter((c) => c && c.front && c.front.imageUrl && isDecipher(c.set))
    .map(slim)
    .sort((a, b) => {
      const sa = Number.parseInt(a.set, 10);
      const sb = Number.parseInt(b.set, 10);
      if (sa !== sb) return sa - sb;
      if (a.side !== b.side) return a.side.localeCompare(b.side);
      return a.title.localeCompare(b.title);
    });

  const counts = {};
  for (const c of cards) counts[c.set] = (counts[c.set] || 0) + 1;

  const sets = setsRaw
    .filter((s) => isDecipher(s.id) && !s.legacy && counts[String(s.id)] > 0)
    .map((s) => ({
      id: String(s.id),
      name: s.name,
      abbr: s.abbr,
      release: s.date_release && s.date_release !== '0000-00-00' ? s.date_release : null,
      position: s.position,
      count: counts[String(s.id)],
    }))
    .sort((a, b) => a.position - b.position);

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUT_DIR, 'cards.json'), JSON.stringify(cards));
  await fs.writeFile(path.join(OUT_DIR, 'sets.json'), JSON.stringify(sets, null, 2));

  const byRarity = {};
  for (const c of cards) byRarity[c.rarity] = (byRarity[c.rarity] || 0) + 1;

  console.log(`\nWrote ${cards.length} cards across ${sets.length} sets to public/data/`);
  console.log('Sets:', sets.map((s) => `${s.abbr}(${s.count})`).join(' '));
  console.log('Rarities:', JSON.stringify(byRarity));
}

main().catch((err) => {
  console.error('\nbuild-cards failed:', err);
  process.exit(1);
});
