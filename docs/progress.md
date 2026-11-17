# Implementation ledger
Plan: docs/superpowers/plans/2026-11-17-birthday-studio.md

Preflight: empty project, no project AGENTS or skills; global instructions read. No usable Git repository, so no Git-based plan helpers or worktree. User forbids commits/deployment.
Ruling: proceed inline without plan approval because user explicitly requests implementation and independent work despite missing credentials.
Ruling: keep bounded raster photo within each private JSON snapshot. One conditional object write atomically commits text, photo and publication state; avoids dangling uploads and cross-object races. Cost: larger reads, acceptable for a small family collection.
Ruling: production login requires private Blob-backed global attempt counter; development without Blob uses a process-local counter. Cost: global 10 attempts/15 minutes can temporarily lock out the admin during an attack, preferable to an ineffective distributed limiter. No IP headers are trusted.
Interfaces: content validation is shared by editor, API and record transitions. Record transitions retain immutable ID and slug; Blob uses ETag from editor to reject stale writes. Public routes select published snapshot only.

Implementation: foundation, shared newspaper/editor, authentication, Blob adapter, dashboard and public routes implemented.
Tests: 14 unit tests PASS; 4 browser scenarios PASS; TypeScript and lint PASS; production dependency audit 0 vulnerabilities.
Final review: independent read-only reviewer found missing concurrency coverage; addressed with stale revision, competing saves, unpublish/delete races and limiter reservation tests.
Ruling: bounded raster portraits remain inside private records to preserve atomic publishing. See README for read-cost tradeoff.
Ruling: content limits were tightened to name 50, headline 60, story 700, memories 500, wishes 400, closing 200 after printed wide-text stress tests; this preserves a readable two-page layout without clipping.
Print: sample, maximum prose, maximum wide text each exactly two A4 pages; rendered pages inspected. Five requested viewport widths pass for editor and preview.
Build follow-up: first build exposed static prerendering of /admin/new when credentials absent. Both protected editor pages now force dynamic rendering; rebuild verifies final route classification.
Live integration remains BLOCKED: no private Blob token or real admin settings. No fake persistence, production writes, Git mutations or deployment.
