import { ChatMessageRoleType } from '@/types/chat';

interface MessageBubbleProps {
  role: ChatMessageRoleType;
  content: string;
  contentHtml: string | null;
  // Omitted for optimistic messages that have no server timestamp yet.
  createdAt?: string;
}

const wrapperClass = {
  user: 'items-end self-end',
  assistant: 'self-start',
};

const bubbleClass = {
  user: 'rounded-br-sm bg-accent text-white',
  assistant: 'rounded-bl-sm bg-surface text-fg',
};

export default function MessageBubble({
  role,
  content,
  contentHtml,
  createdAt,
}: MessageBubbleProps) {
  return (
    <div className={`flex max-w-[75%] flex-col gap-1 ${wrapperClass[role]}`}>
      <div
        className={`rounded-xl px-4 py-3 text-sm leading-[1.6] ${bubbleClass[role]}`}
      >
        {role === 'assistant' && contentHtml ? (
          // The backend html-escapes the answer text before adding tags.
          <div
            className="answer-content"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : (
          <div className="whitespace-pre-wrap">{content}</div>
        )}
      </div>
      {createdAt && (
        <span className="text-ghost px-1 text-[11px]">
          {new Date(createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )}
    </div>
  );
}
