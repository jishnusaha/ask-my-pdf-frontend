'use client';

import { useEffect, useRef } from 'react';
import { IChatMessage } from '@/types/chat';
import MessageBubble from './MessageBubble';
import ThinkingIndicator from './ThinkingIndicator';

// How far from the bottom (px) the list still counts as scrolled to the bottom.
const NEAR_BOTTOM_PX = 40;

interface MessageListProps {
  messages: IChatMessage[];
  // True while the history is first loading, so the empty state doesn't flash.
  isLoading?: boolean;
  pendingQuestion?: string | null;
  // The answer streamed so far, shown as plain text until the saved
  // (server-rendered) message replaces it.
  streamingAnswer?: string | null;
  isThinking?: boolean;
  error?: string | null;
}

export default function MessageList({
  messages,
  isLoading,
  pendingQuestion,
  streamingAnswer,
  isThinking,
  error,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Whether new content scrolls the list down. Turned off once the user
  // scrolls up to read, so a growing answer doesn't pull them back down.
  const stickToBottomRef = useRef(true);

  // Declared before the scroll effect on purpose: effects run in order, so a
  // new question forces the flag on before the scroll effect reads it.
  useEffect(() => {
    if (pendingQuestion) stickToBottomRef.current = true;
  }, [pendingQuestion]);

  useEffect(() => {
    const el = containerRef.current;
    if (el && stickToBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, pendingQuestion, streamingAnswer, isThinking, error]);

  const hasStreamingAnswer = typeof streamingAnswer === 'string';
  const isEmpty =
    !isLoading &&
    messages.length === 0 &&
    !pendingQuestion &&
    !hasStreamingAnswer &&
    !isThinking &&
    !error;

  return (
    <div
      ref={containerRef}
      onScroll={e => {
        const el = e.currentTarget;
        stickToBottomRef.current =
          el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
      }}
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
      {hasStreamingAnswer && (
        <MessageBubble
          role="assistant"
          content={streamingAnswer}
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
