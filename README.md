# BriefKlar

**Scan any German letter. Know exactly what to do. Never miss a deadline.**

BriefKlar is a desktop app for people navigating German bureaucracy — immigrants, expats, international students, and anyone who has ever stared at an official German letter and had no idea what it means or what happens if they ignore it.

Scan a letter with your phone. Get an instant plain-language explanation, the deadline, and exactly what to do next — in seconds, fully offline, on your own computer.

---

## Why this exists

Germany sends letters for everything. Tax assessments. Court orders. Health insurance decisions. Landlord terminations. Each one has a different deadline, a different consequence for ignoring it, and a different authority to respond to — all written in dense legal German.

Missing a deadline in Germany is serious. A Mahnbescheid ignored for 14 days becomes an enforcement order. A Steuerbescheid unchallenged for 1 month becomes legally final. A Kündigungsschutzklage missed by a day means you permanently lose the right to contest your dismissal.

BriefKlar solves this.

---

## Features

- **Scan via phone** — open a QR code on your desktop, take a photo from your phone camera, done
- **OCR + classification** — Tesseract.js with German language model identifies 26 letter types
- **Plain-language explanations** — what this letter is, what to do, what happens if you ignore it
- **Deadline detection** — extracts deadlines from the letter text; applies the § 122 AO 3-Tages-Fiktion (letters are legally deemed delivered 3 days after postmark, not when you receive them)
- **Reference number extraction** — USt-IdNr, Steuernummer, Aktenzeichen, IBAN
- **Free help resources** — per letter type: Caritas MBE, VdK, Schuldnerberatung, Mieterverein, and more
- **Fully offline** — no cloud, no API key, no subscription, no data leaves your computer
- **Windows installer** — one `.exe`, installs in seconds

---

## Letter Types Covered

| Category | Letter Types |
|---|---|
| **Tax** | Einkommensteuerbescheid, Umsatzsteuerbescheid, Grundsteuerbescheid, Gewerbesteuerbescheid, Kfz-Steuer, USt-IdNr, Steuer-ID |
| **Debt & Enforcement** | Mahnung, Inkasso, Mahnbescheid, Pfändungs- und Überweisungsbeschluss |
| **Courts** | Gerichtsbescheid / Vollstreckungsbescheid |
| **Social Benefits** | Jobcenter (Bewilligung / Aufhebung / Sanktion), Krankenkasse, Rentenversicherung, Elterngeld, Wohngeld, BAföG, Kindergeld |
| **Immigration** | Ausländerbehörde, Einbürgerungsbescheid |
| **Family** | Kita / Kindergarten Bescheid |
| **Housing** | Vermieter Kündigung, Nebenkostenabrechnung |
| **Employment** | Arbeitgeberkündigung (3-week Kündigungsschutzklage alert) |
| **Utilities & Other** | Strom/Gas/Internet, Rundfunkbeitrag, Rechnung, Versicherung, Bank |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Electron](https://www.electronjs.org/) v41 |
| Build tooling | [electron-vite](https://electron-vite.org/) |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| OCR | [Tesseract.js](https://tesseract.projectnaptha.com/) with `deu.traineddata` |
| Image processing | [Sharp](https://sharp.pixelplumbing.com/) — denoise, contrast, sharpen |
| Database | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (local, offline) |
| Mobile handoff | Local HTTP server + QR code (same WiFi) |
| Installer | NSIS via electron-builder |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Windows 10/11 (installer target; dev works on macOS/Linux too)
- German Tesseract language data (`deu.traineddata`)

### Install dependencies

```bash
npm install
```

### Tessdata setup

BriefKlar needs the German OCR model (`deu.traineddata`, ~15 MB). On first launch, the app automatically copies it from your system tessdata folder if available.

If you don't have it:

```bash
# Windows — download and place at:
C:\Users\<you>\AppData\Roaming\tessdata\deu.traineddata

# Or download directly:
# https://github.com/tesseract-ocr/tessdata/raw/main/deu.traineddata
```

### Run in development

```bash
npm run dev
```

### Build Windows installer

Close any running dev instance first, then:

```bash
npm run build:win
```

Installer output: `dist/BriefKlar Setup 0.1.0.exe`

> **Note:** The app is currently unsigned. Windows SmartScreen will show a warning on first run — click "More info" → "Run anyway".

---

## Project Structure

```
briefklar/
├── knowledge-base/
│   └── letters.json          # 26 letter type definitions (patterns, actions, deadlines)
├── resources/
│   └── tessdata/             # German OCR model (gitignored — copy manually)
├── scripts/
│   ├── dev.js                # Dev server (clears ELECTRON_RUN_AS_NODE)
│   └── build.js              # Build script (electron-vite → electron-builder)
└── src/
    ├── main/
    │   ├── index.ts           # App lifecycle, IPC, tessdata setup
    │   ├── pattern-matcher.ts # Letter classification + field extraction
    │   ├── image-processor.ts # Sharp image pipeline + Tesseract OCR
    │   ├── handoff-server.ts  # Mobile scan server + QR code
    │   └── db.ts              # SQLite schema and queries
    ├── renderer/src/
    │   ├── App.tsx            # Router and page layout
    │   ├── pages/             # Dashboard, LetterView, Settings, Welcome
    │   └── components/        # ScanModal, ReplyEditor, Sidebar, etc.
    └── shared/
        └── types.ts           # Shared TypeScript interfaces
```

---

## How Classification Works

1. OCR extracts raw text from the scanned image
2. The pattern matcher scores each of the 26 letter types based on:
   - **Sender patterns** (×3 weight) — institution names
   - **Subject patterns** (×4 weight) — Betreff line keywords
   - **Body patterns** (×2 weight) — legal references, key phrases
3. The highest-scoring type above the confidence threshold wins
4. Field extractors pull: sender, amount (Nachzahlung/Erstattung priority), deadline (3-Tages-Fiktion applied), Betreff, reference numbers

The classifier is rule-based and runs entirely offline in ~50ms after OCR completes.

---

## Known Limitations

- OCR quality depends heavily on photo quality — blurry or low-light photos produce poor results
- The app is currently Windows-only (installer); macOS/Linux builds are possible but untested
- Not code-signed — Windows SmartScreen warning on first run
- German letters only (English and other languages not supported)

---

## Roadmap

- [ ] "Was this classification wrong?" feedback button to improve accuracy over time
- [ ] Calendar reminder integration (add deadline to Windows calendar)
- [ ] Reply template drafting (Einspruch, Widerspruch letters)
- [ ] macOS build
- [ ] Code signing for seamless installation

---

## Contributing

This project is in active early development. If you scan a letter and the classification is wrong, or you know of a letter type that should be added, please open an issue.

All German letter type additions go in `knowledge-base/letters.json`. See existing entries for the schema.

---

## License

MIT © 2026 Maria Fe Fischer

---

*Built for everyone who has ever received a German letter and thought: "what does this even mean?"*
