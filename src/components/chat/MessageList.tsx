'use client';

import { useEffect, useRef } from 'react';
import { IChatMessage } from '@/types/chat';
import MessageBubble from './MessageBubble';
import ThinkingIndicator from './ThinkingIndicator';

interface MessageListProps {
  messages: IChatMessage[];
  // True while the history is first loading, so the empty state doesn't flash.
  isLoading?: boolean;
  pendingQuestion?: string | null;
  isThinking?: boolean;
  error?: string | null;
}

export default function MessageList({
  messages,
  isLoading,
  pendingQuestion,
  isThinking,
  error,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pendingQuestion, isThinking, error]);

  const isEmpty =
    !isLoading &&
    messages.length === 0 &&
    !pendingQuestion &&
    !isThinking &&
    !error;

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col gap-4 overflow-y-auto p-6"
    >
      {isEmpty && (
        <div className="text-ghost flex flex-1 items-center justify-center text-sm">
          Ask your first question about this PDF
        </div>
      )}
      {messages.map(message => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
          contentHtml={message.content_html}
          createdAt={message.created_at}
        />
      ))}
      {pendingQuestion && (
        <MessageBubble
          role="user"
          content={pendingQuestion}
          contentHtml={null}
        />
      )}
      {isThinking && <ThinkingIndicator />}
      {error && (
        <MessageBubble
          role="assistant"
          content={`Error: ${error}`}
          contentHtml={null}
        />
      )}
    </div>
  );
}
