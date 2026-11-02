# 2026-11-02 — Redirect a missing chat to the upload page

## What

`src/components/chat/ChatView.tsx` only.

- New `isChatMissing`: the history request (`GET /chats/api/<id>/messages/?limit=1000`) failed with `404` and no data was loaded.
- A `useEffect` calls `router.replace('/')` when `isChatMissing` is true, so the user lands on the upload page to start a new chat.
- `loadError` is rebuilt on top of `isChatMissing`; its messages are unchanged ("Chat not found." / "Could not load messages."). "Chat not found." is now only visible for the moment before the redirect.

## Why

User request: opening `/chats/<id>` for a chat that doesn't exist (e.g. `/chats/9`, backend returns 404) left a dead page. It should go to the root page instead.

## How

- `replace`, not `push`, so Back doesn't return to the dead URL and bounce again.
- Detection reuses the existing 404 check on the messages query. There is no chat-detail endpoint, so the messages 404 is the only signal that a chat doesn't exist.
- With `cacheComponents`, hidden routes stay mounted under React `<Activity>`. Effects don't run while a route is hidden, so the redirect only fires while the chat page is visible.

## Affected modules and behaviors

Chat page only. Other load errors (network, 5xx) still show "Could not load messages." and don't redirect. No API, store, or type changes.

## Intended outcome

Visiting `/chats/<nonexistent id>` ends on `/` with the upload form, and Back doesn't return to the missing chat. If the page still shows "Chat not found." and stays put, it didn't work.

## Verification

- `npm run build`: passes (compile + TypeScript).
- `npx eslint .`: only the known baseline error (`src/types/api.ts:2`).
- `curl` to `http://127.0.0.1:9001/chats/api/9/messages/?limit=1000` returns `404`, which confirms the backend signal is the one this code checks for.
- **Not exercised in a browser.** The Chrome extension wasn't connected, so the redirect itself is unverified.

## Critical notes

None for security. Rollback: revert the one file.
