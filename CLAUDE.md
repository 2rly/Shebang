# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This repository contains two separate projects:

- **cyber-hub/** — Main application. Next.js 16.1.6 full-stack cybersecurity platform (#!shebang.az). Production-ready.
- **seceng.dev/** — Astro 5.17.1 static documentation site. Early-stage starter.

## Commands

### cyber-hub (Next.js)
```bash
cd cyber-hub
npm run dev        # Dev server on http://localhost:3008
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint
```

### seceng.dev (Astro)
```bash
cd seceng.dev
npm run dev        # Dev server on http://localhost:4321
npm run build      # Build to dist/
npm run preview    # Preview production build
```

No test framework is configured in either project.

## cyber-hub Architecture

**Stack:** Next.js 16.1.6 (App Router) + React 18 + TypeScript 5 (strict) + Tailwind CSS 3.4.1

### Routing & Pages

App Router at `src/app/`. Eight sections: Dashboard (`/`), News (`/news`), Docs (`/docs`), Cheatsheets (`/cheatsheets`), Topology (`/topology`), Tools (`/tools`), Articles (`/articles`), Community (`/community`), Assistant (`/assistant`).

Root layout (`src/app/layout.tsx`) wraps all pages in a flex layout with `<Sidebar />` + `<Header />` + scrollable `<main>`.

### API Routes

Single API route: `src/app/api/news/route.ts` — aggregates RSS feeds from 6 security news sources (HackerNews, BleepingComputer, Threatpost, Dark Reading, The Hacker News, SecurityWeek). Feed configs live in `src/lib/news-sources.ts`. Auto-refreshes every 5 minutes client-side.

### Key Components

- `src/components/layout/Sidebar.tsx` — Collapsible nav with all section links and system status panel
- `src/components/layout/Header.tsx` — Top bar with search, notifications, user menu
- `src/components/tools/` — Client-side security tools (Base64, Hash, IP Lookup, Password Strength)
- `src/components/topology/ExcalidrawWrapper.tsx` — Excalidraw whiteboard loaded via `next/dynamic` with `ssr: false` (critical — Excalidraw requires browser APIs)
- `src/components/news/NewsFeed.tsx` — Fetches `/api/news`, client-side filtering and search

### Excalidraw Integration (Topology)

Excalidraw is heavy and depends on `window`. It MUST be loaded with `next/dynamic({ ssr: false })` from `src/app/topology/page.tsx`. The wrapper container needs explicit `height: calc(100vh - 64px)` to prevent canvas collapse. CSS isolation via `.excalidraw-container` class with `all: revert` prevents Tailwind from breaking Excalidraw's internal styles. See `globals.css` bottom section.

### Design System

Custom cyberpunk/terminal theme defined in `tailwind.config.ts` and `src/app/globals.css`:
- **Colors:** `cyber-bg` (#0a0a0f), `cyber-primary` (#00ff9d green), `cyber-secondary` (#00d4ff cyan), `cyber-accent` (#ff006e pink), `cyber-warning` (#ffd60a yellow)
- **Fonts:** JetBrains Mono (monospace), Inter (sans)
- **CSS classes:** `.cyber-card`, `.cyber-btn`, `.cyber-btn-secondary`, `.cyber-tag`, `.glow-text`, `.matrix-grid`, `.terminal-input`
- **Dark mode only** — `darkMode: "class"` on `<html class="dark">`

### Types

All shared TypeScript interfaces in `src/types/index.ts`: `NewsItem`, `Article`, `DocSection`, `ChatMessage`, `ForumPost`.

### Static Data

Cheatsheet content in `src/data/cheatsheets/` (linux.ts, python.ts, windows.ts). Articles are currently hardcoded in `src/app/articles/page.tsx`.

### Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

### Key Dependencies

`@excalidraw/excalidraw` (network diagrams), `@xyflow/react` (flow diagrams), `rss-parser` (feed parsing), `react-markdown` (content rendering), `gray-matter` (frontmatter), `date-fns` (dates), `lucide-react` (icons), `nanoid` (IDs).

### Config Notes

- `next.config.mjs`: `transpilePackages: ["@excalidraw/excalidraw"]` required for proper module resolution
- Port 3008 is hardcoded in the dev script

## seceng.dev Architecture

**Stack:** Astro 5.17.1 + TypeScript (strict) + Tailwind CSS 3.4.19 + @astrojs/mdx

Content-driven static site. Markdown/MDX content lives in `src/content/` organized by category (articles, cheatsheets, configs, incidents, red-flags). Pages in `src/pages/` with file-based routing. Currently minimal — mostly directory structure with planned content categories for CI/CD, Docker, Kubernetes, cloud IAM, incident response, and security anti-patterns.
