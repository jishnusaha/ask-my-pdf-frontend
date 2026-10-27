const dotClass = 'size-1.75 animate-pulse-dot rounded-full bg-accent';

export default function ThinkingIndicator() {
  return (
    <div className="flex max-w-[75%] flex-col gap-1 self-start">
      <div className="bg-surface flex items-center gap-1.25 rounded-xl rounded-bl-sm px-4.5 py-3.5">
        <span className={dotClass} />
        <span className={`${dotClass} [animation-delay:0.2s]`} />
        <span className={`${dotClass} [animation-delay:0.4s]`} />
      </div>
    </div>
  );
}
