'use client';

import { useState } from 'react';
import { CHAT_LIST_LIMIT, MESSAGE_LIST_LIMIT } from '@/constants/chat';
import { getErrorMessage } from '@/lib/utils';
import {
  useGetChatListQuery,
  useGetChatMessagesQuery,
  useSendMessageMutation,
} from '@/store/services/api';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import ReuploadBar from './ReuploadBar';

const statusClass =
  'text-ghost flex flex-1 items-center justify-center text-sm';

export default function ChatView({ chatId }: { chatId: number }) {
  // The question being sent. It stays on screen (also after a failure) until
  // the next send, or until the refetched history contains the saved copy.
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  // Ids of the messages the backend saved for the pending question.
  const [sentMessageIds, setSentMessageIds] = useState<number[] | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // There is no chat-detail endpoint, so the title comes from the chat list.
  const { title } = useGetChatListQuery(
    { limit: CHAT_LIST_LIMIT },
    {
      selectFromResult: ({ data }) => ({
        title: data?.results.find(chat => chat.id === chatId)?.title,
      }),
    },
  );
  const {
    data: messagesResponse,
    error: messagesError,
    isLoading: isMessagesLoading,
  } = useGetChatMessagesQuery({ chatId, limit: MESSAGE_LIST_LIMIT });
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  const messages = messagesResponse?.results ?? [];
  // Sending invalidates the history, which then refetches. Keep the optimistic
  // bubble until the refetched history has the saved messages, so it never
  // disappears before the server copy shows up.
  const isPendingSaved =
    sentMessageIds !== null &&
    sentMessageIds.every(id => messages.some(message => message.id === id));

  async function handleSend(question: string) {
    setPendingQuestion(question);
    setSentMessageIds(null);
    setSendError(null);
    try {
      const sentMessages = await sendMessage({ chatId, question }).unwrap();
      setSentMessageIds(sentMessages.map(message => message.id));
    } catch (e) {
      setSendError(getErrorMessage(e));
    }
  }

  const loadError =
    messagesError && !messagesResponse
      ? 'status' in messagesError && messagesError.status === 404
        ? 'Chat not found.'
        : 'Could not load messages.'
      : null;

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
          isThinking={isSending}
          error={sendError}
        />
      )}
      <MessageInput onSend={handleSend} disabled={isSending} />
    </div>
  );
}
