---
name: frontend-tooling-traps
description: Verified tooling quirks in the ask-my-pdf-frontend repo (prettier tailwind sorting, eslint unused vars, Next 16 typegen, Tailwind v4 preflight)
metadata:
  type: project
---

- `npx prettier --check src` still fails on src/store/index.ts (pre-existing, read-only in most slices); src/store/services/api.ts was formatted during the phase-2 wiring. Check only your own files.
- `.prettierrc` has no `tailwindStylesheet`, so prettier-plugin-tailwindcss does not know custom `@theme` tokens (e.g. `border-border`, `bg-surface`) and sorts them to the front of the class list. Output is stable and passes `--check`; do not hand-sort.
- ESLint (`npx eslint .`) baseline: 1 error (src/types/api.ts any), 0 warnings (the `_` warning in api.ts went away once endpoints used `build`). Underscore-prefixed unused vars still warn, so an intentionally unused prop needs `// eslint-disable-next-line @typescript-eslint/no-unused-vars -- reason`.
- `PageProps<'/route/[id]'>` / `LayoutProps` are global types generated into `.next/types`; run `npx next typegen` after adding a route before `npx tsc --noEmit`.
- `cacheComponents: true`: a dynamic route without generateStaticParams must read `params` inside `<Suspense>` (build shows it as Partial Prerender). Pattern lives in src/app/chats/[chatId]/page.tsx.
- Tailwind v4 preflight differences vs the Django templates: `button` cursor is default (add `cursor-pointer`), `ul/ol` lose markers (restored in `.answer-content`), `h2` loses bold, native file-input button loses its UA look (styled via `file:` variants).
- `npm run build` can run alongside a dev server (dev uses `.next/dev`); `next start -p 3100` is a safe way to curl-check prerendered output.
- `usePathname()` in a client component under the root layout (Sidebar) fails `next build` for `/chats/[chatId]` unless wrapped in `<Suspense>` in src/app/layout.tsx (CLIENT_HOOK_DYNAMIC).
- To prove commit groups build independently without touching git: rsync repo to scratchpad, `cp -cR node_modules` (APFS clone, ~3s), `git show HEAD:<file>` the files of other groups, run `npm run build` + `npx tsc --noEmit` (tsc only after a build has generated .next/types).
- RTK Query logic (URLs, params, tag invalidation) can be checked in plain node: transpile api.ts with `ts.transpileModule`, import from `@reduxjs/toolkit/query`, point NEXT_PUBLIC_API_URL at a local http server. After `await mutation.unwrap()` the invalidated query is already `pending`.
