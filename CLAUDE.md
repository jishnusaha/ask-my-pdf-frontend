# CLAUDE.md

Next.js frontend for AskMyPDF (chat with a PDF). It replaces the Django templates that used to live in the backend repo at `../ask-my-pdf` (`chats/templates/chats/`). All data comes from that repo's DRF API. `AGENTS.md` covers Next 16 specifics: read the bundled docs in `node_modules/next/dist/docs/` before writing route code.

## Commands

```bash
npm run dev              # :3000
npm run build            # also type-checks; the reliable "does it work" check
npx eslint .             # NOT `npm run lint`: `next lint` was removed in Next 16
npx prettier --write <files>   # prettier-plugin-tailwindcss sorts classes
```

There is no test suite. Baseline eslint has one known error, `no-explicit-any` in `src/types/api.ts`. Treat anything beyond that as new.

## Backend

- Repo `../ask-my-pdf`. Dev server: `python manage.py runserver 9001`.
- `NEXT_PUBLIC_API_URL` is the RTK `baseUrl` (`src/store/services/api.ts`). Use `http://127.0.0.1:9001` locally.
- API lives under `/chats/api/`, and trailing slashes are required:
  - `GET`/`POST` `/chats/api/` lists chats, or uploads a PDF (multipart `pdf`, optional `title`).
  - `GET`/`POST` `/chats/api/<id>/messages/`: the POST takes JSON `{question}` and returns a plain `[user, assistant]` array.
  - `POST` `/chats/api/<id>/reupload/` takes multipart `pdf`.
  - `GET` `/chats/api/<id>/chunks/`.
- Every GET list is paginated (`{count,next,previous,results}`, 20 per page, `limit`/`offset`).
- There is **no chat-detail endpoint**, so the chat title comes from the chat list.
- No auth; chats have no owner.
- **The backend sends no CORS headers as of 2026-10-27**, so browser calls from :3000 fail until it does. The user owns that change. Don't edit the backend repo for it.

## Layout

- `src/app/page.tsx` is the upload page (`/`). `src/app/chats/[chatId]/page.tsx` is the chat page.
- `src/components/`: `Sidebar`, `UploadForm`, `chat/*` (`ChatView` composes the header, `ReuploadBar`, `MessageList` and `MessageInput`).
- `src/store/services/api.ts` holds all endpoints and the tags `chats`, `chat-messages` and `chat-chunks`. Per-chat tags carry the chat id.
- `src/types/*.ts` holds API interfaces. `src/constants/chat.ts` holds page-size limits. `src/lib/utils.ts` has `getErrorMessage` for `.unwrap()` errors.
- Each API feature lives in its own component file, so features can be built and committed independently.

## Conventions

- Follow the planck project (`/Users/jishnusaha/Soumashis/planck/src/store/services/api.ts`, `src/types/*.ts`):
  - Name the builder `build`.
  - File-upload mutations take a `{ data: FormData }` argument.
  - Mutations use `invalidatesTags: (_, error) => (error ? [] : [...])`.
  - Interfaces are `I`-prefixed. String unions are named `XType`. Fields stay snake_case, exactly as the API returns them.
  - Components call `await mutation(args).unwrap()` inside try/catch.
- Colors are Tailwind v4 `@theme` tokens in `src/app/globals.css` (`bg-page`, `bg-surface`, `text-fg`, `bg-accent`, …). Use the tokens, not hex values.
- Commit one feature at a time, each one building on its own. Messages are short and imperative ("Add …", "Connect … to api").

## Gotchas

- **`cacheComponents: true`:**
  - Reading `params` or calling `usePathname()` on a dynamic route needs a `<Suspense>` boundary, or the build fails.
  - Next keeps hidden routes mounted (React `<Activity>`), so local state survives navigation. `ChatView` is keyed by `chatId`, and forms reset themselves after success.
- Assistant `content_html` is rendered with `dangerouslySetInnerHTML`. That is safe only because backend `render_answer` html-escapes text before adding tags. Never render user content as HTML.
- Lists request one large page (`CHAT_LIST_LIMIT` 100, `MESSAGE_LIST_LIMIT` 1000) instead of paginating. `Sidebar` and `ChatView` must pass identical args to `useGetChatListQuery` so they share a cache entry.

## Session continuity

Changelogs go in `docs/changelogs/` and decisions in `docs/decisions/DECISIONS.md`. Read both before proposing an approach.
