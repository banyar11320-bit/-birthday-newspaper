# Mon Family Birthday Studio Implementation Plan

> Execute inline with the executing-plans and test-driven-development skills. User authorization to implement takes precedence over skill handoff/commit steps; no commits or deployment.

**Goal:** Two-page birthday newspaper editing with secure private persistence and explicit publishing.
**Architecture:** Next.js server-rendered routes with a small client editor. A private Blob object per immutable UUID holds draft and published snapshots, including a bounded raster portrait; conditional ETag writes prevent lost updates. No shared content index. Durable login throttling uses a separate private conditional-write object.
**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind v4, Vercel Blob, Node crypto.
**Spec:** User attachment at /home/mbanyar/.codex/attachments/724a2307-028a-4abf-89d1-0758fbb85a7c/Pasted text.txt.

## Global constraints
No Supabase, database, paid AI, commits, pushes, deployment, or production storage mutations. Missing credentials must not block independent local editor/preview work. Never claim a save or publish without storage success.

## Review focus
- Concurrent edits: reject stale revisions; never overwrite another edition.
- Editing published content: draft changes stay private until republished.
- Expired or forged session: all writes reject before accessing storage.
- Unpublish/delete: consistent uncached reads stop public access immediately.
- Long content and narrow screens: bounded text, whitespace normalization, two A4 sheets and mobile reflow.

## Task 1: Content and newspaper editor
Files: lib/content.ts, components/newspaper.tsx, components/editor.tsx, app/globals.css, app/studio/page.tsx, tests/content.test.ts.
Interface: Content, validateContent(input), LIMITS; editor consumes optional stored record.
- [x] Write validation tests for invalid dates, missing names, long text, unsupported/oversized photos and multiline normalization; run and see failure.
- [x] Implement validation, example content, two-page rendering and editor with unsaved-change protection.
- [x] Run focused tests; browser test local preview and print.

## Task 2: Authentication
Files: lib/auth-core.ts, lib/auth.ts, lib/rate-limit.ts, app/api/auth/*/route.ts, tests/auth.test.ts, scripts/hash-password.mjs.
Interface: signed expiring session, server password verification, requireAdmin(), same-origin mutation guard.
- [x] Test tamper/expiry, malformed hash, wrong password, missing secrets and throttling.
- [x] Implement scrypt password hashes, HMAC cookies, bounded login attempts; production requires durable Blob limiter.
- [x] Run focused tests and unauthorized HTTP checks.

## Task 3: Persistence and publishing
Files: lib/store.ts, lib/records.ts, app/api/newspapers/**, app/api/portrait/**, app/admin/page.tsx, app/birthday/[slug]/page.tsx, tests/records.test.ts.
Interface: per-id CAS read/write, draft/published separation, immutable ID/slug, tombstones on delete.
- [x] Test member isolation, draft save preserving publication, unpublish/delete, stale revision conflict with an in-memory conditional store.
- [x] Implement private Blob adapter and authenticated routes; list records directly with pagination, no index.
- [x] Verify offline behavior; classify live Blob workflows BLOCKED without credentials.

## Task 4: Verification and documentation
Files: README.md, .env.example, tests browser evidence and docs/verification.md.
- [x] Typecheck, lint, tests, production build once after implementation.
- [x] Browser checks at 320, 375, 390, 430, 1280; two-page PDF and no clipped content.
- [x] Independent final review; fix material issues and report evidence/limits.

Local implementation and verification completed. Live Blob integration verification remains BLOCKED; see docs/verification.md. Initial tests were written first, but dependency installation delayed their execution; later bug/concurrency regressions were run red then green.
