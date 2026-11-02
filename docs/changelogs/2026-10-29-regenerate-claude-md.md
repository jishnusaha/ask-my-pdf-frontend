# 2026-10-29 — Regenerate CLAUDE.md from the code

## What

`CLAUDE.md` only (it had been deleted from the working tree; HEAD's copy was `7910eb7`). Rewritten after re-reading the whole `src/` tree, the configs, and the backend repo's API layer and settings.

## Why

`/init` was run. The prior copy was a good base but carried stale and incomplete claims.

## How

Kept the structure (Commands / Backend / Layout / Conventions / Gotchas / Session continuity) and corrected or added:

- **CORS (stale):** the prior file said "the backend sends no CORS headers as of 2026-10-27". The backend (`main` @ `018a895`) now has `django-cors-headers` in `INSTALLED_APPS` and `CorsMiddleware` in the stack, driven by `CORS_ALLOWED_ORIGINS` (`config/settings.py:42`, default empty). Reworded to "the env var is probably unset", still the user's change to make.
- `POST /chats/api/<id>/messages/` returns **201** with an unpaginated array of just-created messages (`chats/api/views.py:43-58`); pagination is `LimitOffsetPagination`, `PAGE_SIZE` 20 (`config/settings.py:152-157`); auth _and_ permission classes are both empty lists, not just "no auth".
- `npm run lint:fix` is broken for the same reason as `npm run lint`; added the real error text.
- Added the prettier baseline failure (`src/store/index.ts`), `npx next typegen` before `tsc --noEmit`, the `.prettierrc` missing-`tailwindStylesheet` sorting quirk, the underscore-unused-var lint rule, and the Tailwind v4 preflight deltas — all promoted from `.claude/agent-memory/implementer/frontend-tooling-traps.md`, which the prior file never pointed at.
- Added that `tailwind.config.ts` is vestigial (Tailwind v4 config lives in `globals.css`, which has no `@config`), and that `Sidebar`/`ChatView` must pass identical `useGetChatListQuery` args to share one cache entry.
- Added a verification footer pinning both repos' commits, per the documentation-accuracy rule.

## Affected modules and behaviors

Docs only. No code, config, or dependency changes.

## Verification

- `npm run lint` → failed as documented: `Invalid project directory provided, no such directory: …/lint`.
- `npx eslint .` → `1 problem (1 error, 0 warnings)`, `@typescript-eslint/no-explicit-any` at `src/types/api.ts:2`.
- `npx prettier --check CLAUDE.md` → failed, then `--write`; now clean.
- **Unverified:** nothing was run in a browser, and `npm run build` was not re-run (no code changed). Backend claims were read from source in `../ask-my-pdf`, not exercised against a running server.

## Critical notes

- The `dangerouslySetInnerHTML` invariant (backend `render_answer` escapes before adding tags) is carried forward in CLAUDE.md; it is still the one security-relevant assumption in the UI.
- `.env.example` still points at `:8000` while the backend dev server runs on `:9001`. Documented rather than changed — fixing the example file is a separate call.
