# Verification — 2026-11-17

## Result

Local MVP implemented and verified. Live Vercel Blob persistence and published-page integration are **BLOCKED** by missing private-store credentials. Actual admin credentials are also not configured; browser authentication tests used isolated, temporary development credentials. No live Blob operations, deployments, commits, or pushes were performed.

| Requirement | Result | Evidence / limitation |
|---|---|---|
| Admin login/logout | PASS (local) | Browser test signs in with ephemeral credentials, verifies HttpOnly/SameSite=Strict cookie, opens protected editor, and logs out. |
| Unauthorized access | PASS (local) | Unauthenticated POST/PATCH/private GET rejected with 401; foreign-origin login rejected with 403; protected editor redirects. |
| Rate limiting | PASS (local + unit) | Repeated wrong passwords reach 429; subsequent correct password is also blocked. Concurrent durable reservations admit only one writer in conditional-store tests. |
| Create newspaper | PASS (record logic); BLOCKED (live) | Unique UUID and stable slug tested; real Blob creation requires credentials. |
| Save/reload draft | BLOCKED (live) | Draft transition and validation pass unit tests; no durable storage claim. Save/Publish disabled when storage absent. |
| Edit existing edition | PASS (record logic); BLOCKED (live) | Changing name preserves ID/slug; draft edit does not alter published snapshot. |
| Publish | PASS (record logic); BLOCKED (live) | Required content checked; published snapshot selected separately. No live publication claimed. |
| Public published link | BLOCKED (live) | Dynamic route and published-only renderer implemented, but no live published object available. |
| Draft/unpublished privacy | PASS (logic/access gates); BLOCKED (live Blob isolation) | Private API rejects guests; unavailable public page and portrait return 404; unpublish/delete clear public snapshot in tests. Real private-store configuration unverified. |
| Member A/B isolation | PASS (unit); BLOCKED (live) | Independent IDs/records tested; competing saves admit one winner without modifying Member B. |
| Stale edits and revocation races | PASS (unit) | Stale ETag rejects; unpublish/delete racing stale save cannot be overwritten. Production uses same helper plus provider `ifMatch`. |
| PDF print layout | PASS (Chrome) | Sample, all-field maximum prose, and wide unbroken maximum text each export exactly 2 A4 pages. `pdfinfo`: 594.96 × 841.92 pt. Rendered stress pages visually checked for clipping/overlap; no controls printed. |
| Responsive layout | PASS (Chrome) | Editor and preview checked at 320, 375, 390, 430, 1280 px with no horizontal page overflow. Screenshots inspected. |
| Portrait upload | PASS (browser) | SVG rejected; real PNG decoded, resized, and displayed. Server tests reject malformed MIME/magic bytes, remote URLs, and oversized data. |
| Unsaved edits | PASS (browser) | Edited content remains when user cancels navigation. Inputs disabled before hydration to prevent lost early typing. |
| TypeScript | PASS | `npm run typecheck` and build's typecheck. |
| ESLint | PASS | `npm run lint`, no errors/warnings. |
| Unit suite | PASS | `npm test`: 14 tests. |
| Browser suite | PASS | `npx playwright test`: 4 scenarios. |
| Production build | PASS | `npm run build` completed; `/admin`, `/admin/new`, `/admin/edit/[id]`, `/birthday/[slug]` and API routes are dynamic. Both editor routes avoid build-time authorization snapshots. |
| Production dependency audit | PASS | `npm audit --omit=dev`: 0 vulnerabilities. |
| Deployment / real production auth / cross-browser printing | NOT TESTED | No deployment authorized; only local Chrome used. |

## Artifacts

Ignored `artifacts/` contains `studio-<width>.png`, `sample.pdf`, `maximum-content.pdf`, `wide-content.pdf`, and rendered PDF pages. These are test outputs with a synthetic portrait, not real family publications. Bundled Poppler was incompatible with host glibc, so `/usr/bin/pdfinfo` and `/usr/bin/pdftoppm` were used successfully.

## Review and fixes

Independent read-only review found no critical security issue and identified missing concurrency regression coverage. Four concurrency tests were added using the same conditional-update/reservation helpers as the Blob adapter. Print stress testing confirmed overflow; content limits and print spacing were adjusted and retested. Local origin validation now uses the browser-facing Host because Next normalizes `request.url` to localhost. No arbitrary forwarded host header is trusted.

## Required next step

Configure a **development private** Vercel Blob store plus the admin environment variables using README.md, restart, then run the live create/save/reload/edit/publish/public-view/unpublish/delete sequence with two test members. Confirm stale edits reject and direct unauthenticated private-object reads fail. Do not promote to production until this integration verification passes.

Final production smoke: local `/studio` returns 200; absent birthday returns 404. Unauthenticated `/admin/new` streams a login redirect (HTTP 200 because of its loading boundary), with no editor form/content exposed. Local production server is available on port 3017; no test credentials are injected into it.
