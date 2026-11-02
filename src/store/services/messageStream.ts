import { readServerSentEvents } from '@/lib/sse';
import {
  IChatMessage,
  IMessageStreamError,
  IMessageStreamToken,
} from '@/types/chat';

// Every failure is thrown as a plain `{ status, data }` object, the shape of an
// RTK Query rejection, so `getErrorMessage` renders it unchanged.
function parsingError() {
  return {
    status: 'PARSING_ERROR',
    data: { detail: 'Received an unexpected response from the server.' },
  };
}

function streamError(detail: string) {
  return { status: 'STREAM_ERROR', data: { detail } };
}

function connectionLostError() {
  return streamError('The connection was lost before the answer finished.');
}

function parseEventData(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    throw parsingError();
  }
}

// The JSON body of a failed response. A non-JSON body (e.g. Django's HTML
// error page) is replaced by a short message instead of being shown raw.
async function readErrorBody(response: Response): Promise<unknown> {
  try {
    return JSON.parse(await response.text());
  } catch {
    return { detail: `The server responded with ${response.status}.` };
  }
}

// A read error is thrown by the generator itself, never by the caller's loop
// body (that only makes the generator return), so catching here can't mask the
// errors the loop throws. The server was reached, so it isn't a FETCH_ERROR.
async function* readEvents(body: ReadableStream<Uint8Array>) {
  try {
    yield* readServerSentEvents(body);
  } catch {
    throw connectionLostError();
  }
}

// Sends a question to the streaming endpoint, calls `onToken` with each piece
// of the answer, and resolves with the saved `[user, assistant]` messages.
// Deliberately not abortable: the backend saves nothing when the client
// disconnects, so letting it finish keeps the question and its answer.
export async function streamMessage({
  chatId,
  question,
  onToken,
}: {
  chatId: number;
  question: string;
  onToken: (delta: string) => void;
}): Promise<IChatMessage[]> {
  let response: Response;
  try {
    response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? ''}/chats/api/${chatId}/messages/stream/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ question }),
      },
    );
  } catch (e) {
    throw { status: 'FETCH_ERROR', error: String(e) };
  }

  if (!response.ok) {
    throw { status: response.status, data: await readErrorBody(response) };
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (
    !contentType.toLowerCase().includes('text/event-stream') ||
    !response.body
  ) {
    throw parsingError();
  }

  for await (const { event, data } of readEvents(response.body)) {
    if (event === 'token') {
      const token = parseEventData(data) as Partial<IMessageStreamToken> | null;
      if (typeof token?.delta !== 'string') throw parsingError();
      onToken(token.delta);
    } else if (event === 'done') {
      const messages = parseEventData(data);
      if (!Array.isArray(messages)) throw parsingError();
      // Returning ends the loop, which cancels the reader.
      return messages as IChatMessage[];
    } else if (event === 'error') {
      const body = parseEventData(data) as Partial<IMessageStreamError> | null;
      throw streamError(
        typeof body?.detail === 'string'
          ? body.detail
          : 'The answer could not be generated. Please try again.',
      );
    }
  }

  // The stream ended without a `done` or `error` event.
  throw connectionLostError();
}
