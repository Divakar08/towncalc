# TownCalc — Canadian Townhouse Mortgage Calculator

A responsive React web app for calculating and comparing Canadian townhouse mortgage scenarios, built with TypeScript, Vite, Express, Tailwind CSS, and shadcn/ui.

## Features

- **4 down-payment scenarios** — Min (CMHC rules), 10%, 15%, 20%
- **25 and 30-year amortization** side-by-side comparison
- **Monthly vs bi-weekly** payment comparison with interest savings
- **Affordability ratios** — housing ratio / total ratio with Buy / Caution / Do not buy decisions
- **Amortization breakdown charts** — annual principal vs interest, cumulative over time
- **Annual lump-sum prepayment calculator** — see how much interest you save and how many years earlier you pay off
- **CMHC insurance** automatically calculated for insured mortgages
- **Light / dark mode**

---

## Running Locally

### Prerequisites

- **Node.js 18+** — download from [nodejs.org](https://nodejs.org) (choose LTS)

Verify:
```bash
node --version   # v18.x or higher
npm --version
```

### Steps

```bash
# 1. Extract the ZIP and enter the folder
cd townhouse-calc

# 2. Install dependencies (one-time, ~30 seconds)
npm install

# 3. Start the dev server
npm run dev
```

Open **http://localhost:5000** in your browser.

> **Raspberry Pi tip:** If running headless, access from another device on the same network using `http://<pi-ip>:5000`. Find the Pi's IP with `hostname -I`.

---

## Deploying to GitHub + Vercel (free hosting)

See the GitHub instructions in the README or follow the steps below.

### 1. Push to GitHub

```bash
# Inside the townhouse-calc folder
git init
git add .
git commit -m "Initial commit — TownCalc mortgage calculator"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/towncalc.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel (free)

```bash
npm install -g vercel
vercel --prod
```

Or connect your GitHub repo at [vercel.com](https://vercel.com) — it auto-deploys on every push.

---

## Project Structure

```
townhouse-calc/
├── client/
│   ├── src/
│   │   ├── components/         # UI components
│   │   │   ├── InputSidebar.tsx
│   │   │   ├── ScenarioCards.tsx
│   │   │   ├── TermTabs.tsx
│   │   │   ├── BiWeeklyPanel.tsx
│   │   │   ├── AmortizationChart.tsx
│   │   │   └── LumpSumCalculator.tsx
│   │   ├── lib/
│   │   │   └── mortgage.ts     # All mortgage math & formulas
│   │   └── pages/
│   │       └── MortgageCalculator.tsx
│   └── index.html
├── server/                     # Express backend (serves static files)
├── shared/
│   └── schema.ts
├── package.json
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Charts | Recharts |
| Build | Vite |
| Backend | Express (serves static files) |
| Icons | Lucide React |

---

Built with [Perplexity Computer](https://www.perplexity.ai/computer)
