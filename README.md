# Mon Family Birthday Studio

A small Next.js App Router application for creating two-page A4 birthday newspapers. React, TypeScript, Tailwind CSS v4, private Vercel Blob storage, and browser-native PDF printing. No database or AI service.

## Run locally

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open `/studio` to edit the sample, upload a portrait, preview, and print without credentials. Work remains only in the current tab; there is deliberately no simulated save or publishing. `/admin` is the authenticated persistent workflow.

## Configure admin access

Set these server-only values in `.env.local` (and later in your hosting environment):

- `ADMIN_USERNAME`: the single administrator's username.
- `ADMIN_PASSWORD_HASH`: run `npm run hash-password` in an interactive terminal. The password input is hidden; only the salted scrypt hash is printed. Use a unique password of at least 16 characters. Hash format: `scrypt:<32 hex salt>:<128 hex key>` with Node's scrypt defaults (N=16384, r=8, p=1).
- `SESSION_SECRET`: generate with `openssl rand -hex 32`.
- `BLOB_READ_WRITE_TOKEN`: token for a **private** Vercel Blob store. Never use a public store or a `NEXT_PUBLIC_` environment variable for these secrets.

There is no signup. Sessions are HMAC-signed, expire after eight hours, and use HTTP-only, SameSite=Strict cookies. Production cookies use Secure and the `__Host-` prefix. Changing the username, password hash, or session secret invalidates existing sessions. Logout clears the current browser cookie; already issued bearer sessions otherwise expire after eight hours.

All mutations verify the session on the server and reject foreign/missing origins. Login reserves one of ten attempts per fifteen-minute window before checking the password. The cap is global for this single-admin application. Production requires the durable private Blob counter and fails closed on races or storage failure. Development without Blob uses a process-local counter, which resets on server restart. Additional hosting-level request limits are appropriate for an Internet-facing deployment.

## Private storage and publishing

Connect a development/private Blob store before testing persistence. No production store was changed during implementation.

Each edition has an immutable random UUID, also used as its stable public slug. One private object at `newspapers/<uuid>.json` contains its draft, published snapshot, and publication metadata. Each snapshot includes a bounded base64 JPEG/PNG portrait. This intentionally avoids partially committed text/photo updates and unsafe multi-object transactions. It trades larger object reads for a simpler, atomic workflow suitable for a small family collection.

- Save Draft never changes the published snapshot.
- Publish validates required text and portrait, then updates that edition's published snapshot.
- Unpublish removes the published snapshot.
- Delete replaces the record with a small tombstone, erasing its text/photo snapshots and preventing stale requests from recreating it. The UUID/timestamp tombstone is intentionally retained.
- ETag conditional writes reject stale edits and concurrent overwrites. Reloading after a conflict discards unsaved edits, so copy any text you need first.
- The dashboard lists individual objects with pagination; no shared JSON index exists. Deleted records can occupy a page of listing results; use Next editions when shown.
- Public pages and image routes use consistent private reads (`useCache: false`), are dynamically rendered, and do not cache personalized responses. Only the published snapshot is rendered. Raw Blob URLs/tokens are never exposed.
- Unpublishing cannot retract copies, screenshots, PDFs, or pages a visitor has already opened.

The UI accepts JPEG/PNG source files up to 5 MB, resizes them to at most 1400 pixels on the longest side, and re-encodes to JPEG. The server enforces payload/field limits and checks raster MIME/magic bytes. SVG, remote image URLs, and oversized portraits are rejected. The saved image is limited to approximately 1 MB. Text is normalized to a single paragraph per field for predictable printing.

## Print / Save PDF

Use Preview, then **Print / Save PDF**. In your browser choose A4, portrait, 100% scale, no custom margins, no headers/footers, and background graphics enabled. The stylesheet provides two A4 pages, hides controls, and preserves image proportions. The same newspaper component renders local previews, admin previews, and public editions. Mobile screen mode reflows for readable text.

Public pages default to `noindex`, `nofollow`, and `noarchive`; this is a crawler preference, not access control. Anyone who has a published URL can read and share it. Social metadata uses the published name but no birth year or private draft text.

## Verification

```sh
npm test
npm run typecheck
npm run lint
npm run build
npx playwright test
```

Browser tests launch an isolated development server on `127.0.0.1:3017` with temporary test-only authentication and **no Blob token**, so they cannot mutate real storage. Set `CHROME_PATH` if Chrome is not at `/opt/google/chrome/chrome`. Browser tests produce screenshots and PDFs in ignored `artifacts/`.

The unit concurrency tests use an in-memory conditional-store adapter to test the same revision/limiter code used by Blob. They are not evidence of live Blob persistence. See `docs/verification.md` for the measured results and external blockers.

The `zod` override pins patched 4.6.7 within major version 4 because the Blob SDK's CLI configuration dependency pins vulnerable 4.1.11. Revisit this override when upstream updates; do not blindly run `npm audit fix --force`.

## Storage references

- [Vercel Blob SDK: private access, ETags and conditional writes](https://vercel.com/docs/vercel-blob/using-blob-sdk)
- [Consistent private Blob reads](https://vercel.com/changelog/vercel-blob-now-supports-consistent-reads-on-private-storage)

No commit, push, deployment, production storage mutation, or paid AI call is part of this setup.

## First GitHub push and Vercel setup

This directory must first be initialized as a Git repository and connected to your intended GitHub repository. Review the proposed files before authorizing the first commit and push. No commit, push, or deployment has been performed by this preparation step. `.gitignore` excludes environment files (except the blank `.env.example`), Vercel-local configuration, logs, signing keys, local agent state, dependencies, build output, and verification artifacts. Ignore rules do not protect a secret pasted into source code or force-added to Git; inspect the staged diff before each push.

After the GitHub push is separately approved, configure the Vercel project:

- Framework preset: **Next.js**; root directory: this repository's root.
- Install command: `npm ci`; build command: `npm run build`; output directory: leave the Next.js default. Do not use static export: authentication and private storage require server functions.
- Node.js: select **22.x**, a supported runtime satisfying Next.js's minimum. The existing local checks used Node 20.19.5; hosting-runtime verification remains pending.
- Set `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, and `BLOB_READ_WRITE_TOKEN` as server-only environment variables. Copy the hash exactly, without shell quotes. Never add `NEXT_PUBLIC_` prefixes.
- Connect a **private** Blob store. Use a separate development/Preview store and credentials for integration testing; do not connect test deployments to production family data.
- Production login deliberately fails closed without private Blob storage because the login attempt counter must be durable.
- Verify save/reload, publishing, public viewing, unpublishing, and two-member isolation in the test environment before production use. No deployment is authorized by these instructions.

The application's request cap is 1.5 MB, and a saved record with both draft and published portraits is under 3 MB, below Vercel's documented 4.5 MB function payload limit. No local disk persistence, browser automation, or PDF service runs in production.

References: [supported Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [function limits](https://vercel.com/docs/functions/limitations), [environment configuration](https://vercel.com/docs/environment-variables).
