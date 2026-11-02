# 2026-11-02 — Stream chat answers over the backend's SSE endpoint

## What

- **New `src/lib/sse.ts`.** A generic SSE frame parser, `readServerSentEvents(body)`.
  - Uses a streaming `TextDecoder` and flushes it at EOF.
  - Normalizes `\r\n` on the accumulated buffer, so a CRLF split across chunks still works.
  - Skips comment lines and frames with no data. Joins multi-line `data` with `\n`.
  - Discards an incomplete trailing frame.
  - Cancels the reader in `finally`.
- **New `src/store/services/messageStream.ts`.** `streamMessage({ chatId, question, onToken })` POSTs JSON to `/chats/api/<id>/messages/stream/` with `Accept: text/event-stream`. It calls `onToken` for each `token` event and resolves with the `done` array. Every failure is thrown as `{ status, data }`:
  - network failure → `FETCH_ERROR`;
  - non-2xx → the JSON body, or `{ detail: "The server responded with N." }` when the body isn't JSON;
  - not `text/event-stream`, invalid frame JSON, or a malformed `done` → `PARSING_ERROR`;
  - `error` event → `STREAM_ERROR` with the server's detail;
  - EOF with no terminal event, or a read error mid-stream → `STREAM_ERROR` "connection lost".
- **`src/types/chat.ts`.** Added `IMessageStreamToken` and `IMessageStreamError`.
- **`src/store/services/api.ts`.** Removed the `sendMessage` mutation and `useSendMessageMutation`. Nothing calls them any more.
- **`src/components/chat/ChatView.tsx`.**
  - New local `isSending` and `streamedAnswer` state.
  - On `done`, it commits the saved ids with `flushSync` and then patches the `getChatMessages` cache through a shared `messagesArgs` const. If the patch is empty, it invalidates the tag instead.
  - The thinking dots stay until the saved messages are visible.
  - On error, it drops the partial answer and shows the error bubble.
- **`src/components/chat/MessageList.tsx`.**
  - New `streamingAnswer` prop, rendered as a plain-text assistant bubble.
  - Stick-to-bottom autoscroll: it only follows new content when the user is within 40px of the bottom, and a newly sent question re-sticks it.
- **Docs and memory.**
  - `CLAUDE.md`: the stream endpoint, the `messageStream.ts` layout note, the send-flow gotcha, the CORS origin note, and a verification footer.
  - `docs/decisions/DECISIONS.md`: a new entry for this design.
  - `.claude/agent-memory/implementer/frontend-tooling-traps.md`: three node-testing traps.

## Why

The backend added `POST /chats/api/<id>/messages/stream/` (backend `main` @ `41c7ac8`), which streams answers as SSE, and updated its Django `chat.html` to use it. The user asked for the same feature here. They asked for it to be built from an analysis of that template, not copied, and improved where needed.

## How (improvements over the template)

- **Saved messages.** The template appends them to the DOM by hand. Here they go into the RTK cache with `updateQueryData`, which replaces the old invalidate-and-refetch of up to 1000 messages per question.
- **Timing.** RTK marks `queryResultPatched` as auto-batched (`autoBatchEnhancer`, `raf`), so a patch reaches React one frame late. Committing the ids with `flushSync` first means the saved messages appear in the same render that hides the streamed bubbles. No frame shows both, and none shows neither. This was checked in the RTK source, not in a browser.
- **Errors.** They reuse `getErrorMessage`. The template showed `JSON.stringify(err)`, and in a first draft a raw HTML error page would have gone into the bubble.
- **Dropped connections.** A connection lost mid-stream is reported as such, not as "could not reach the server".
- **Scrolling.** The template forces a scroll on every token. Here the user can scroll up and read while an answer streams.
- **Navigating away.** The stream is not aborted on unmount, because the backend saves nothing on disconnect. Leaving mid-answer still saves the exchange, and the cache patch lands when `done` arrives.
- **Rendering.** It stays the same as the template and the backend decision: raw text while streaming, then the server's `content_html`.

## Affected modules and behaviors

- Only the chat page's send flow. Upload, re-upload, the sidebar, and the history load are unchanged.
- No new dependencies. No backend changes.
- The non-stream `/messages/` POST is no longer used by this frontend. The backend still serves it.

## Intended outcome

After sending a question, answer text appears progressively within ~3–5 s and is then replaced, without flicker, by the rendered answer with citation badges.

- **Works:** a growing assistant bubble, then one rendered bubble, with no duplicate.
- **Doesn't work:** the bubble only appears at the end, an error bubble shows, or the answer is visible twice.

## Verification

- `npm run build`: passed. The route table lists `/`, `/_not-found`, and `/chats/[chatId]` (Partial Prerender).
- `npx eslint .`: 1 problem, the known baseline `src/types/api.ts` 2:9 `no-explicit-any`.
- `npx prettier --check` on all touched source files: passed.
- Node test against a local mock HTTP SSE server, kept outside the repo in the session scratchpad: `stream-test.mjs`, 24 checks, `ALL PASSED`.
  - It transpiles the real `sse.ts`, `messageStream.ts` and `utils.ts`.
  - It covers per-byte chunks, emoji and CRLF split across chunks, comments, multi-line data, unknown events, `done` without tokens, `error` events, truncated streams, a socket destroyed mid-stream, 400 field errors, 404 detail, a 500 HTML body, an empty 404, the wrong content type, invalid JSON, a non-array `done`, cancellation after `done`, and connection refused.
  - Each case asserts both the thrown `{status,data}` and the `getErrorMessage` text.
- CORS preflight `OPTIONS /chats/api/1/messages/stream/` against the running backend (:9001):
  - Origin `http://localhost:3000` → allowed (`content-type` among the allowed headers).
  - Origin `http://127.0.0.1:3000` → no `access-control-allow-origin`.
- **Unverified:** no browser run against the real backend. These are untested in a real browser:
  - the `flushSync` ordering and frame behavior;
  - the stick-to-bottom feel;
  - the `invalidateTags` fallback;
  - the end-to-end stream through CORS.

## Critical notes

- Same exposure as before: the endpoint is unauthenticated, and every question spends OpenAI credit.
- **Concurrency gap.** Navigating to another chat mid-answer unmounts `ChatView`, because it is keyed by `chatId`. Returning before `done` mounts a fresh view with Send enabled, so a second question can overlap the first. The backend's `last_id` / `id__gt` capture is racy under overlap, so `done` could carry the other request's rows. Not fixed: it needs either app-level stream state or a backend fix.
- **Rollback.** Revert this commit. The backend's non-stream endpoint is unchanged, so the old `sendMessage` flow works again.
