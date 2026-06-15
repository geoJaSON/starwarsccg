# SWCCG Catalogue

A personal collection tracker for the **original Decipher _Star Wars Customizable Card Game_** (1995–2001) — Premiere through Theed Palace, plus the two-player, anthology, enhanced and sealed-deck packs.

Track what you own (with quantities, foils, condition and notes), build a want list, search and filter the full ~2,500-card catalogue, and watch your set-completion percentages climb.

![Local-first](https://img.shields.io/badge/storage-local--first-gold) ![No backend](https://img.shields.io/badge/backend-none-blue)

## Features

- **Full Decipher catalogue** — 2,546 cards across 24 sets, with images, rarity, game text and lore.
- **Collection tracking** — copies owned, foil/premium copies, condition grade, free-text notes.
- **Want list** — flag cards you're hunting for.
- **Powerful filtering** — by set, side (Light/Dark), rarity, card type, and ownership status; full-text search across title, lore and game text.
- **Set completion** — live progress bars per set and overall.
- **Local-first & private** — everything is stored in your browser (IndexedDB). No account, no server.
- **Backup / restore** — one-click JSON export and import (merge or replace).
- **Card art** streamed on demand from the official `res.starwarsccg.org` image host.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Production build:

```bash
npm run build
npm run preview
```

Deploying under a subpath (e.g. GitHub Pages at `user.github.io/swccg/`)? Set the base:

```bash
VITE_BASE=/swccg/ npm run build
```

## Updating the card data

Card metadata lives in `public/data/{cards,sets.json}` and is generated from the
community [`swccgpc/swccg-card-json`](https://github.com/swccgpc/swccg-card-json)
database (the same data that powers swccgdb.com). To refresh it:

```bash
npm run build-cards
```

The script keeps only original Decipher physical releases (upstream set id `< 200`),
slims each card to the fields this app uses, and writes the bundled JSON. It uses
local files in `data/raw/` if present, otherwise fetches the latest from GitHub.

## Notes

- Card images are **hot-linked**, so an internet connection is needed to view art the first time (images are then browser-cached).
- Your collection lives only in this browser profile. Use **⚙ Backup → Export** regularly, and import the file on another device to move your collection.

## Tech

React 19 · TypeScript · Vite · Tailwind CSS · Zustand · idb-keyval.

---

Not affiliated with Decipher, the Star Wars CCG Players Committee, or Lucasfilm. Card data and images © their respective owners; used here for a personal, non-commercial collection tool.
