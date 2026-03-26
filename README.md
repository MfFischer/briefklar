<div align="center">

<br />

# 📬 BriefKlar

### Scan any German letter. Know exactly what to do. Never miss a deadline.

<br />

[![Version](https://img.shields.io/badge/version-0.1.0-blue?style=flat-square)](https://github.com/MfFischer/briefklar/releases)
[![Platform](https://img.shields.io/badge/platform-Windows-0078d4?style=flat-square&logo=windows)](https://github.com/MfFischer/briefklar/releases)
[![Electron](https://img.shields.io/badge/Electron-41-47848f?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Made with ❤️](https://img.shields.io/badge/made%20with-%E2%9D%A4%EF%B8%8F-red?style=flat-square)](https://github.com/MfFischer/briefklar)

<br />

> Germany sends letters for everything — taxes, courts, landlords, immigration.
> Each one has a deadline. Most consequences are permanent if you miss it.
> **BriefKlar tells you what the letter is, what to do, and how long you have.**

<br />

<!-- Screenshot placeholder — replace with actual app screenshot -->
<img src="https://placehold.co/900x560/f8fafc/64748b?text=BriefKlar+App+Screenshot" alt="BriefKlar App" width="860" style="border-radius: 12px;" />

<br /><br />

</div>

---

## The Problem

Germany sends official letters that look like this:

> *"Gemäß § 355 Abs. 1 AO steht Ihnen gegen diesen Bescheid der Einspruch zu. Der Einspruch ist innerhalb eines Monats nach Bekanntgabe dieses Bescheids einzulegen."*

For millions of immigrants, expats, and international students — **this is unreadable.** And the consequences of ignoring it are severe:

| Letter | Ignored for | Result |
|---|---|---|
| Steuerbescheid | 1 month | You permanently lose the right to contest — even if the amount is wrong |
| Mahnbescheid | 14 days | Automatic enforcement order — bank accounts and wages can be seized |
| Kündigung (employer) | 21 days | You permanently lose the right to contest your dismissal |
| Ausländerbehörde | 4 weeks | Residence permit decisions become final |

**BriefKlar solves this.**

---

## How It Works

```
📱 Scan with phone  →  🔍 OCR + classify  →  ✅ Plain English explanation
```

1. **Open BriefKlar** on your desktop — a QR code appears
2. **Scan the QR with your phone** — a camera viewfinder opens
3. **Photograph your letter** — align it to the A4 guide frame
4. **Get instant results** — letter type, deadline, what to do, free help resources

Everything runs **locally on your computer**. No cloud. No API key. No subscription.

---

## Features

<table>
<tr>
<td width="50%">

**🔍 Smart Classification**

Identifies 26 German letter types using weighted keyword scoring across sender, subject, and body patterns. Confidence score shown so you always know how certain the result is.

</td>
<td width="50%">

**⏰ Deadline Detection**

Extracts deadlines from letter text and applies the **§ 122 AO 3-Tages-Fiktion** — letters are legally deemed delivered 3 days after the postmark, not when you receive them.

</td>
</tr>
<tr>
<td width="50%">

**📋 Plain-Language Explanations**

Every letter type has a plain-English explanation of what it is, step-by-step what to do, and exactly what happens if you ignore it.

</td>
<td width="50%">

**🆓 Free Help Resources**

Each letter type links to the relevant free German counselling services — Caritas MBE, Schuldnerberatung, Mieterverein, VdK, and more.

</td>
</tr>
<tr>
<td width="50%">

**📱 Mobile Scan via QR**

CamScanner-style viewfinder with A4 alignment frame. Phone and computer just need to be on the same WiFi.

</td>
<td width="50%">

**🔒 100% Offline**

No data ever leaves your computer. OCR runs locally with Tesseract.js. Database is a local SQLite file.

</td>
</tr>
</table>

---

## Letter Types

<details>
<summary><strong>Tax (7 types)</strong></summary>

| Type | German | Urgency |
|---|---|---|
| Income Tax Assessment | Einkommensteuerbescheid | 🟠 High |
| VAT Assessment | Umsatzsteuerbescheid | 🟠 High |
| Property Tax | Grundsteuerbescheid | 🟡 Medium |
| Trade Tax | Gewerbesteuerbescheid | 🟠 High |
| Vehicle Tax | Kfz-Steuer | 🟢 Low |
| EU VAT ID Notice | USt-IdNr (BZSt) | 🟡 Medium |
| Personal Tax ID | Steueridentifikationsnummer | 🟢 Low |

</details>

<details>
<summary><strong>Debt & Enforcement (4 types)</strong></summary>

| Type | German | Urgency |
|---|---|---|
| Payment Reminder | Mahnung | 🔴 Critical |
| Debt Collection | Inkasso | 🟠 High |
| Court Payment Order | Mahnbescheid | 🔴 Critical |
| Bank/Wage Seizure | Pfändungs- und Überweisungsbeschluss | 🔴 Critical |

</details>

<details>
<summary><strong>Social Benefits (7 types)</strong></summary>

| Type | German | Urgency |
|---|---|---|
| Benefit Approval | Jobcenter – Bewilligungsbescheid | 🟢 Low |
| Benefit Cancellation | Jobcenter – Aufhebungsbescheid | 🔴 Critical |
| Benefit Sanction | Jobcenter – Sanktionsbescheid | 🔴 Critical |
| Health Insurance | Krankenkasse – Bescheid | 🟡 Medium |
| Parental Benefit | Elterngeld | 🟠 High |
| Housing Benefit | Wohngeld | 🟡 Medium |
| Child Benefit | Kindergeld – Familienkasse | 🟡 Medium |

</details>

<details>
<summary><strong>Immigration & Family (3 types)</strong></summary>

| Type | German | Urgency |
|---|---|---|
| Immigration Notice | Ausländerbehörde | 🔴 Critical |
| Naturalisation | Einbürgerungsbescheid | 🟠 High |
| Childcare Place | Kita / Kindergarten Bescheid | 🟠 High |

</details>

<details>
<summary><strong>Housing, Employment & Other (8 types)</strong></summary>

| Type | German | Urgency |
|---|---|---|
| Landlord Termination | Kündigung vom Vermieter | 🔴 Critical |
| Utility Bill Settlement | Nebenkostenabrechnung | 🟡 Medium |
| Employer Termination | Kündigung vom Arbeitgeber | 🔴 Critical |
| Court Notice | Gerichtsbescheid | 🔴 Critical |
| Pension Insurance | Deutsche Rentenversicherung | 🟡 Medium |
| Student Aid | BAföG | 🟠 High |
| Utility Provider | Strom / Gas / Internet | 🟢 Low |
| Broadcasting Fee | Rundfunkbeitrag (GEZ) | 🟢 Low |

</details>

---

## Tech Stack

| | Technology | Purpose |
|---|---|---|
| 🖥️ | [Electron 41](https://www.electronjs.org/) | Desktop shell |
| ⚡ | [electron-vite](https://electron-vite.org/) | Build tooling |
| ⚛️ | React 18 + TypeScript | Frontend |
| 🎨 | Tailwind CSS | Styling |
| 🔍 | [Tesseract.js](https://tesseract.projectnaptha.com/) | OCR (German `deu.traineddata`) |
| 🖼️ | [Sharp](https://sharp.pixelplumbing.com/) | Image preprocessing |
| 🗄️ | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | Local database |
| 📦 | electron-builder + NSIS | Windows installer |

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/MfFischer/briefklar.git
cd briefklar
npm install
```

### 2. Get the German OCR model

BriefKlar needs `deu.traineddata` (~15 MB). Download it and place it at:

```
C:\Users\<you>\AppData\Roaming\tessdata\deu.traineddata
```

> Download: [github.com/tesseract-ocr/tessdata](https://github.com/tesseract-ocr/tessdata/raw/main/deu.traineddata)
>
> On first launch, BriefKlar automatically copies it to the right place.

### 3. Run

```bash
# Development
npm run dev

# Build Windows installer
npm run build:win
```

Installer output: `dist/BriefKlar Setup 0.1.0.exe`

---

## Project Structure

```
briefklar/
├── knowledge-base/
│   └── letters.json          # 26 letter type definitions
├── scripts/
│   ├── dev.js                # Dev server launcher
│   └── build.js              # Installer build script
└── src/
    ├── main/                 # Electron main process
    │   ├── pattern-matcher.ts    # Classification engine
    │   ├── image-processor.ts    # Sharp + Tesseract pipeline
    │   ├── handoff-server.ts     # Mobile scan QR server
    │   └── db.ts                 # SQLite queries
    ├── renderer/src/         # React frontend
    │   ├── pages/                # Dashboard, LetterView, Settings
    │   └── components/           # ScanModal, ReplyEditor, Sidebar
    └── shared/
        └── types.ts          # Shared TypeScript interfaces
```

---

## Adding a Letter Type

All classification logic lives in `knowledge-base/letters.json`. Each entry follows this schema:

```json
{
  "id": "my_letter_type",
  "label": "English label",
  "labelDe": "Deutscher Name",
  "urgency": "low | medium | high | critical",
  "senderPatterns": ["Behörde XY"],
  "subjectPatterns": ["Betreff keyword"],
  "bodyPatterns": ["§ 123 BGB", "specific phrase"],
  "whatItIs": "Plain-English explanation of what this letter is.",
  "whatToDo": ["Step 1", "Step 2"],
  "consequence": "What happens if ignored.",
  "deadlineRule": "explicit_or_1_month",
  "replyTemplateId": null,
  "freeHelp": ["Free resource — website.de"]
}
```

Scoring weights: `senderPatterns ×3`, `subjectPatterns ×4`, `bodyPatterns ×2`.

> **Tip:** § law references (e.g. `§ 31 SGB II`) are the most discriminating patterns — they are unique to a single letter type.

---

## Known Limitations

- OCR quality depends on photo quality — good lighting and a flat letter make a big difference
- Windows only for now (macOS/Linux builds are possible but untested)
- App is unsigned — Windows SmartScreen shows a warning on first run: click **More info → Run anyway**
- German letters only

---

## Roadmap

- [ ] "Was this wrong?" misclassification feedback button
- [ ] Windows calendar reminder integration
- [ ] Reply template drafting (Einspruch, Widerspruch)
- [ ] macOS build
- [ ] Code signing

---

## License

MIT © 2026 [Maria Fe Fischer](https://github.com/MfFischer)

---

<div align="center">

*Built for everyone who has ever stared at a German letter and thought: "what does this even mean?"*

<br />

**[Download](https://github.com/MfFischer/briefklar/releases) · [Report a Bug](https://github.com/MfFischer/briefklar/issues) · [Request a Letter Type](https://github.com/MfFischer/briefklar/issues)**

</div>
