'use client';

import { useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- chatId is used by the phase 2 re-upload mutation
export default function ReuploadBar({ chatId }: { chatId: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');

  function handleReupload() {
    if (!file) {
      setStatus('Select a PDF file first.');
      return;
    }
    setStatus('');
    // Phase 2: call the re-upload mutation for chatId with the selected file.
  }

  return (
    <div className="border-border flex items-center gap-2.5 border-b px-6 py-2">
      <span className="text-ghost text-xs">Replace PDF:</span>
      <input
        type="file"
        accept=".pdf"
        onChange={e => setFile(e.target.files?.[0] ?? null)}
        className="text-muted file:bg-border-strong file:text-fg text-xs file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:px-3 file:py-1"
      />
      <button
        type="button"
        onClick={handleReupload}
        className="border-border-strong bg-surface text-muted enabled:hover:bg-border-strong cursor-pointer rounded-md border px-3 py-1.25 text-xs enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        Re-upload
      </button>
      <span className="text-muted text-xs">{status}</span>
    </div>
  );
}
