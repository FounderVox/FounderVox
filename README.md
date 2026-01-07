# FounderVox

**The voice-first operating system for startup builders.**

FounderVox transforms spoken thoughts into structured actions, turning every founder's greatest asset—their voice—into their most powerful productivity tool.

## Why FounderVox?

Founders spend **8-15 hours per week** on repetitive communication tasks:
- Writing investor updates (2-4 hours/month)
- Documenting user interviews (1-2 hours per interview)
- Creating meeting notes (30 min per meeting)
- Drafting emails (10-15 emails/day)

**That's 416-780 hours per year spent on communication instead of building.**

FounderVox gives you that time back.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion
- **Auth:** Supabase Auth (Google OAuth + Email)
- **Database:** Supabase PostgreSQL

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Supabase account

### 1. Clone and Install

```bash
git clone https://github.com/FounderVox/FounderVox.git
cd FounderVox
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)

2. Go to **Project Settings > API** and copy:
   - Project URL
   - Anon/Public key

3. Create your environment file:
   ```bash
   cp .env.local.example .env.local
   ```

4. Fill in your Supabase credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

### 3. Set Up Database

1. Go to your Supabase dashboard **SQL Editor**
2. Run the migration script from `supabase/migrations/001_initial_schema.sql`

This creates:
- `profiles` table with user preferences
- Row Level Security (RLS) policies
- Automatic profile creation on signup
- Use cases storage

### 4. Configure Google OAuth

1. In Supabase dashboard, go to **Authentication > Providers**
2. Enable **Google** provider
3. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/):
   - Create a new project (or use existing)
   - Enable "Google+ API" and "Google Identity Services API"
   - Go to **APIs & Services > Credentials**
   - Create **OAuth 2.0 Client ID** (Web application)
   - Add authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://your-domain.com` (production)
   - Add authorized redirect URI:
     - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Copy the Client ID and Secret to Supabase Google provider settings

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login & Signup pages
│   ├── (onboarding)/     # Welcome & Use Cases selection
│   ├── (dashboard)/      # Main dashboard
│   └── auth/callback/    # OAuth callback handler
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Auth-related components
│   ├── onboarding/       # Onboarding components
│   └── shared/           # Shared components (Logo, etc.)
├── lib/
│   ├── supabase/         # Supabase client utilities
│   └── constants/        # App constants (use cases)
├── hooks/                # Custom React hooks
└── types/                # TypeScript types
```

## Features

### Authentication
- Google OAuth (primary, recommended)
- Apple OAuth (styled, ready to enable)
- Email/password signup with terms acceptance
- Auto-login after signup (no email verification blocking)

### Onboarding Flow
- 2-step personalized onboarding
- Animated microphone icon with pulse effect
- Use case selection for personalized templates

### Use Cases (Founder-Specific)
- Emails & Communication
- Content Creation
- Work & Productivity
- Ideas & Brainstorming
- Personal & Journaling
- Team Collaboration (NEW)
- Founder Mode (pitch notes, investor updates)
- Learning & Research

## Debugging

All console logs use the `[FounderVox:Component]` prefix for easy filtering:

```
[FounderVox:Middleware] Processing: /login
[FounderVox:Auth] Google OAuth initiated
[FounderVox:Onboarding] Saving user name: Sarah
```

Filter in browser console:
```javascript
// Show only FounderVox logs
console.log = ((log) => (...args) => args[0]?.includes?.('[FounderVox') && log(...args))(console.log)
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `NEXT_PUBLIC_SITE_URL` | Your site URL (for OAuth redirects) | Yes |

## Deployment

### Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard
5. Update `NEXT_PUBLIC_SITE_URL` to your Netlify URL
6. Update Google OAuth authorized origins/redirects

### Vercel

1. Import your GitHub repository
2. Environment variables are auto-detected from `.env.local.example`
3. Add your actual credentials
4. Deploy

## Roadmap

See [VISION.md](./VISION.md) for the complete product roadmap.

### Q1 2026: MVP Launch
- Core voice recording & transcription
- 8 founder-specific templates
- Voice commands
- Web app (desktop + mobile web)

### Q2 2026: Mobile + Analytics
- iOS & Android native apps
- Analytics dashboard
- Pitch practice tracking

### Q3 2026: Team Collaboration
- Shared workspaces
- Team member invites
- Comments & @mentions

### Q4 2026: Intelligence & Scale
- Semantic search
- Cross-recording insights
- Custom template marketplace

## Contributing

We're building in public. Follow along:
- Twitter: [@FounderVox](https://twitter.com/FounderVox)
- GitHub Issues for bugs and feature requests

## License

MIT

---

**Mission:** Give founders their time back.
