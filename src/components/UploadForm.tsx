'use client';

import { useState } from 'react';

const fieldClass =
  'rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-fg file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-border-strong file:px-3 file:py-1 file:text-fg';

export default function UploadForm() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  function handleUpload() {
    if (!file) {
      setError('Please select a PDF file.');
      return;
    }
    setError('');
    // Phase 2: call the upload mutation with { file, title: title.trim() }.
  }

  return (
    <div className="flex w-full max-w-100 flex-col gap-3">
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className={fieldClass}
      />
      <input
        type="file"
        accept=".pdf"
        onChange={e => setFile(e.target.files?.[0] ?? null)}
        className={fieldClass}
      />
      <button
        type="button"
        onClick={handleUpload}
        className="bg-accent enabled:hover:bg-accent-hover cursor-pointer rounded-lg p-2.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        Upload &amp; Start Chat
      </button>
      <span className="text-muted min-h-[18px] text-[13px]" />
      <span className="text-error min-h-[18px] text-[13px]">{error}</span>
    </div>
  );
}
