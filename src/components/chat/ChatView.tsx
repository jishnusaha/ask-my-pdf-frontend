'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { CHAT_LIST_LIMIT, MESSAGE_LIST_LIMIT } from '@/constants/chat';
import { getErrorMessage } from '@/lib/utils';
import { useAppDispatch } from '@/store';
import {
  api,
  useGetChatListQuery,
  useGetChatMessagesQuery,
} from '@/store/services/api';
import { streamMessage } from '@/store/services/messageStream';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import ReuploadBar from './ReuploadBar';

const statusClass =
  'text-ghost flex flex-1 items-center justify-center text-sm';

export default function ChatView({ chatId }: { chatId: number }) {
  // The question being sent. It stays on screen (also after a failure) until
  // the next send, or until the history cache contains the saved copy.
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  // The answer streamed so far; null until the first token arrives. Dropped on
  // failure, because the backend saves nothing then.
  const [streamedAnswer, setStreamedAnswer] = useState<string | null>(null);
  // Ids of the messages the backend saved for the pending question.
  const [sentMessageIds, setSentMessageIds] = useState<number[] | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // There is no chat-detail endpoint, so the title comes from the chat list.
  const { title } = useGetChatListQuery(
    { limit: CHAT_LIST_LIMIT },
    {
      selectFromResult: ({ data }) => ({
        title: data?.results.find(chat => chat.id === chatId)?.title,
      }),
    },
  );
  // Also the cache key that handleSend patches, so it must stay the same.
  const messagesArgs = { chatId, limit: MESSAGE_LIST_LIMIT };
  const {
    data: messagesResponse,
    error: messagesError,
    isLoading: isMessagesLoading,
  } = useGetChatMessagesQuery(messagesArgs);

  const messages = messagesResponse?.results ?? [];
  // Once the stream is done the saved messages are added to the history cache.
  // Keep the optimistic question and the streamed answer on screen until the
  // history contains the saved messages, so they never disappear before the
  // server copy shows up.
  const isPendingSaved =
    sentMessageIds !== null &&
    sentMessageIds.every(id => messages.some(message => message.id === id));

  async function handleSend(question: string) {
    setPendingQuestion(question);
    setStreamedAnswer(null);
    setSentMessageIds(null);
    setSendError(null);
    setIsSending(true);
    try {
      const saved = await streamMessage({
        chatId,
        question,
        onToken: delta => setStreamedAnswer(prev => (prev ?? '') + delta),
      });
      // Commit the ids first, then patch the cache. RTK Query batches the
      // patch (`queryResultPatched` is auto-batched), so it reaches React a
      // frame later. With the ids already committed, the render that adds the
      // saved messages is the same one that hides the streamed bubbles: no
      // frame shows both, and none shows neither.
      flushSync(() => setSentMessageIds(saved.map(message => message.id)));
      const { patches } = dispatch(
        api.util.updateQueryData('getChatMessages', messagesArgs, draft => {
          const knownIds = new Set(draft.results.map(message => message.id));
          const added = saved.filter(message => !knownIds.has(message.id));
          draft.results.push(...added);
          draft.count += added.length;
        }),
      );
      // No patch means the history had no data yet (its first load is still
      // running and may predate the save), so refetch it instead. It is also
      // empty when the history already had the messages; a refetch is harmless.
      if (patches.length === 0) {
        dispatch(
          api.util.invalidateTags([{ type: 'chat-messages', id: chatId }]),
        );
      }
    } catch (e) {
      // Nothing was saved, so the partial answer must not stay as if it were.
      setStreamedAnswer(null);
      setSendError(getErrorMessage(e));
    } finally {
      setIsSending(false);
    }
  }

  const isChatMissing =
    !!messagesError &&
    !messagesResponse &&
    'status' in messagesError &&
    messagesError.status === 404;
  const loadError = isChatMissing
    ? 'Chat not found.'
    : messagesError && !messagesResponse
      ? 'Could not load messages.'
      : null;

  // A chat that doesn't exist has nothing to show, so send the user to the
  // upload page to start a new one. `replace` keeps the dead URL out of the
  // history. Effects don't run while Activity hides this route, so this only
  // fires while the chat page is on screen.
  useEffect(() => {
    if (isChatMissing) router.replace('/');
  }, [isChatMissing, router]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ChatHeader title={title ?? 'Chat'} />
      <ReuploadBar chatId={chatId} />
      {loadError ? (
        <div className={statusClass}>{loadError}</div>
      ) : (
        <MessageList
          messages={messages}
          isLoading={isMessagesLoading}
          pendingQuestion={isPendingSaved ? null : pendingQuestion}
          streamingAnswer={isPendingSaved ? null : streamedAnswer}
          // Also while the saved messages are on their way into the history,
          // so an answer that arrives without tokens leaves no empty frame.
          isThinking={
            (isSending || (sentMessageIds !== null && !isPendingSaved)) &&
            streamedAnswer === null
          }
          error={sendError}
        />
      )}
      <MessageInput onSend={handleSend} disabled={isSending} />
    </div>
  );
}
