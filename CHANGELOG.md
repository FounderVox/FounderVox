# Changelog

All notable changes to FounderNote will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-01-17

### Added

#### Voice Recording & Transcription System
- **Complete Audio Pipeline**: End-to-end voice recording with AI transcription
  - Browser-based recording using Web Audio API and MediaRecorder
  - Real-time waveform visualization during recording
  - Audio upload to Supabase Storage
  - Deepgram Nova-2 transcription with smart formatting
  - GPT-4o transcript cleanup for polished notes
  - Automatic embedding generation for semantic search

#### Debug Logging System
- **Comprehensive Tracing**: Full debug logging throughout recording flow
  - `[RecordingModal]` - Client-side recording state
  - `[FounderNote:Recording]` - Upload and processing events
  - `[Upload]` - Server-side file handling
  - `[Process]` / `[Process:Deepgram]` - Transcription pipeline
  - Detailed error logging with stack traces

### Changed

#### Processing Modal UI Overhaul
- **Modern Design**: Complete redesign of the processing/success modal
  - Rounded 3xl corners with backdrop blur
  - Branded spinner with Sparkles icon in terracotta gradient
  - Animated progress bar during processing
  - Celebration particles animation on success
  - "View Note" button with FileText icon
  - Auto-close indicator showing "Closing automatically..."
  - Click outside to dismiss (when complete/error)
  - Auto-closes after 2.5 seconds on success

#### Demo Page UI Improvements
- **Enhanced Onboarding Experience**: Polished demo page design
  - Larger card layout with rounded-3xl corners
  - Success badge showing "Account created"
  - Rocket icon with brand gradient
  - Gradient CTA button with arrow animation
  - Template cards with:
    - Color-coded gradient icons (blue, amber, emerald, purple)
    - Descriptive subtitles for each template
    - Hover animations with lift effect
    - Selection indicator with checkmark
  - Improved loading state with Sparkles icon
  - Skip link with animated arrow on hover

### Fixed

#### Critical: Audio Upload RLS Fix
- **Supabase Storage RLS**: Fixed Row Level Security blocking audio uploads
  - Storage bucket operations now use service role client
  - Database inserts use service role client consistently
  - File cleanup on error uses service role client
  - Proper error handling with detailed logging

#### Processing Modal Stuck Issue
- **Auto-Close Bug**: Fixed modal staying open after successful transcription
  - Added `context.reset()` call to clear state after close
  - Proper cleanup of recording context on completion
  - Event dispatch (`noteCreated`) for dashboard refresh

#### Debug Telemetry Cleanup
- **Removed Orphaned Debug Code**: Cleaned up auth-context.tsx
  - Removed ~10 debug `fetch()` calls to non-existent endpoint
  - Eliminated `ERR_CONNECTION_REFUSED` console errors
  - Improved auth initialization performance

#### Duplicate Console Logs
- **React Strict Mode Fix**: Prevented double initialization
  - Added `initRef` guard to welcome page
  - Added `initRef` guard to demo page
  - Logs now appear once instead of twice

### Technical Details

#### Environment Configuration
- **New Required Variable**: `SUPABASE_SERVICE_ROLE_KEY`
  - Required for server-side database and storage operations
  - Bypasses Row Level Security in API routes
  - Documented in `.env.local.example` with setup instructions
  - See `SETUP_SERVICE_ROLE_KEY.md` for detailed setup guide

#### API Route Improvements
- `upload/route.ts`: Uses service role for storage + DB
- `process/route.ts`: Uses service role for all DB operations
- Fixed double JSON parse bug in error handler
- Proper error status updates on failure

#### Recording Hook Enhancements
- Detailed logging at each pipeline stage
- Network error handling with clear messages
- Response header logging for debugging
- Proper blob validation before upload

## [0.3.1] - 2026-01-08

### Fixed

#### Authentication Login Issue
- **Critical Bug Fix**: Resolved issue where verified users couldn't log in after signup
  - Users were getting "Invalid email or password" error despite correct credentials
  - Root cause: Email verification requirement blocking immediate login
  - Solution: Implemented auto-login after signup using existing authenticated session
  - Users now redirected directly to onboarding after signup (no manual login required)
- **Improved Error Messaging**: Enhanced login error handling
  - Added detailed console logging for debugging
  - Display specific error messages based on error type
  - Email verification errors show clear actionable message
  - Invalid credentials errors provide helpful feedback
- **Better User Experience**: Seamless signup-to-onboarding flow
  - Signup success message changed to "Welcome to FounderNote!"
  - Direct redirect to `/welcome` instead of `/login`
  - Email verification happens asynchronously in background
  - No friction in getting started with the app

### Technical Details
- Modified `src/app/(auth)/signup/page.tsx`:
  - Changed redirect from `/login?signup=success` to `/welcome`
  - Updated success message for better UX
  - Leverages automatic session creation from `signUp()`
- Modified `src/app/(auth)/login/page.tsx`:
  - Enhanced error detection and messaging
  - Added detailed error logging for debugging
  - Better handling of email verification errors
- Created `AUTH_FIX_DOCUMENTATION.md` with comprehensive fix details

## [0.3.0] - 2026-01-08

### Added

#### Tag Management System
- **Complete Tag System**: Full tagging functionality for organizing notes
  - Create new tags or select from existing tags
  - Tags stored as PostgreSQL text array with GIN index for performance
  - Click-to-toggle interface for quick tag selection
  - Visual feedback with checkmarks for selected tags
  - Black button with white icon for adding new tags
  - "Done" button instead of "Save Tags" for better UX
- **Tag Dialog Improvements**:
  - Shows all available tags with toggle functionality
  - Displays tags currently on the note
  - Hover effects on tag buttons for better interactivity
  - Seamless tag assignment workflow
- **Database Migration**: `003_add_tags_to_notes.sql`
  - Added `tags` column (text array) to notes table
  - Created GIN index for efficient tag searching
  - Default empty array for new notes

#### Note Organization Features
- **Golden Star Display**: Starred notes show filled amber star even without hover
  - Static golden star visible at all times when note is starred
  - Interactive star button appears on hover
  - Smooth transition between states
- **Starred Count in Sidebar**: Live count of starred notes displayed next to "Starred" menu item
  - Updates instantly when notes are starred/unstarred
  - Event-driven architecture for real-time updates
- **Three-Dot Menu Enhancement**:
  - Added "Add Tag" option between "Edit Note" and "Delete"
  - Consistent menu order across all note locations
  - Tag icon for clear visual communication

#### View Modes
- **List/Tiles Toggle on All Notes Page**:
  - Toggle buttons with List and Grid icons
  - **List View**: Full-width cards with larger text (default)
  - **Tiles View**: Responsive 2-3 column grid using NoteCard component
  - Smooth transitions between view modes
  - Both views maintain all functionality (star, edit, delete, tags)

#### Search Functionality
- **Full-Text Search**: Powerful search across all notes
  - Searches note titles, formatted content, and raw transcripts
  - Case-insensitive search using PostgreSQL `ilike`
  - Real-time search with loading states
  - Displays up to 20 most recent results
  - Result cards show title, date, template label, and preview
  - "No results found" message with helpful suggestions
  - Click result to navigate (ready for note detail page)

#### Dashboard Improvements
- **Recent Notes Section**: Collapsible section with improved hover effects
  - More prominent hover: `hover:bg-white/80` with shadow
  - "View all" link appears when expanded
  - Smooth expand/collapse animations
- **All Notes Section**: Separate main section with date headers below Recent Notes
  - Full date labels (e.g., "January 8, 2026")
  - Both sections use same grouped data for consistency
  - Maintains date grouping and sorting

### Changed
- **Dynamic Count Updates**: All sidebar counts update in real-time
  - Note counts, starred counts, and tag counts refresh automatically
  - Custom events: `noteCreated`, `tagsUpdated`, `starToggled`
  - Event listeners in dashboard layout for immediate UI updates
- **Add Tag Dialog UX**: Complete redesign for better user experience
  - Toggle-based selection instead of add/remove workflow
  - Shows all available tags with visual selection state
  - Single "Done" button replaces "Cancel" and "Save Tags"
  - Cleaner, more intuitive interface

### Fixed
- **Starred Count Updates**: Fixed issue where starred count didn't update immediately
  - Added `starToggled` event dispatch on all star toggle actions
  - Dashboard, All Notes, and Starred pages now dispatch event
  - Sidebar listens for event and refreshes counts
- **Tag Button Styling**: Black button with white icon as requested
  - Consistent with app's black/white theme
  - Clear visual hierarchy

### Technical Details

#### Event System
- Three custom events for real-time updates:
  - `noteCreated`: Fired when new note is created
  - `tagsUpdated`: Fired when tags are modified
  - `starToggled`: Fired when note is starred/unstarred
- Dashboard layout listens to all events and refreshes counts

#### Database
- Tags stored as `text[]` array type in PostgreSQL
- GIN index on tags column for efficient filtering and search
- All tag operations use Supabase client with proper RLS

#### Component Architecture
- AddTagDialog loads all existing tags on open
- Maintains selected tags state locally until save
- Toggle functionality for intuitive tag selection
- Automatic reload after save to ensure consistency

#### Search Implementation
- Supabase query with `.or()` filter across multiple columns
- Limited to 20 results ordered by creation date
- Results formatted with dates, templates, and content previews

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
- Comprehensive debug logging with `[FounderNote:Component]` prefix
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
