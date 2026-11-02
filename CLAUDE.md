# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Next.js 16 frontend for AskMyPDF (chat with a PDF). It replaces the Django templates that used to live in the backend repo at `../ask-my-pdf` (`chats/templates/chats/`); all data comes from that repo's DRF API. `AGENTS.md` (written by `next dev`) covers Next 16 specifics: read the bundled docs in `node_modules/next/dist/docs/` before writing route code.

## Commands

```bash
npm run dev                    # :3000
npm run build                  # also type-checks; the reliable "does it work" check
npx eslint .                   # NOT `npm run lint` / `lint:fix` — see below
npx prettier --write <files>   # prettier-plugin-tailwindcss sorts classes
npx next typegen               # regenerate PageProps/LayoutProps after adding a route
```

- `npm run lint` and `npm run lint:fix` are **broken**: they call `next lint`, removed in Next 16, so the arg is read as a directory (`no such directory: …/lint`). Use `npx eslint .`.
- There is no test suite. `npm run build` plus `npx eslint .` is the whole gate.
- Known baseline failures, not yours: `npx eslint .` reports exactly one error, `@typescript-eslint/no-explicit-any` in `src/types/api.ts:2`; `npx prettier --check .` fails on `src/store/index.ts`. Anything beyond those two is new.
- `npx tsc --noEmit` only works after a build has generated `.next/types` (or `npx next typegen`), because `PageProps<'/chats/[chatId]'>` and `LayoutProps<'/'>` are generated global types.
- `npm run build` can run while `next dev` is running (dev writes `.next/dev`).

## Backend

Repo `../ask-my-pdf`. Dev server: `python manage.py runserver 9001` (plain `runserver` binds :8000, which does not match its default `CSRF_TRUSTED_ORIGINS`).

- `NEXT_PUBLIC_API_URL` is the RTK Query `baseUrl` (`src/store/services/api.ts`). Use `http://127.0.0.1:9001` locally — note `.env.example` still says `:8000`.
- API lives under `/chats/api/`, and **trailing slashes are required**:
  - `GET`/`POST` `/chats/api/` — list chats, or upload a PDF (multipart `pdf`, optional `title`); POST returns the new chat.
  - `GET`/`POST` `/chats/api/<id>/messages/` — the POST takes JSON `{question}` and returns `201` with a plain (unpaginated) array of the messages just created, i.e. `[user, assistant]`. The frontend no longer calls this POST.
  - `POST` `/chats/api/<id>/messages/stream/` — what the chat page uses. Same JSON `{question}`; 400/404 come back as normal JSON before the stream starts, otherwise `200 text/event-stream` with frames `event: token` (`{delta}`, zero or more), then exactly one of `event: done` (`[user, assistant]`, same shape as above) or `event: error` (`{detail}`, generic). Nothing is saved on `error` or client disconnect. Headers only arrive with the first token (~3–5 s).
  - `POST` `/chats/api/<id>/reupload/` — multipart `pdf`.
  - `GET` `/chats/api/<id>/chunks/`.
- Every GET list is paginated: `{count, next, previous, results}`, `LimitOffsetPagination`, `PAGE_SIZE` 20.
- There is **no chat-detail endpoint**, so the chat title comes from the chat list.
- No auth and no permissions (`DEFAULT_AUTHENTICATION_CLASSES` and `DEFAULT_PERMISSION_CLASSES` are both empty); chats have no owner.
- CORS is the backend's job: it has `django-cors-headers` wired up, driven by `CORS_ALLOWED_ORIGINS` (an env list, default **empty**). If browser calls from :3000 fail, that env var is unset — the user owns that change. Don't edit the backend repo for it. As of 2026-11-02 the local backend allows `http://localhost:3000` but not `http://127.0.0.1:3000` (checked by preflight), so open the dev server via `localhost`.

## Layout

- `src/app/page.tsx` is the upload page (`/`), `src/app/chats/[chatId]/page.tsx` the chat page. The root layout holds the sidebar + main shell.
- `src/components/`: `Sidebar`, `UploadForm`, `chat/*` (`ChatView` composes `ChatHeader`, `ReuploadBar`, `MessageList`, `MessageInput`).
- `src/store/services/api.ts` holds every request/response endpoint and the tags `chats`, `chat-messages`, `chat-chunks`; per-chat tags carry the chat id.
- The one exception is asking a question: `src/store/services/messageStream.ts` (`streamMessage`) is a plain `fetch` over the SSE endpoint, because a streaming response doesn't fit RTK Query (a callback arg would land in Redux state). It throws `{status, data}` objects shaped like RTK rejections, so `getErrorMessage` handles them. `src/lib/sse.ts` is the generic SSE frame parser.
- `src/types/*.ts` holds API interfaces, `src/constants/chat.ts` the page-size limits, `src/lib/utils.ts` the `getErrorMessage` helper for `.unwrap()` rejections (handles `FETCH_ERROR`, `detail`, `error`, and DRF field-error objects).
- Each API feature lives in its own component file, so features can be built, reviewed and committed independently. Don't centralize the mutations into one container.

## Conventions

Follow the planck project (`/Users/jishnusaha/Soumashis/planck/src/store/services/api.ts`, `src/types/*.ts`):

- Name the RTK Query builder `build`.
- File-upload mutations take a `{ data: FormData }` argument.
- Mutations use `invalidatesTags: (_, error) => (error ? [] : [...])`.
- Interfaces are `I`-prefixed; string unions are named `XType`; fields stay snake_case, exactly as the API returns them.
- Components call `await mutation(args).unwrap()` inside try/catch and render the error themselves.
- Colors are Tailwind v4 `@theme` tokens in `src/app/globals.css` (`bg-page`, `bg-surface`, `text-fg`, `bg-accent`, `text-ghost`, …). Use the tokens, not hex values.
- Commit one feature at a time, each building on its own. Messages are short and imperative ("Add …", "Connect … to api").

## Gotchas

- **`cacheComponents: true`** (`next.config.ts`):
  - Reading `params`, or calling `usePathname()`, on a dynamic route needs a `<Suspense>` boundary or `next build` fails (`CLIENT_HOOK_DYNAMIC`). That is why `Sidebar` is wrapped in the root layout and `params` is awaited inside `<Suspense>` on the chat route.
  - Next keeps hidden routes mounted (React `<Activity>`), so local state survives navigation: `ChatView` is keyed by `chatId`, and `UploadForm`/`ReuploadBar` reset themselves after success.
- Assistant `content_html` is rendered with `dangerouslySetInnerHTML` in `MessageBubble`. That is safe only because the backend's `render_answer` html-escapes the text before adding tags. Never render user content as HTML, and recheck this if the backend renderer changes.
- Lists request one large page (`CHAT_LIST_LIMIT` 100, `MESSAGE_LIST_LIMIT` 1000) instead of paginating. `Sidebar` and `ChatView` must pass **identical** args to `useGetChatListQuery` so they share one cache entry — `ChatView` reads the title out of that list via `selectFromResult`. Chats past the first 100 are missing from the sidebar and fall back to the title "Chat".
- **Send flow** (`ChatView`): tokens accumulate into a plain-text bubble (no client-side Markdown — the backend's `render_answer` stays the only renderer). On `done`, the saved messages are patched into the `getChatMessages` cache with `updateQueryData` (no refetch); the ids are committed with `flushSync` *first*, because RTK auto-batches `queryResultPatched` to the next frame, and `isPendingSaved` then hides the streamed bubbles in the same render the saved ones appear. If the patch is empty (history not loaded yet) it falls back to invalidating the tag. The `updateQueryData` args must equal the `useGetChatMessagesQuery` args (`messagesArgs`). The stream is deliberately not aborted on unmount: the backend saves nothing on disconnect, so leaving mid-answer would lose the question.
- `tailwind.config.ts` is vestigial: Tailwind v4 is configured in CSS and `globals.css` has no `@config` directive, so edits there do nothing.
- `.prettierrc` sets no `tailwindStylesheet`, so the plugin doesn't know the custom `@theme` tokens and sorts them to the front of a class list. That output is stable and passes `--check`; don't hand-sort.
- ESLint flags underscore-prefixed unused vars too; an intentionally unused prop needs an explicit `// eslint-disable-next-line @typescript-eslint/no-unused-vars -- reason`.
- Tailwind v4 preflight differs from the old Django templates: `button` has no pointer cursor (add `cursor-pointer`), `ul`/`ol` lose markers (restored under `.answer-content`), `h2` loses bold, and native file inputs lose their UA look (styled via `file:` variants).

## Session continuity

Changelogs go in `docs/changelogs/` (one per session, `YYYY-MM-DD-<slug>.md`), decisions in `docs/decisions/DECISIONS.md`. Read both before proposing an approach, and write the changelog before the session ends. `.claude/agent-memory/` is committed institutional knowledge — `implementer/frontend-tooling-traps.md` holds verified tooling quirks.

---

_Verified against this repo's `main` @ `7910eb7` and the backend `main` @ `018a895` on 2026-10-29. The broken `npm run lint` and the eslint baseline were checked by running them; API routes, pagination, auth and CORS settings were read from the backend source. Nothing was exercised in a browser._

_Streaming sections (the `/messages/stream/` row, the `messageStream.ts` layout note, the send-flow gotcha, the CORS origin note) verified on 2026-11-02 against the backend `main` @ `41c7ac8`: the protocol was read from `chats/api/views.py`, the client was exercised against a local mock SSE server (node, 24 cases), and the CORS origins were checked by a real preflight to the running backend. The send flow was **not** exercised in a browser against the real backend._
