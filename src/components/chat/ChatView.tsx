'use client';

import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import ReuploadBar from './ReuploadBar';

export default function ChatView({ chatId }: { chatId: number }) {
  // Phase 1 placeholders: phase 2 replaces these with fetched/mutated data.
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ChatHeader title="Chat" />
      <ReuploadBar chatId={chatId} />
      <MessageList messages={[]} />
      <MessageInput onSend={() => {}} />
    </div>
  );
}
