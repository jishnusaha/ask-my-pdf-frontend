import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ChatView from '@/components/chat/ChatView';

// `chatId` is runtime data (no generateStaticParams), so reading it must sit
// behind a Suspense boundary for Cache Components.
async function Chat({
  params,
}: {
  params: PageProps<'/chats/[chatId]'>['params'];
}) {
  const { chatId } = await params;
  if (!/^\d+$/.test(chatId)) notFound();

  // `key` resets local state when Activity reuses this route for another chat.
  return <ChatView key={chatId} chatId={Number(chatId)} />;
}

export default function ChatPage({ params }: PageProps<'/chats/[chatId]'>) {
  return (
    <Suspense fallback={null}>
      <Chat params={params} />
    </Suspense>
  );
}
