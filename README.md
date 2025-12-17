# 🔬 Growtopia Autoclave Calculator

Kalkulator Autoclave Growtopia gratis untuk menghitung hasil konversi surgical tools. Bandingkan nilai WL sebelum dan sesudah autoclave, dengan fitur auto-repeat dan import dari Growscan.

🌐 **Live Demo**: [autoclave-calculator.vercel.app](https://autoclave-calculator.vercel.app)

## ✨ Fitur

- **Kalkulasi Akurat** - Hitung hasil autoclave dengan presisi tinggi (20 tools → 12 tools baru)
- **Analisis Profit** - Bandingkan nilai WL sebelum dan sesudah autoclave secara real-time
- **Auto-Repeat** - Iterasi otomatis hingga quantity di bawah minimum per tool
- **Minimum Remainder** - Set sisa minimum per tool yang tidak akan di-autoclave
- **Dual Price Format** - Support format "WL per item" dan "items per WL"
- **Import dari Growscan** - Upload screenshot Growscan untuk input jumlah tools otomatis (OCR)
- **Mobile-First Design** - UI responsif dengan expandable cards dan floating action button
- **Data Persistence** - Data tersimpan otomatis di browser (IndexedDB)
- **100% Privasi** - Tidak ada data yang dikirim ke server

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build) v5
- **UI Library**: [React](https://react.dev) v19
- **Styling**: [Tailwind CSS](https://tailwindcss.com) v4
- **Language**: TypeScript
- **OCR**: [Tesseract.js](https://tesseract.projectnaptha.com/)
- **Storage**: IndexedDB (via [idb](https://github.com/jakearchibald/idb))
- **Runtime**: [Bun](https://bun.sh)

## 📁 Project Structure

```
/
├── public/
│   ├── favicon.svg
│   ├── favicon.ico
│   ├── og-image.png
│   ├── robots.txt
│   ├── sitemap.xml
│   └── images/surgical/     # Tool & autoclave images
├── src/
│   ├── components/
│   │   ├── AutoclaveCalculator.tsx
│   │   ├── MobileToolCard.tsx
│   │   ├── ResultsView.tsx
│   │   ├── GrowscanImport.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── tools.ts         # Tool definitions
│   │   ├── autoclave.ts     # Calculation logic
│   │   ├── pricing.ts       # Price utilities
│   │   └── db.ts            # IndexedDB wrapper
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── autoclave.astro
│   │   └── about.astro
│   └── styles/
│       └── global.css
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+

### Installation

```bash
# Clone repository
git clone https://github.com/winterestingwithyou/growtopia-autoclave-calculator.git
cd growtopia-autoclave-calculator

# Install dependencies
bun install

# Start development server
bun dev
```

### Commands

| Command        | Action                                      |
| :------------- | :------------------------------------------ |
| `bun install`  | Install dependencies                        |
| `bun dev`      | Start dev server at `localhost:4321`        |
| `bun build`    | Build production site to `./dist/`          |
| `bun preview`  | Preview production build locally            |
| `bun lint`     | Run ESLint                                  |
| `bun format`   | Format code with Prettier                   |

## 📖 How Autoclave Works

1. **Input 20 tools** - Autoclave membutuhkan 20 surgical tools dari jenis yang sama
2. **Output 12 tools** - Menghasilkan 1 dari setiap tool LAIN (13 jenis - 1 = 12)
3. **Repeat** - Jika auto-repeat aktif, proses berlanjut sampai quantity < 20 + minRemainder

### 13 Surgical Tools

- Surgical Anesthetic
- Surgical Antibiotics
- Surgical Antiseptic
- Surgical Clamp
- Surgical Defibrillator
- Surgical Lab Kit
- Surgical Pins
- Surgical Scalpel
- Surgical Splint
- Surgical Sponge
- Surgical Stitches
- Surgical Transfusion
- Surgical Ultrasound

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is open source under the [GPL-3.0 License](LICENSE).

## 👨‍💻 Author

**winterestingwithyou**

- GitHub: [@winterestingwithyou](https://github.com/winterestingwithyou)
- Instagram: [@adamyyy__](https://instagram.com/adamyyy__)

---

⚠️ **Disclaimer**: Project ini tidak berafiliasi dengan Ubisoft atau Growtopia. "Growtopia" adalah merek dagang dari Ubisoft.
