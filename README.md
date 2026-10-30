# Kingdom 2676 dashboard

React + Vite + TypeScript dashboard for Kingdom 2676. The project reads live data from ROKStats and builds a static dashboard for browsing governor, guild, and kingdom information.

## Prerequisites

- Node.js 20+ (the repo is configured for Vite + TypeScript)
- npm
- A local browser profile with a valid ROKStats session cookie
- A `.env` file based on `.env.example`

## First run on Windows

Use PowerShell in this folder:

```powershell
npm install
Copy-Item .env.example .env
```

Then edit `.env` and fill in:

```env
ROKSTATS_KINGDOM=2676
ROKSTATS_SESSION=s%3A...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

To get a valid `ROKSTATS_SESSION` value, run:

```powershell
npm run get-cookie
```

This uses Playwright to open the persistent Edge profile and print the `connect.sid` cookie. Paste the value into `ROKSTATS_SESSION` in `.env`.

After the environment is set up, run:

```powershell
npm run sync
npm run build
npm run dev
```

- `npm run sync` fetches the latest kingdom data from the ROKStats API and saves JSON files into `public/` and `data/`.
- `npm run build` compiles the TypeScript app and generates the static `dist/` output.
- `npm run dev` starts the Vite development server for local UI work.

## Available scripts

From `package.json`:

```json
"scripts": {
  "dev": "vite --host 127.0.0.1",
  "build": "tsc -b && vite build && node scripts/generate-routes.js",
  "preview": "vite preview --host 127.0.0.1",
  "sync": "tsx scripts/sync.ts",
  "get-cookie": "tsx scripts/get-cookie.ts"
}
```

There is no `npm start` or `npm run login` script in this repository. The current project uses `npm run get-cookie`, `npm run sync`, `npm run build`, and `npm run dev`.

## Notes

- The app is a static frontend; it does not include a custom Node server startup script.
- Data refresh depends on a valid `ROKSTATS_SESSION` cookie.
- `public/` contains the generated static data files used by the dashboard.
- `scripts/` contains utilities for cookie extraction, sync, and static route generation.

## Publishing

This repo is used as a GitHub Pages/static site build. After making UI changes, run:

```powershell
npm run build
```

Then publish the generated output from the static hosting target used by the project.
