'use client';

import { useRef, useState } from 'react';

interface MessageInputProps {
  onSend: (question: string) => void;
  disabled?: boolean;
}

export default function MessageInput({
  onSend,
  disabled = false,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function send() {
    const question = value.trim();
    if (!question || disabled) return;
    onSend(question);
    setValue('');
    inputRef.current?.focus();
  }

  return (
    <div className="border-border flex gap-2.5 border-t px-6 py-4">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        placeholder="Ask a question..."
        autoFocus
        className="border-border-strong bg-surface text-fg focus:border-accent flex-1 rounded-[10px] border px-4 py-3 text-sm outline-none"
      />
      <button
        type="button"
        onClick={send}
        disabled={disabled}
        className="bg-accent enabled:hover:bg-accent-hover cursor-pointer rounded-[10px] px-5 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        Send
      </button>
    </div>
  );
}
