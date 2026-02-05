# #!shebang.az - Full-Stack Cybersecurity Engineering Platform

`#!/bin/security` — A comprehensive, modular web platform dedicated to Cybersecurity Engineering featuring documentation, news aggregation, articles, community forums, and an AI assistant.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           #!SHEBANG.AZ ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Client    │  │   Client    │  │   Client    │  │   Client    │        │
│  │  (Browser)  │  │  (Browser)  │  │  (Browser)  │  │  (Browser)  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         └────────────────┼────────────────┼────────────────┘                │
│                          │                │                                 │
│                          ▼                ▼                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         NEXT.JS 14 APPLICATION                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │                     App Router (Frontend)                        │ │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│ │  │
│  │  │  │Dashboard │ │News Feed │ │   Docs   │ │ Articles │ │Community││ │  │
│  │  │  │   Page   │ │   Page   │ │   Page   │ │   Page   │ │  Page  ││ │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│ │  │
│  │  │  ┌─────────────────────────────────────────────────────────────┐│ │  │
│  │  │  │                     #! Assistant (Chat UI)                   ││ │  │
│  │  │  └─────────────────────────────────────────────────────────────┘│ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │                      API Routes (Backend)                        │ │  │
│  │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐ │ │  │
│  │  │  │ /api/news  │ │ /api/docs  │ │ /api/chat  │ │/api/community│ │ │  │
│  │  │  │ RSS Parser │ │ MDX Loader │ │  AI Proxy  │ │ Forum CRUD   │ │ │  │
│  │  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └──────┬───────┘ │ │  │
│  │  └────────┼──────────────┼──────────────┼───────────────┼─────────┘ │  │
│  └───────────┼──────────────┼──────────────┼───────────────┼───────────┘  │
│              │              │              │               │               │
│              ▼              ▼              ▼               ▼               │
│  ┌───────────────────────────────────────────────────────────────────────┐│
│  │                        EXTERNAL SERVICES                               ││
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐  ││
│  │  │ RSS Feeds  │  │ File System│  │ Claude API │  │    Supabase    │  ││
│  │  │ HackerNews │  │ /docs/*.md │  │ or OpenAI  │  │ (Database +    │  ││
│  │  │ Bleeping   │  │ /articles  │  │            │  │  Auth)         │  ││
│  │  │ DarkReading│  │            │  │            │  │                │  ││
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────────┘  ││
│  └───────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14 (App Router) | React framework with SSR/SSG |
| **Styling** | Tailwind CSS | Utility-first CSS with custom cyber theme |
| **Language** | TypeScript | Type safety and better DX |
| **Icons** | Lucide React | Consistent, lightweight icons |
| **Dates** | date-fns | Date formatting and manipulation |
| **Markdown** | react-markdown + gray-matter | Article/doc content rendering |
| **Database** | Supabase (recommended) | PostgreSQL + Auth + Real-time |
| **AI** | Claude API / OpenAI | Cyber Assistant backend |
| **Deployment** | Vercel | Optimized for Next.js |

---

## Project Roadmap

### Phase 1: Foundation (Current)
- [x] Project setup with Next.js 14 + TypeScript
- [x] Custom cyberpunk/terminal theme with Tailwind
- [x] Responsive layout with sidebar navigation
- [x] Landing page with dashboard widgets
- [x] News aggregator with RSS feed support
- [x] Basic page structure for all modules

### Phase 2: Content Management
- [ ] Set up Supabase project
- [ ] Implement MDX support for documentation
- [ ] Create documentation CRUD system
- [ ] Build article management with Markdown editor
- [ ] Add search functionality (full-text search)
- [ ] Implement content versioning

### Phase 3: Community Features
- [ ] User authentication (Supabase Auth)
- [ ] User profiles and roles
- [ ] Forum discussion system
- [ ] Comment system for articles
- [ ] Upvoting and reputation system
- [ ] Notification system

### Phase 4: AI Assistant
- [ ] Integrate Claude/OpenAI API
- [ ] Build conversation history storage
- [ ] Add security context awareness
- [ ] Implement RAG with documentation
- [ ] Add CVE lookup integration
- [ ] Threat intelligence API integration

### Phase 5: Advanced Features
- [ ] Real-time updates with WebSockets
- [ ] Email notifications
- [ ] RSS feed generation
- [ ] API rate limiting
- [ ] Admin dashboard
- [ ] Analytics and metrics

---

## Quick Start

```bash
# Navigate to project
cd cyber-hub

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Project Structure

```
cyber-hub/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   └── news/          # News aggregation endpoint
│   │   ├── articles/          # Articles section
│   │   ├── assistant/         # AI chat interface
│   │   ├── community/         # Forum/community hub
│   │   ├── docs/              # Documentation section
│   │   ├── news/              # News feed page
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── layout/            # Layout components
│   │   │   ├── Header.tsx     # Top navigation
│   │   │   └── Sidebar.tsx    # Side navigation
│   │   ├── news/              # News components
│   │   │   ├── NewsCard.tsx   # Individual news item
│   │   │   └── NewsFeed.tsx   # News feed container
│   │   ├── chat/              # Chat components
│   │   └── ui/                # Reusable UI components
│   ├── lib/                   # Utility functions
│   │   └── news-sources.ts    # RSS feed configurations
│   ├── types/                 # TypeScript types
│   │   └── index.ts           # Shared type definitions
│   └── data/                  # Static data/content
├── public/                    # Static assets
├── tailwind.config.ts         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies
```

---

## News Automation Strategy

The platform automatically fetches news using these methods:

### 1. Server-Side RSS Fetching
```typescript
// /api/news/route.ts - Fetches and parses RSS feeds
// Supported sources: HackerNews, BleepingComputer, Dark Reading, etc.
// Auto-caches for 5 minutes using Next.js revalidation
```

### 2. Client-Side Auto-Refresh
```typescript
// NewsFeed component refreshes every 5 minutes
useEffect(() => {
  const interval = setInterval(fetchNews, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

### 3. Recommended: Cron Jobs (Production)
For production, set up a cron job to pre-fetch and cache news:

```bash
# Using Vercel Cron (vercel.json)
{
  "crons": [{
    "path": "/api/news/refresh",
    "schedule": "*/10 * * * *"
  }]
}
```

### 4. Adding New Sources
```typescript
// lib/news-sources.ts
export const NEWS_SOURCES = {
  newSource: {
    name: "New Source",
    rssUrl: "https://example.com/feed.xml",
    website: "https://example.com",
    color: "#ff0000",
  },
};
```

---

## Environment Variables

Create a `.env.local` file:

```env
# Supabase (Phase 2+)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# AI Assistant (Phase 4)
ANTHROPIC_API_KEY=your_claude_api_key
# OR
OPENAI_API_KEY=your_openai_key

# Optional: External APIs
VIRUSTOTAL_API_KEY=your_vt_key
SHODAN_API_KEY=your_shodan_key
```

---

## Extending the Platform

### Adding a New Documentation Section
1. Create category in `/src/app/docs/[category]/`
2. Add MDX files to `/src/data/docs/`
3. Update navigation in `Sidebar.tsx`

### Integrating AI Assistant
1. Set up API route at `/api/chat`
2. Add Claude/OpenAI SDK
3. Implement streaming responses
4. Add conversation history with Supabase

### Adding Authentication
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

---

## Design System

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `cyber-bg` | #0a0a0f | Main background |
| `cyber-surface` | #12121a | Card backgrounds |
| `cyber-border` | #1e1e2e | Borders |
| `cyber-primary` | #00ff9d | Primary accent (Matrix green) |
| `cyber-secondary` | #00d4ff | Secondary accent (Cyan) |
| `cyber-accent` | #ff006e | Alerts, warnings |
| `cyber-warning` | #ffd60a | Caution states |
| `cyber-text` | #e4e4e7 | Primary text |
| `cyber-muted` | #71717a | Secondary text |

### Components
- `.cyber-card` - Card container with hover effects
- `.cyber-btn` - Primary button (green)
- `.cyber-btn-secondary` - Secondary button (cyan)
- `.cyber-tag` - Tag/badge component
- `.glow-text` - Glowing text effect

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with precision for the security community.
