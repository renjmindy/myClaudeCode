# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev:all   # Start both Vite dev server (port 3000) and Express backend (port 5001) concurrently
npm run dev       # Start Vite dev server only
npm run server    # Start Express backend only
npm run build     # Production build to build/
```

No lint or test scripts are configured.

## Architecture

**Stack:** React 18 + TypeScript, Vite 6 (SWC), Tailwind CSS, Radix UI, Motion (Framer Motion fork)

**Entry point:** `index.html` → `src/main.tsx` → `src/App.tsx`

### Game Logic (`src/App.tsx`)

All game state lives in `App.tsx`:
- 3 treasure chests, one randomly assigned treasure
- Scoring: +$100 (treasure), -$50 (skeleton)
- Win condition: find treasure OR open all boxes
- Result determined by final score: Win (>0), Tie (=0), Loss (<0)
- Chest flip animation via `motion/react`
- Sound effects played on open: `chest_open.mp3` (treasure) or `chest_open_with_evil_laugh.mp3` (skeleton)
- Score history fetched and displayed after each game (authenticated users only)

### Auth Flow

- On load, `decodeToken()` checks localStorage for a valid JWT; if absent/expired, `AuthDialog` is shown
- `src/lib/auth.ts` — JWT helpers: `setToken`, `getToken`, `clearToken`, `decodeToken` (all use `localStorage`)
- `src/components/AuthDialog.tsx` — Sign in / sign up / guest play dialog; calls `/api/auth/signin` or `/api/auth/signup`
- Guest players can play but scores are not saved

### Backend (`server/server.js`)

Express server on port 5001 with better-sqlite3 (`server/db.sqlite`):
- `POST /api/auth/signup` — create user, returns JWT
- `POST /api/auth/signin` — verify credentials, returns JWT
- `POST /api/scores` — save game result (auth required)
- `GET /api/scores` — fetch last 10 scores for current user (auth required)

JWT secret is hardcoded as `'treasure-secret-key'` (dev only). Vite proxies `/api/*` to `localhost:5001` via `vite.config.ts`.

### Component Structure

- `src/components/ui/` — Radix UI wrapper components (Button, Card, Dialog, Table, Tabs, etc.); pre-built, rarely need modification
- `src/components/figma/ImageWithFallback.tsx` — Image component with error fallback
- `src/components/AuthDialog.tsx` — Authentication modal

### Assets

- `src/assets/` — treasure chest PNG images (`treasure_closed.png`, `treasure_opened.png`, `treasure_opened_skeleton.png`, `key.png`)
- `src/audios/` — sound effect MP3s

### Path Aliases

`vite.config.ts` sets `@/` → `src/`, so imports use `@/components/...` etc.
