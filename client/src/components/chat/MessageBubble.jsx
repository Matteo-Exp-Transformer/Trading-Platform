export function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-freedom-accent text-black rounded-br-sm'
            : 'bg-surface-strong text-content rounded-bl-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
