# Decision log

## 2026-10-27 — Frontend calls the Django API directly; CORS is the backend's job

RTK Query's `baseUrl` is `NEXT_PUBLIC_API_URL` and the browser calls the DRF API cross-origin. **Why:** matches the existing RTK setup and the planck pattern; keeps the backend a plain API. **Rules out:** a Next.js rewrite proxy for `/chats/api/*` (considered, rejected by the user). The backend repo must add CORS for the frontend origin.

## 2026-10-27 — One large page instead of pagination UI; title from the chat list

Sidebar requests `limit=100` chats, chat page `limit=1000` messages, and the chat title is looked up in the chat list. **Why:** the templates showed everything and the backend has no chat-detail endpoint. **Rules out:** nothing permanent — the right fix is a backend `GET /chats/api/<pk>/` plus pagination/infinite scroll; revisit when users exceed those limits.

## 2026-10-27 — Per-feature file boundaries for components

Each API feature lives in its own component (`Sidebar`, `UploadForm`, `ChatView`, `ReuploadBar`), with shared pieces only in `src/types/chat.ts`, `src/store/services/api.ts`, `src/constants/chat.ts`, `src/lib/utils.ts`. **Why:** lets features be built, reviewed and committed independently. **Rules out:** a single chat container owning every mutation.
