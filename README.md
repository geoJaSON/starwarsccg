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
- **📷 Camera scanning (Android)** — point your phone at a card to add it to your collection. On-device OCR reads the title and a perceptual-hash fingerprint of the art disambiguates same-title printings — all offline, no cloud.

## Android app

The web app is wrapped with [Capacitor](https://capacitorjs.com/) into a native Android app, which unlocks the camera-scan feature.

```bash
npm run build            # build the web assets into dist/
npx cap sync android     # copy assets + native plugins into the Android project
npx cap open android     # open in Android Studio, then Run ▶ on a device/emulator
```

Or build an APK from the command line:

```bash
cd android && ./gradlew assembleDebug   # -> android/app/build/outputs/apk/debug/app-debug.apk
```

Requirements: Android Studio + SDK. Gradle is pinned to Android Studio's bundled JDK 21 in `android/gradle.properties` (the Android Gradle Plugin doesn't support newer JDKs); adjust the path there if your install differs. `android/local.properties` (your SDK path) is generated per machine and git-ignored.

### How scanning works

1. The camera captures a photo (`@capacitor/camera`).
2. On-device **ML Kit** OCR reads the printed card title (offline, no network).
3. The title is fuzzy-matched against the ~2,500 catalogue titles to find candidates.
4. A **dHash** fingerprint of the captured art re-ranks candidates to pick the exact printing.
5. You confirm from a short ranked list and tap **＋** to add a copy to your collection.

There's a manual title-search fallback for tricky lighting, and on platforms without on-device OCR (e.g. the web build) it falls back to image-fingerprint matching alone.

The reference fingerprints ship in `public/data/hashes.json`. Regenerate them (downloads every card image once, ~64 KB output) with:

```bash
npm run build-hashes
```

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

React 19 · TypeScript · Vite · Tailwind CSS · Zustand · idb-keyval · Capacitor (Android) · ML Kit OCR.

---

Not affiliated with Decipher, the Star Wars CCG Players Committee, or Lucasfilm. Card data and images © their respective owners; used here for a personal, non-commercial collection tool.
