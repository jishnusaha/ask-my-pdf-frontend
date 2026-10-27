// Turns an RTK Query `.unwrap()` rejection (`{ status, data }`) into a message.
export function getErrorMessage(error: unknown): string {
  const { status, data } = (error ?? {}) as {
    status?: unknown;
    data?: unknown;
  };

  if (status === 'FETCH_ERROR') return 'Could not reach the server.';
  if (typeof data === 'string' && data) return data;

  if (data && typeof data === 'object') {
    const body = data as Record<string, unknown>;
    if (typeof body.detail === 'string') return body.detail;
    if (typeof body.error === 'string') return body.error;

    // DRF field errors: { pdf: ["msg"] }
    const fieldErrors = Object.entries(body).flatMap(([field, messages]) =>
      Array.isArray(messages)
        ? messages.map(message => `${field}: ${String(message)}`)
        : [],
    );
    if (fieldErrors.length > 0) return fieldErrors.join(' ');

    return JSON.stringify(data);
  }

  return 'Something went wrong.';
}
