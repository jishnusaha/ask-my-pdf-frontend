import Link from 'next/link';

interface ChatListItemProps {
  chat: { id: number; title: string; created_at: string };
  isActive: boolean;
}

export function ChatListItem({ chat, isActive }: ChatListItemProps) {
  const date = new Date(chat.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

  return (
    <Link
      href={`/chats/${chat.id}`}
      className={`hover:bg-surface mb-0.5 block truncate rounded-lg px-3 py-2.5 text-sm hover:text-white ${
        isActive ? 'bg-surface text-white' : 'text-fg-soft'
      }`}
    >
      {chat.title}
      <span className="text-faint mt-0.5 block text-[11px]">{date}</span>
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="bg-sidebar border-border flex w-65 min-w-65 flex-col border-r">
      <div className="border-border border-b p-4">
        <Link
          href="/"
          className="border-border-strong bg-surface text-fg hover:bg-surface-hover flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm"
        >
          ✏️ New Chat
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-ghost p-3 text-[13px]">No chats yet.</p>
      </div>
    </aside>
  );
}
