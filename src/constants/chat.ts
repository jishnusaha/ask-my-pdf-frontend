// The backend paginates every list (20 by default) but the original UI showed
// everything, so this is the single page of chats we request.
export const CHAT_LIST_LIMIT = 100;

// Same reasoning as CHAT_LIST_LIMIT: the single page of messages we request.
export const MESSAGE_LIST_LIMIT = 1000;
