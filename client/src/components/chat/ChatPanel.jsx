import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble.jsx';

export function ChatPanel({ messages, onSendMessage, onNuovaAnalisi, loading, error }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSendError(null);
    setSending(true);
    try {
      await onSendMessage(text.trim());
      setText('');
    } catch {
      setSendError('Invio non riuscito. Riprova.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* lista messaggi */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {loading && (
          <p className="text-white/50 text-sm text-center">Caricamento messaggi…</p>
        )}
        {error && (
          <p role="alert" className="text-red-400 text-sm text-center">
            {error}
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* composer */}
      <div className="border-t border-white/10 px-4 py-3 flex flex-col gap-2 shrink-0">
        {sendError && (
          <p role="alert" className="text-red-400 text-xs">
            {sendError}
          </p>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Scrivi un messaggio…"
            className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-freedom-accent"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="bg-freedom-accent text-black px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50 hover:brightness-110 transition-opacity"
          >
            Invia
          </button>
        </form>
        <button
          type="button"
          onClick={onNuovaAnalisi}
          className="text-xs text-white/40 hover:text-white/70 transition-colors text-left"
        >
          + Nuova analisi
        </button>
      </div>
    </div>
  );
}
