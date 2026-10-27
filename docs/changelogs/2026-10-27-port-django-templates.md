# 2026-10-27 — Port Django templates to Next.js and wire RTK Query

## What

Commits `92b4aac`..`b108b09` on `main`:

- **Views (no data):** `src/app/globals.css` (dark theme as Tailwind v4 `@theme` tokens, `.answer-content` / `.citation` styles for backend-rendered answers, `pulse-dot` animation), `src/app/layout.tsx` (sidebar + main shell), `src/components/Sidebar.tsx`, `src/app/page.tsx` + `src/components/UploadForm.tsx` (upload page at `/`), `src/app/chats/[chatId]/page.tsx` + `src/components/chat/*` (chat page). Removed create-next-app SVGs from `public/`.
- **API:** `src/types/chat.ts` (`IChat`, `IChatMessage`, `IDocumentChunk`, `ChatMessageRoleType`), `src/store/services/api.ts` (tags `chats`, `chat-messages`, `chat-chunks`; endpoints `getChatList`, `createChat`, `getChatMessages`, `sendMessage`, `reuploadChatPdf`, `getChatChunks`), `src/constants/chat.ts`, `src/lib/utils.ts` (`getErrorMessage`), `Providers` wired into the root layout. Sidebar, upload, chat messages/send and re-upload each connected in its own commit.

## Why

The `ask-my-pdf` Django repo held both UI (templates in `chats/templates/chats/`) and API. This repo takes over the UI so the Django repo can become backend-only.

## How

- Routes: `/` = upload page (was `/chats/`), `/chats/[chatId]` = chat (was `/chats/<pk>/`).
- Endpoints follow the planck `api.ts` conventions (`build`, `{ data: FormData }` args, `invalidatesTags: (_, error) => (error ? [] : [...])`); per-chat tags carry the chat id so sending a message refetches only that chat.
- Send flow mirrors `chat.html`: optimistic user bubble + thinking dots while the POST runs; the bubble is dropped once the refetched history contains the saved message ids (no flicker); on error the bubble stays with an "Error: …" bubble.
- `cacheComponents: true` consequences: `params` is read inside `<Suspense>` on the chat route; `Sidebar` (uses `usePathname`) is wrapped in `<Suspense>` in the layout; `ChatView` is keyed by `chatId`, and `UploadForm` resets itself after upload, because Activity keeps hidden routes mounted.
- Tradeoff: the backend paginates every list (20/page) and has no chat-detail endpoint. We request one large page (`CHAT_LIST_LIMIT = 100`, `MESSAGE_LIST_LIMIT = 1000`) and take the chat title from the chat list. Chats beyond 100 show the title "Chat" and are missing from the sidebar.

## Affected modules and behaviors

Frontend only. No backend changes. No auth (backend has none).

## Intended outcome

The Next.js app reproduces every template feature (list, upload, chat, ask, re-upload) against `NEXT_PUBLIC_API_URL`. Signal: with backend CORS enabled, each flow works in the browser with no console errors.

## Verification

Per commit, on a snapshot with all other changes stashed: `npm run build` passed (routes `/`, `/chats/[chatId]`), `npx eslint .` showed only the pre-existing `no-explicit-any` error in `src/types/api.ts`, prettier check clean on committed files. `curl` against the dev server returned 200 for `/` and `/chats/9` with expected markup (after phase 1).
**Unverified:** nothing was exercised in a browser. The backend sends no CORS headers, so browser calls from the Next app are blocked until CORS is added. Visual parity with the templates was checked by reading CSS only.

## Critical notes

- **Blocker:** backend must allow the frontend origin (CORS) before the app works. The user owns that change.
- `.env.example` points at `:8000`; the backend dev server runs on `:9001`.
- `npm run lint` is broken (`next lint` was removed in Next 16); use `npx eslint .`.
- `content_html` is rendered with `dangerouslySetInnerHTML`; safe only because backend `render_answer` html-escapes before adding tags. Keep that invariant if the backend renderer changes.
