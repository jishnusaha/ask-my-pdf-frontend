'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { getErrorMessage } from '@/lib/utils';
import { useCreateChatMutation } from '@/store/services/api';

const fieldClass =
  'rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-fg file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-border-strong file:px-3 file:py-1 file:text-fg';

export default function UploadForm() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [createChat, { isLoading }] = useCreateChatMutation();

  async function handleUpload() {
    if (!file) {
      setError('Please select a PDF file.');
      return;
    }
    setError('');

    const data = new FormData();
    data.append('pdf', file);
    const trimmedTitle = title.trim();
    if (trimmedTitle) data.append('title', trimmedTitle);

    try {
      const chat = await createChat({ data }).unwrap();
      // This route stays mounted (Activity) after navigating away, so reset
      // the form for the next "New Chat".
      setTitle('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      router.push(`/chats/${chat.id}`);
    } catch (e) {
      setError(`Upload failed: ${getErrorMessage(e)}`);
    }
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
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={e => setFile(e.target.files?.[0] ?? null)}
        className={fieldClass}
      />
      <button
        type="button"
        onClick={handleUpload}
        disabled={isLoading}
        className="bg-accent enabled:hover:bg-accent-hover cursor-pointer rounded-lg p-2.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? 'Uploading…' : 'Upload & Start Chat'}
      </button>
      <span className="text-muted min-h-4.5 text-[13px]">
        {isLoading && 'Processing PDF, please wait…'}
      </span>
      <span className="text-error min-h-4.5 text-[13px]">{error}</span>
    </div>
  );
}
