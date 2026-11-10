# Tanzania Forums

**Tanzania’s open forum for ideas, truth, and community.**

A modern, read-first discussion platform built with Next.js 15, Supabase (PostgreSQL), Google OAuth, and Groq AI. Mobile-first, dark-mode ready, bilingual (English / Swahili), with AI summaries and moderation.

---

## Features

### Group 1 – Foundation
- Clean 2026 editorial UI with bento-grid homepage
- Light / Dark mode (system-aware)
- Google-only authentication (Supabase Auth)
- First-user-is-admin bootstrap logic
- Full PostgreSQL schema with RLS
- Responsive layout: sticky header, secondary activity bar, bottom nav on mobile
- Lucide icons (no emojis)

### Group 3 – Admin Panel
- Protected `/admin` area with role check (admin only)
- Dashboard KPIs + recent activity
- User management (search, filter, role change)
- Moderation queue (AI-flagged posts + user reports)
- Audit logs viewer
- AI / Groq settings
- Categories overview
- JamiiCheck create & list
- Announcements
- Site settings

### Group 2 – Core Forum
- Category pages with filters (Latest / Most replied / Most viewed + language)
- Full thread view with nested reply UI, stats sidebar, related threads
- ReplyComposer with Google sign-in lock overlay for anonymous users
- New thread form (`/new`) with category + language selection
- AI Summary generation via Groq (button + SummaryCard)
- Search page
- Trending page
- AuthModal for all write actions

---

## Tech Stack

| Layer        | Technology                          |
|-------------|--------------------------------------|
| Framework   | Next.js 15 (App Router)             |
| Language    | TypeScript                          |
| Styling     | Tailwind CSS + next-themes          |
| Database    | Supabase (PostgreSQL)               |
| Auth        | Supabase Auth + Google OAuth        |
| AI          | Groq (`openai/gpt-oss-120b`)        |
| Icons       | Lucide React                        |
| Deployment  | Vercel                              |

---

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd tanzania-forums
npm install
```

### 2. Environment Variables

Copy the example and fill in values:

```bash
cp .env.local.example .env.local
```

Required variables:



### 3. Database Setup

1. Open your Supabase project → **SQL Editor**
2. Paste the entire contents of `supabase/schema.sql`
3. Run the script
4. Go to **Authentication → Providers** and ensure **Google** is enabled (credentials already connected)
5. Under **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (or your production domain)
   - Redirect URLs: `http://localhost:3000/auth/callback` and your production callback

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The **first Google sign-in** automatically becomes the site Admin.

---

## Project Structure (Group 1)

```
tanzania-forums/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout + providers
│   │   ├── page.tsx            # Homepage (bento grid)
│   │   ├── globals.css
│   │   ├── auth/callback/      # OAuth callback
│   │   └── admin/              # (Group 2+)
│   ├── components/
│   │   ├── layout/             # AppShell, Header, Footer, MobileNav
│   │   ├── forum/              # ThreadCard, CategoryCard
│   │   ├── auth/               # AuthButton
│   │   └── providers.tsx
│   ├── lib/
│   │   ├── supabase/           # Browser + server clients
│   │   └── utils.ts
│   ├── types/
│   │   └── database.ts
│   └── middleware.ts           # Auth + admin protection
├── supabase/
│   └── schema.sql              # Full DB schema + RLS + seeds
├── vercel.json
└── README.md
```

---

## Groups Roadmap

| Group | Scope                                      | Status   |
|-------|--------------------------------------------|----------|
| **1** | Foundation, schema, auth, layout, homepage | ✅ Done  |
| **2** | Category pages, Thread view, posting, AI summaries | ✅ Done  |
| **3** | Admin panel, moderation queue, JamiiCheck management, settings | ✅ Done  |

All three groups are complete. You can now run the full application.

---

## Design Notes

- Brand palette: deep teal/green (`brand-*`) + warm neutrals + gold accent for verified/AI
- Glass morphism on sticky elements only
- WCAG AA contrast targets
- Read-first: everything public; write actions require Google sign-in
- Icons: Lucide React only (no emoji icons)

---

## License

Private / All rights reserved.
