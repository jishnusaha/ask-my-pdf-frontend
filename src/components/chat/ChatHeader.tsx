export default function ChatHeader({ title }: { title: string }) {
  return (
    <div className="border-border border-b px-6 py-4 text-[15px] font-semibold text-white">
      {title}
    </div>
  );
}
