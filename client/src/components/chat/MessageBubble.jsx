export function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words text-content ${
          isUser ? 'bg-surface-strong' : 'bg-surface-stronger'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
