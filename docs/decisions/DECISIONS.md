# Decision log

## 2026-10-27 — Frontend calls the Django API directly; CORS is the backend's job

RTK Query's `baseUrl` is `NEXT_PUBLIC_API_URL` and the browser calls the DRF API cross-origin. **Why:** matches the existing RTK setup and the planck pattern; keeps the backend a plain API. **Rules out:** a Next.js rewrite proxy for `/chats/api/*` (considered, rejected by the user). The backend repo must add CORS for the frontend origin.

## 2026-10-27 — One large page instead of pagination UI; title from the chat list

Sidebar requests `limit=100` chats, chat page `limit=1000` messages, and the chat title is looked up in the chat list. **Why:** the templates showed everything and the backend has no chat-detail endpoint. **Rules out:** nothing permanent — the right fix is a backend `GET /chats/api/<pk>/` plus pagination/infinite scroll; revisit when users exceed those limits.

## 2026-10-27 — Per-feature file boundaries for components

Each API feature lives in its own component (`Sidebar`, `UploadForm`, `ChatView`, `ReuploadBar`), with shared pieces only in `src/types/chat.ts`, `src/store/services/api.ts`, `src/constants/chat.ts`, `src/lib/utils.ts`. **Why:** lets features be built, reviewed and committed independently. **Rules out:** a single chat container owning every mutation.

## 2026-11-02 — Answers stream through a plain fetch service, not RTK Query; saved messages are patched into the cache

`streamMessage` (`src/store/services/messageStream.ts`) POSTs to `/messages/stream/` and reads SSE with `fetch` + `getReader()`. `ChatView` patches the `done` messages into the `getChatMessages` cache with `updateQueryData` instead of invalidating it, and does not abort the stream on unmount. The non-stream `sendMessage` mutation was removed. **Why:** a streaming response doesn't fit an RTK Query endpoint (a per-token callback in the args would land in Redux state). The patch saves a refetch of up to 1000 messages per question. And the backend saves nothing on disconnect, so aborting on navigation would silently lose the question. **Rules out:** `EventSource`, which is GET-only. Client-side Markdown while streaming, already rejected by the backend's 2026-11-02 decision. Aborting on unmount. A Stop button is still possible later, but stopping would discard the question server-side, and the UI would have to say so.
