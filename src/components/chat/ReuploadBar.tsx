'use client';

import { useRef, useState } from 'react';
import { getErrorMessage } from '@/lib/utils';
import { useReuploadChatPdfMutation } from '@/store/services/api';

export default function ReuploadBar({ chatId }: { chatId: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reuploadChatPdf, { isLoading }] = useReuploadChatPdfMutation();

  async function handleReupload() {
    if (!file) {
      setStatus('Select a PDF file first.');
      return;
    }
    setStatus('');

    const data = new FormData();
    data.append('pdf', file);

    try {
      await reuploadChatPdf({ chatId, data }).unwrap();
      setStatus('PDF replaced successfully.');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      setStatus(`Re-upload failed: ${getErrorMessage(e)}`);
    }
  }

  return (
    <div className="border-border flex items-center gap-2.5 border-b px-6 py-2">
      <span className="text-ghost text-xs">Replace PDF:</span>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={e => setFile(e.target.files?.[0] ?? null)}
        className="text-muted file:bg-border-strong file:text-fg text-xs file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:px-3 file:py-1"
      />
      <button
        type="button"
        onClick={handleReupload}
        disabled={isLoading}
        className="border-border-strong bg-surface text-muted enabled:hover:bg-border-strong cursor-pointer rounded-md border px-3 py-1.25 text-xs enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        Re-upload
      </button>
      <span className="text-muted text-xs">
        {isLoading ? 'Re-uploading…' : status}
      </span>
    </div>
  );
}
