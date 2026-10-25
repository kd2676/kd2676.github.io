# Kingdom 2676 dashboard

React + Vite + TypeScript dashboard. The Windows updater opens ROKStats in a private browser profile, exports **All Governors - KD #2676** as CSV, and refreshes the local site every hour (configurable). No Discord password is stored in Vite or sent to visitors.

## First run on Windows

Use PowerShell in this folder:

```powershell
npm install
Copy-Item .env.example .env
npm run login
npm run build
npm start
```

During `npm run login`, sign in to ROKStats via Discord in the browser window and select kingdom 2676. After the heading **All Governors - KD #2676** appears, return to PowerShell and press Enter. The login profile remains under `.private/rokstats-profile` and is excluded from Git.

On this Windows setup, both the visible login and scheduled updater use Edge. `.env` is local and ignored by Git. If Edge cannot run headless on another computer, set `BROWSER_CHANNEL=` and install Playwright Chromium with `npx playwright install chromium`; `LOGIN_BROWSER_CHANNEL` can remain `msedge`. `PLAYWRIGHT_BROWSERS_PATH` is only needed if the browser installer and app run with different Windows profiles or environments.

Open **http://127.0.0.1:2676** while `npm start` is running. The server syncs immediately, then repeats at `SYNC_INTERVAL_MINUTES`. The page checks for new data every five minutes. `npm run sync` triggers one manual export. If the session expires, repeat `npm run login` and restart the server. Close the server before launching `npm run login`, because both use the same browser profile.

To start the server automatically when you log in to Windows, run `powershell -File scripts/install-autostart.ps1` once. To remove that startup task, run `powershell -File scripts/uninstall-autostart.ps1`. The PC must be on and logged in for the task to run.

`npm run dev` starts the Vite development UI; run `npm start` separately for its live API. `npm run build` prepares the production UI. The local server serves it and keeps its data current while the PC and server are running.

The previously published `chatgpt.site` address is a separate static deployment. Running the updater on this PC does **not** push data to that deployment. Publishing a new version is required there. The static build includes the latest `public/governors.json` at build time. Do not put Discord credentials or session files in `.env`, `public/`, `dist/`, or Git.

## Data coverage

Governor list, alliance totals, Power, KP, T4/T5, and deaths are calculated from the CSV. Historical KvK entries remain the snapshot captured on 25/10/2026. The page shows the export time, not an assertion of real-time game data. ROKStats controls when it scans and updates its own records.
