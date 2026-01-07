# Changelog

All notable changes to FounderVox will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-01-07

### Added

#### Enhanced Background System
- Professional animated cloud background component with React/SVG animations
- Smooth, organic cloud-like floating animations using Framer Motion
- Consistent background styling across all pages (auth, onboarding, dashboard, demo)
- Subtle gradient overlays with sky-blue tones for a clean, minimalistic aesthetic
- Improved visual depth with soft vignettes and grid patterns

#### Dashboard Recording Controls
- **Manual Note Creation Button** (Left): Create text notes or upload audio files for transcription
  - Two-tab interface: "Type Note" and "Upload Audio"
  - Support for manual text input with optional titles
  - Audio file upload with drag-and-drop support
  - Accepts MP3, WAV, M4A, and OGG formats
- **Template Selector Button** (Right): Choose recording templates based on use cases
  - Browse all 8 use case categories
  - Select specific templates within each category
  - Visual feedback when template is selected (button turns black)
  - Quick access to personalized recording templates

#### UI Components
- Added Dialog component (shadcn/ui) with backdrop blur and animations
- Added Textarea component for multi-line text input
- ManualNoteDialog component with tabbed interface
- TemplateSelectorDialog component with two-level navigation
- Enhanced button animations with hover and tap effects

### Changed
- Upgraded dashboard floating button layout to accommodate three buttons
- Enhanced recording button positioning to maintain center alignment
- Improved visual hierarchy with circular icon buttons flanking main record button

### Fixed
- Fixed Suspense boundary issue in login page (useSearchParams hook)
- Resolved build errors related to client-side routing

### Technical Details
- Installed @radix-ui/react-dialog for modal functionality
- Cloud animations use SVG with Gaussian blur filters for soft edges
- Multiple animated ellipses with different timing and scales for organic motion
- Template selection integrates with existing USE_CASES constants
- All dialogs follow consistent design system with glass morphism effects

## [0.1.0] - 2026-01-07

### Added

#### Authentication System
- Google OAuth integration for seamless sign-in
- Apple OAuth support (styled, ready to enable when configured)
- Email/password signup with terms acceptance
- Auto-login after signup (non-blocking email verification)
- Secure session management with Supabase SSR
- Smart routing based on auth and onboarding status

#### Onboarding Flow
- Step 1: Personalized name input with animated microphone
- Step 2: Use case selection with multi-select animated cards
- Progress indicator across onboarding steps
- Skip option for use case selection
- Pre-filled name from OAuth providers

#### 8 Founder-Specific Use Cases
- Emails & Communication (professional emails, quick replies)
- Content Creation (blog posts, social media, scripts)
- Work & Productivity (meeting notes, to-do lists)
- Ideas & Brainstorming (quick capture, creative thinking)
- Personal & Journaling (daily journal, reflections)
- Team Collaboration (shared notes, action items) [NEW badge]
- Founder Mode (investor updates, pitch notes, user research) [FOUNDER badge]
- Learning & Research (lecture notes, study guides)

#### UI/UX
- Clean, minimalist design inspired by Lovable
- Professional purple primary color scheme
- Smooth animations with Framer Motion
- Pulsing microphone animation on welcome screen
- Glowing card selection effects
- Responsive layout for all screen sizes
- shadcn/ui component library

#### Infrastructure
- Next.js 14 with App Router
- TypeScript throughout
- Tailwind CSS with custom configuration
- Supabase integration (auth + database)
- Auth middleware with smart routing
- Database schema with RLS policies

#### Developer Experience
- Comprehensive debug logging with `[FounderVox:Component]` prefix
- Clear console output for debugging
- Proper error handling and user feedback
- Environment variable validation

#### Documentation
- Comprehensive README with setup instructions
- Product vision document (VISION.md)
- This changelog
- Database migration scripts

### Technical Details

#### Database Schema
- `profiles` table extending Supabase auth.users
- Row Level Security (RLS) policies
- Auto-creation of profile on user signup via trigger
- Use cases stored as PostgreSQL text array

#### Routing Logic
- Protected routes require authentication
- Authenticated users redirected from auth pages
- Onboarding status determines redirect destination
- OAuth callback handles session exchange

---

## Roadmap

### [0.2.0] - Q1 2026 (Planned)
- Voice recording functionality
- Real-time audio visualizer
- Basic note storage and organization

### [0.3.0] - Q1 2026 (Planned)
- AI transcription integration (Whisper API)
- Template-based transformations
- Export to clipboard functionality

### [0.4.0] - Q2 2026 (Planned)
- iOS & Android native apps
- Analytics dashboard
- Pitch practice with AI feedback

### [0.5.0] - Q3 2026 (Planned)
- Team collaboration features
- Shared workspaces
- Comments & @mentions

### [1.0.0] - Q4 2026 (Planned)
- Semantic search
- Cross-recording insights
- Custom template marketplace
- API access for developers
