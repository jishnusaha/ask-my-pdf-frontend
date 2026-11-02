export interface IServerSentEvent {
  event: string;
  data: string;
}

// Parses one frame (the text between two blank lines). Returns null for frames
// without any `data` line, such as a comment-only keep-alive.
function parseFrame(frame: string): IServerSentEvent | null {
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of frame.split('\n')) {
    if (line.startsWith(':')) continue;

    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') event = value;
    else if (field === 'data') dataLines.push(value);
  }

  return dataLines.length > 0 ? { event, data: dataLines.join('\n') } : null;
}

// Yields the server-sent events of a response body as they arrive. Data stays
// a raw string; parsing it is up to the caller. Breaking out of a `for await`
// (or a read error) cancels the reader, which closes the connection.
export async function* readServerSentEvents(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<IServerSentEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      // `stream: true` keeps a multi-byte character that is split across
      // chunks; the final call without a chunk flushes whatever is left.
      buffer += done
        ? decoder.decode()
        : decoder.decode(value, { stream: true });
      // Normalize the whole buffer, not each chunk, so a "\r" and "\n" that
      // arrive in different chunks still become one line break.
      buffer = buffer.replace(/\r\n/g, '\n');

      let separator: number;
      while ((separator = buffer.indexOf('\n\n')) !== -1) {
        const frame = parseFrame(buffer.slice(0, separator));
        buffer = buffer.slice(separator + 2);
        if (frame) yield frame;
      }

      // A frame still incomplete at the end of the stream is discarded.
      if (done) return;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}
