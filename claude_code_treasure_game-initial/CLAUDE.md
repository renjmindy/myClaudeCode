# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server (port 3000, opens browser automatically)
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
- Chest flip animation via `motion/react`
- Sound effects played on open: `chest_open.mp3` (treasure) or `chest_open_with_evil_laugh.mp3` (skeleton)

### Component Structure

- `src/components/ui/` — 46 Radix UI wrapper components (Button, Card, Dialog, etc.); these are pre-built and rarely need modification
- `src/components/figma/ImageWithFallback.tsx` — Image component with error fallback

### Assets

- `src/assets/` — treasure chest PNG images (3 variants)
- `src/audios/` — sound effect MP3s

### Path Aliases

`vite.config.ts` sets `@/` → `src/`, so imports use `@/components/...` etc.
