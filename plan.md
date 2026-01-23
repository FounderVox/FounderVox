# FounderVox Deep Codebase Audit & Bug Sweep Plan

**Date:** January 23, 2026
**Purpose:** Comprehensive review of all bugs, edge cases, overlooked issues, and production-readiness concerns
**Scope:** Full-stack audit from PM, Backend, Frontend, DevOps, QA, and Security perspectives

---

## 1. PROJECT MANAGER PERSPECTIVE

### 1.1 User Flow Completeness
- [ ] **Onboarding Flow**
  - Check if all onboarding steps properly save state
  - Verify user can skip/go back in onboarding
  - Test if incomplete onboarding blocks access to features
  - Edge case: User closes browser mid-onboarding

- [ ] **Recording Flow**
  - What happens if recording fails mid-recording?
  - What if user navigates away during recording?
  - What if audio upload fails?
  - What if transcription service is down?
  - What if user records silence/noise?

- [ ] **Smartify Flow**
  - Can user smartify the same note multiple times?
  - What if smartify is already in progress when user clicks again?
  - What if API times out during extraction?
  - What if note has no extractable content?
  - Edge case: User smartifies note, then immediately edits it

- [ ] **Ask/Chat Flow**
  - What if user has no notes indexed?
  - What if embedding generation fails?
  - What if all notes lack embeddings?
  - What if user asks a question while indexing is in progress?
  - Edge case: Very long questions (>1000 chars)

- [ ] **Payment/Paywall Flow**
  - What happens to users who hit limits?
  - Are limits properly enforced?
  - What if payment webhook fails?
  - What if subscription expires mid-session?
  - Edge case: User cancels subscription then immediately subscribes again

### 1.2 Feature Gaps
- [ ] No undo/redo for note edits
- [ ] No bulk operations (delete multiple notes, export multiple)
- [ ] No note version history
- [ ] No collaborative features (sharing notes)
- [ ] No offline mode or sync conflict resolution
- [ ] No notification system for completed processing
- [ ] No way to retry failed transcriptions
- [ ] No analytics dashboard for users (usage stats)

### 1.3 User Experience Issues
- [ ] Loading states inconsistent across pages
- [ ] Error messages may not be user-friendly
- [ ] No empty states with actionable CTAs
- [ ] No keyboard shortcuts documented
- [ ] No progress indicators for long operations
- [ ] No confirmation dialogs for destructive actions

---

## 2. BACKEND DEVELOPER PERSPECTIVE

### 2.1 API Route Issues

#### `/api/recordings/upload`
- [ ] **Security**: File size limits enforced? (currently maxDuration: 300)
- [ ] **Security**: File type validation beyond just checking extension?
- [ ] **Error Handling**: What if Deepgram API is down?
- [ ] **Error Handling**: What if Supabase storage upload fails?
- [ ] **Race Condition**: Multiple uploads for same note simultaneously?
- [ ] **Memory**: Large audio files could cause memory issues
- [ ] **Cleanup**: Failed uploads - are temp files cleaned up?

#### `/api/notes/smartify`
- [ ] **Idempotency**: Already has smartified_at check, but what if user edits note?
- [ ] **Timeout**: 5 minute timeout - is this enough for very long notes?
- [ ] **Error Handling**: What if one extraction succeeds but others fail?
- [ ] **Race Condition**: User clicks smartify multiple times rapidly?
- [ ] **Database**: Phantom recording creation - partially fixed, needs testing
- [ ] **Categories**: Categories parameter is optional, default behavior correct?

#### `/api/ask/query`
- [ ] **Performance**: Vector search with 5 results - optimal number?
- [ ] **Performance**: Embedding generation on every query - should cache?
- [ ] **Error Handling**: What if OpenAI API is down?
- [ ] **Rate Limiting**: No rate limiting on expensive AI calls
- [ ] **Context**: Conversation history only keeps last 6 messages - enough?
- [ ] **Security**: User can query other users' notes? (RLS should prevent)

#### `/api/embeddings/backfill`
- [ ] **Performance**: Batch size of 20 - optimal?
- [ ] **Error Handling**: What if embedding generation fails for one note?
- [ ] **Resource**: Could overwhelm API with too many concurrent requests
- [ ] **Progress**: No way to track overall progress (returns per-batch)

### 2.2 Database Schema Issues

#### `notes` table
- [ ] **Indexing**: Is `embedding` column indexed for vector search?
- [ ] **Data Integrity**: Can notes exist without recordings?
- [ ] **Cleanup**: Cascade deletes working properly?
- [ ] **Size**: No limit on content/transcript size - could grow large

#### `recordings` table
- [ ] **Orphans**: Can recordings exist without notes (note_id NULL)?
- [ ] **Duplicates**: note_id relationship - one-to-many or one-to-one?
- [ ] **Cleanup**: Are audio files in storage deleted when recording deleted?

#### `action_items` table
- [ ] **Unique Constraint**: Just added - needs testing with edge cases
- [ ] **Normalization**: Task normalization logic tested thoroughly?
- [ ] **Status**: Status changes not tracked (no history)
- [ ] **Deadlines**: Deadline parsing could fail for many formats

#### `profiles` table
- [ ] **Sync**: Profile creation on signup - always works?
- [ ] **Data**: customer_id for LemonSqueezy - properly populated?
- [ ] **Cleanup**: What happens to profile when auth user deleted?

### 2.3 Data Consistency Issues
- [ ] **Recordings without notes**: Migration 012 added note_id but existing records?
- [ ] **Notes without embeddings**: Backfill endpoint exists but not automatic
- [ ] **Orphaned action items**: If recording deleted, action items remain?
- [ ] **Orphaned brain dump**: If recording deleted, brain dump items remain?
- [ ] **Metrics tracking**: user_properties table sync with actual data?

### 2.4 Performance Bottlenecks
- [ ] **N+1 Queries**: Dashboard loading all notes - pagination needed?
- [ ] **Embeddings**: Generating embeddings synchronously - should be async?
- [ ] **AI Calls**: Sequential extraction calls - could parallelize better?
- [ ] **File Storage**: No CDN for audio files - direct Supabase storage
- [ ] **Search**: Vector search on large datasets - performance tested?

### 2.5 Error Handling Gaps
- [ ] Missing try-catch blocks in several API routes
- [ ] Error responses inconsistent format
- [ ] No error logging/monitoring service integrated
- [ ] Silent failures in background operations
- [ ] No retry logic for transient failures

---

## 3. FRONTEND DEVELOPER PERSPECTIVE

### 3.1 Component Issues

#### `RecordButton` / Recording Components
- [ ] **State Management**: Recording state lost on page reload?
- [ ] **Permissions**: Microphone permission denied - handled gracefully?
- [ ] **Error States**: Network error during upload - retry mechanism?
- [ ] **UI Feedback**: No visual indication of recording duration limit
- [ ] **Browser Compatibility**: MediaRecorder API not supported in all browsers

#### `SmartifyModal`
- [ ] **Loading States**: Processing state - can user close modal?
- [ ] **Error Recovery**: If smartify fails, can user retry without refresh?
- [ ] **Category Selection**: What if preview shows 0 items in all categories?
- [ ] **Accessibility**: Modal keyboard navigation (ESC to close, focus trap)

#### `NoteDetailModal`
- [ ] **Title Editing**: Just added - needs testing
- [ ] **Unsaved Changes**: No warning when closing with unsaved edits
- [ ] **Large Notes**: Rendering very long transcripts - performance?
- [ ] **Formatting**: No rich text editing, just plain text

#### `AskPage` / Chat Interface
- [ ] **Scroll Behavior**: Auto-scroll on new messages - works consistently?
- [ ] **Citation Links**: Citation expansion - keyboard accessible?
- [ ] **Long Conversations**: Many messages - performance degradation?
- [ ] **Input**: No character limit on input field

#### Dashboard Components
- [ ] **NoteCard**: Truncation of long titles/content - just fixed, needs testing
- [ ] **FilterBar**: Filter state not persisted across navigation
- [ ] **TodaysFocus**: Action items loading - what if none exist?

### 3.2 Responsive Design Issues
- [ ] **Mobile**: RecordButton on mobile - tested?
- [ ] **Tablet**: Dashboard layout on tablet breakpoints
- [ ] **Small Screens**: Modals on small screens - overflow?
- [ ] **Landscape**: Mobile landscape mode - UI breaks?

### 3.3 Accessibility Issues
- [ ] **ARIA Labels**: Many buttons missing aria-labels
- [ ] **Keyboard Navigation**: Not all interactive elements keyboard-accessible
- [ ] **Focus Management**: Modal focus not trapped properly
- [ ] **Screen Readers**: Dynamic content changes not announced
- [ ] **Color Contrast**: Some text may not meet WCAG AA standards

### 3.4 State Management Issues
- [ ] **Auth State**: Auth state refresh on token expiry?
- [ ] **Optimistic Updates**: No optimistic UI updates (always wait for server)
- [ ] **Cache Invalidation**: When to refetch data after mutations?
- [ ] **Global State**: No global state management (Context API only)

### 3.5 UI/UX Bugs
- [ ] **Try Asking Scrollbar**: Just added custom scrollbar - browser compatibility?
- [ ] **Empty States**: Not all pages have proper empty states
- [ ] **Loading Skeletons**: Inconsistent use of loading skeletons
- [ ] **Animations**: Framer Motion animations - performance on low-end devices?
- [ ] **Toast Notifications**: No toast/notification system for feedback

---

## 4. DEVOPS PERSPECTIVE

### 4.1 Environment Configuration
- [ ] **ENV Variables**: Missing env vars cause build to fail?
- [ ] **Secret Management**: Service role key in env - rotation strategy?
- [ ] **Multiple Environments**: No staging environment configuration
- [ ] **Feature Flags**: No feature flag system for gradual rollouts

### 4.2 Build & Deployment
- [ ] **Build Time**: Next.js build time acceptable?
- [ ] **Bundle Size**: Bundle size optimized? Code splitting?
- [ ] **Static Assets**: Images optimized with Next.js Image?
- [ ] **Edge Runtime**: Some API routes could use Edge runtime for speed
- [ ] **Caching**: API routes have proper cache headers?

### 4.3 Database Migrations
- [ ] **Migration Order**: Migrations applied in correct order?
- [ ] **Rollback Strategy**: No rollback migrations defined
- [ ] **Data Migration**: Some migrations alter data - tested on production copy?
- [ ] **Zero Downtime**: Migrations don't cause downtime?

### 4.4 Monitoring & Logging
- [ ] **Error Tracking**: No Sentry or error tracking service
- [ ] **Performance Monitoring**: No APM (Application Performance Monitoring)
- [ ] **Logging**: Console.log everywhere - needs proper logging service
- [ ] **Uptime Monitoring**: No health check endpoint
- [ ] **Analytics**: No server-side analytics for API usage

### 4.5 Scalability Concerns
- [ ] **Database Connection Pool**: Supabase connection limits?
- [ ] **API Rate Limits**: OpenAI/Deepgram rate limits - handled?
- [ ] **Concurrent Users**: How many concurrent users can system handle?
- [ ] **Storage Costs**: Audio file storage costs as users grow?
- [ ] **Background Jobs**: No queue system for background processing

### 4.6 Backup & Recovery
- [ ] **Database Backups**: Supabase auto-backups enabled?
- [ ] **Point-in-Time Recovery**: Can recover to specific point in time?
- [ ] **Storage Backups**: Audio files backed up separately?
- [ ] **Disaster Recovery Plan**: No documented DR plan

---

## 5. QA / TESTING PERSPECTIVE

### 5.1 Edge Cases Not Covered

#### Authentication Edge Cases
- [ ] User signs up with Google, then tries email with same email
- [ ] User signs up, deletes account, signs up again same email
- [ ] Session expires during active operation
- [ ] Multiple tabs open - session in one expires
- [ ] User changes password in another tab

#### Recording Edge Cases
- [ ] User records 0 seconds (clicks stop immediately)
- [ ] User records max duration (5 minutes) - hard stop?
- [ ] Audio file is corrupted/unreadable
- [ ] Deepgram returns empty transcript
- [ ] Deepgram returns gibberish (background noise)
- [ ] User's microphone has very low volume

#### Smartify Edge Cases
- [ ] Note with only special characters/emojis
- [ ] Note in non-English language
- [ ] Note with code snippets/technical content
- [ ] Very short note (1 sentence)
- [ ] Very long note (1 hour transcript)
- [ ] Already smartified note edited - smartify again?

#### Ask/Search Edge Cases
- [ ] Query with special characters/SQL injection attempts
- [ ] Very long query (>1000 characters)
- [ ] Query in different language than notes
- [ ] No notes have embeddings
- [ ] All embeddings are very old (pre-update)
- [ ] User asks same question twice rapidly

#### Payment Edge Cases
- [ ] User subscribes, immediately cancels
- [ ] Webhook arrives late (after user already upgraded manually)
- [ ] Multiple webhooks for same event (idempotency)
- [ ] User has multiple active subscriptions
- [ ] Payment fails but user still has access

### 5.2 Validation Gaps
- [ ] **Email Validation**: Format only, no MX record check
- [ ] **File Uploads**: No deep validation of audio file format
- [ ] **Text Inputs**: No XSS sanitization on user inputs
- [ ] **Date Inputs**: Date parsing could fail for many formats
- [ ] **URL Validation**: No validation of URLs (if any user-provided)

### 5.3 Race Conditions
- [ ] User clicks "Delete" multiple times before API responds
- [ ] Two tabs open, user deletes note in one tab
- [ ] User updates note while smartify is processing it
- [ ] Multiple smartify operations on same note
- [ ] User deletes account while background operations running

### 5.4 Timeout Scenarios
- [ ] Long-running API calls (smartify, transcription)
- [ ] Network timeout during file upload
- [ ] Database query timeout on large datasets
- [ ] OpenAI API timeout (60s default)
- [ ] Client-side timeout vs server-side completion

---

## 6. SECURITY PERSPECTIVE

### 6.1 Authentication & Authorization
- [ ] **RLS Policies**: All tables have proper RLS policies?
- [ ] **Service Role Usage**: Service role key used correctly (not exposed)?
- [ ] **Token Storage**: Access tokens stored securely (httpOnly cookies)?
- [ ] **Session Management**: Session timeout appropriate?
- [ ] **OAuth**: OAuth state parameter validated (CSRF protection)?

### 6.2 Data Protection
- [ ] **PII Handling**: User data encrypted at rest?
- [ ] **Sensitive Data**: No sensitive data in logs?
- [ ] **Data Deletion**: User data fully deleted on account deletion?
- [ ] **GDPR Compliance**: Can user export all their data?
- [ ] **Data Retention**: Old data archived/deleted?

### 6.3 API Security
- [ ] **Rate Limiting**: No rate limiting on any endpoints
- [ ] **Input Validation**: Limited input validation
- [ ] **SQL Injection**: Using Supabase client prevents, but RPC functions?
- [ ] **XSS**: User-generated content not sanitized before display
- [ ] **CSRF**: No CSRF tokens (relying on SameSite cookies)

### 6.4 File Upload Security
- [ ] **File Type**: Only checking extension, not magic bytes
- [ ] **File Size**: Enforced client-side but server-side?
- [ ] **Malicious Files**: No virus scanning on uploads
- [ ] **Storage Access**: Uploaded files publicly accessible?
- [ ] **Filename Sanitization**: User filenames sanitized?

### 6.5 Environment Security
- [ ] **Secrets in Code**: No secrets hardcoded (grep for API keys)
- [ ] **Env File Security**: .env.local in .gitignore?
- [ ] **HTTPS**: All production traffic over HTTPS?
- [ ] **CORS**: CORS properly configured?
- [ ] **Headers**: Security headers (CSP, HSTS, etc.)?

### 6.6 Third-Party Security
- [ ] **Dependencies**: Outdated dependencies with known vulnerabilities?
- [ ] **Supply Chain**: No lock file verification in CI/CD
- [ ] **API Keys**: Third-party API keys rotated regularly?
- [ ] **Webhooks**: Webhook signatures verified (LemonSqueezy)?
- [ ] **OAuth Scopes**: Minimal OAuth scopes requested?

---

## 7. CRITICAL BUGS TO FIX IMMEDIATELY

### 7.1 High Priority (P0)
1. **No Rate Limiting**: API routes unprotected - can be spammed
2. **No Input Sanitization**: XSS vulnerability in user-generated content
3. **Service Role Key**: Might be logged or exposed in errors
4. **No Error Tracking**: Silent failures in production
5. **File Upload Security**: No server-side file type validation

### 7.2 Medium Priority (P1)
1. **Duplicate Detection**: Just added unique constraint, needs thorough testing
2. **Phantom Recordings**: Just fixed, needs verification
3. **No Retry Logic**: Failed operations require manual retry
4. **No Background Jobs**: All operations synchronous
5. **No Monitoring**: Can't detect issues in production

### 7.3 Low Priority (P2)
1. **No Analytics**: Can't track feature usage
2. **No Feature Flags**: Can't gradually roll out features
3. **No A/B Testing**: Can't experiment with UX changes
4. **No User Feedback**: No in-app feedback mechanism
5. **No Help/Support**: No knowledge base or help center

---

## 8. TESTING CHECKLIST

### 8.1 Manual Testing Required
- [ ] Complete user journey from signup to first smartified note
- [ ] Test all error states with network throttling
- [ ] Test with different audio file sizes/formats
- [ ] Test with very long notes (30+ minutes of audio)
- [ ] Test concurrent operations (multiple tabs)
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on different devices (mobile, tablet, desktop)
- [ ] Test with slow internet connection
- [ ] Test with ad blockers enabled
- [ ] Test with browser extensions that modify DOM

### 8.2 Automated Testing Needed
- [ ] Unit tests for utility functions (normalizeTask, etc.)
- [ ] Integration tests for API routes
- [ ] E2E tests for critical user flows
- [ ] Load testing for concurrent users
- [ ] Security testing (OWASP Top 10)

### 8.3 Database Testing Required
- [ ] Test cascade deletes work correctly
- [ ] Test unique constraints prevent duplicates
- [ ] Test RLS policies prevent unauthorized access
- [ ] Test migrations on production-like data
- [ ] Test rollback migrations

---

## 9. PERFORMANCE OPTIMIZATION OPPORTUNITIES

### 9.1 Frontend Performance
- [ ] Implement code splitting for large components
- [ ] Lazy load modals and heavy components
- [ ] Optimize images with Next.js Image component
- [ ] Implement virtual scrolling for long lists
- [ ] Use React.memo for expensive renders
- [ ] Implement request deduplication
- [ ] Add service worker for offline support

### 9.2 Backend Performance
- [ ] Add database indexes for frequent queries
- [ ] Implement caching for expensive operations
- [ ] Use Edge runtime for simple API routes
- [ ] Batch database operations where possible
- [ ] Implement background job queue
- [ ] Add Redis for session/cache storage
- [ ] Optimize vector search queries

### 9.3 API Performance
- [ ] Implement response caching
- [ ] Add pagination to list endpoints
- [ ] Stream large responses
- [ ] Implement request batching
- [ ] Add compression (gzip/brotli)

---

## 10. FEATURE COMPLETION CHECKLIST

### 10.1 Core Features Status
- [x] User Authentication (Google OAuth + Email)
- [x] Voice Recording
- [x] Audio Transcription (Deepgram)
- [x] Note Management (CRUD)
- [x] Smartify (AI Extraction)
- [x] Action Items
- [x] Brain Dump
- [x] Investor Updates
- [x] Ask/Search (Vector Search)
- [x] Payment Integration (LemonSqueezy)
- [ ] Email Notifications
- [ ] Mobile App
- [ ] Browser Extension
- [ ] API for Third-Party Integrations

### 10.2 Missing Essential Features
- [ ] Note Export (PDF, Markdown, etc.)
- [ ] Note Sharing/Collaboration
- [ ] Team/Organization Support
- [ ] Advanced Search Filters
- [ ] Tags Management UI
- [ ] Bulk Operations
- [ ] Keyboard Shortcuts
- [ ] Dark Mode
- [ ] Customizable Templates
- [ ] Integration with Calendar/Email
- [ ] Zapier/Make Integration
- [ ] Data Export for GDPR

---

## 11. DOCUMENTATION GAPS

### 11.1 Developer Documentation
- [ ] API documentation (endpoints, request/response)
- [ ] Database schema documentation
- [ ] Architecture overview
- [ ] Deployment guide
- [ ] Contributing guidelines
- [ ] Code style guide (partially exists)

### 11.2 User Documentation
- [ ] User guide / Getting started
- [ ] FAQ
- [ ] Video tutorials
- [ ] Keyboard shortcuts reference
- [ ] Troubleshooting guide
- [ ] Privacy policy (exists)
- [ ] Terms of service (exists)

### 11.3 Operational Documentation
- [ ] Runbook for common issues
- [ ] Incident response plan
- [ ] Monitoring and alerting setup
- [ ] Backup and recovery procedures
- [ ] Scaling guidelines

---

## 12. TECHNICAL DEBT

### 12.1 Code Quality Issues
- [ ] Many TODO comments in code
- [ ] Inconsistent error handling patterns
- [ ] Mixed use of async/await and promises
- [ ] Some functions too long (>100 lines)
- [ ] Duplicate code in multiple places
- [ ] Magic numbers/strings not extracted as constants
- [ ] Console.log statements in production code

### 12.2 Architecture Issues
- [ ] No clear separation of concerns in some files
- [ ] Business logic in API routes (should be in services)
- [ ] No repository pattern for database access
- [ ] No DTO/validation layer
- [ ] No clear error handling strategy
- [ ] No logging strategy

### 12.3 TypeScript Issues
- [ ] Some `any` types used
- [ ] Inconsistent interface naming
- [ ] Missing return type annotations
- [ ] No strict mode enabled
- [ ] Database types manually maintained (should generate)

---

## 13. NEXT STEPS & PRIORITIZATION

### Phase 1: Critical Fixes (Week 1)
1. Implement rate limiting on all API routes
2. Add input sanitization for XSS protection
3. Set up error tracking (Sentry)
4. Add server-side file validation
5. Test and verify duplicate detection fixes
6. Add health check endpoint

### Phase 2: Stability & Monitoring (Week 2)
1. Implement proper logging service
2. Add performance monitoring
3. Set up database query monitoring
4. Implement retry logic for failed operations
5. Add comprehensive error handling
6. Set up automated backups verification

### Phase 3: Testing & QA (Week 3)
1. Write unit tests for critical functions
2. Write integration tests for API routes
3. Implement E2E tests for critical flows
4. Perform load testing
5. Security audit (OWASP Top 10)
6. Browser compatibility testing

### Phase 4: Performance & Polish (Week 4)
1. Implement caching strategy
2. Add pagination to list endpoints
3. Optimize database queries
4. Implement background job queue
5. Add missing empty states
6. Polish UI/UX issues

---

## 14. RISK ASSESSMENT

### High Risk Areas
1. **Payment Processing**: LemonSqueezy webhook handling - critical for revenue
2. **Data Loss**: No comprehensive backup testing
3. **Security**: Multiple security gaps identified
4. **Scalability**: No load testing performed
5. **AI API Costs**: No cost monitoring or alerts

### Medium Risk Areas
1. **User Experience**: Many edge cases could frustrate users
2. **Performance**: Performance under load unknown
3. **Data Consistency**: Several consistency issues identified
4. **Error Recovery**: Limited error recovery mechanisms

### Low Risk Areas
1. **UI Bugs**: Most UI issues are cosmetic
2. **Documentation**: Gaps won't affect functionality
3. **Technical Debt**: Can be addressed incrementally

---

## CONCLUSION

This codebase has **solid core functionality** but needs attention in:
1. **Security** (rate limiting, input validation)
2. **Monitoring** (error tracking, logging)
3. **Testing** (automated tests, edge cases)
4. **Error Handling** (retry logic, user feedback)
5. **Performance** (caching, optimization)

**Recommendation**: Focus on Phase 1 (Critical Fixes) immediately before broader user rollout.
