import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble.jsx';

export function ChatPanel({
  messages,
  onSendMessage,
  loading,
  error,
  analyzing,
  analysisError,
  streamingText,
  limitReached = false,
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const bottomRef = useRef(null);

  // Scrittura bloccata mentre l'agente lavora, o quando la sessione ha esaurito i follow-up.
  const busy = sending || analyzing;
  const disabled = busy || limitReached;
  const hasStreaming = typeof streamingText === 'string' && streamingText.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, analyzing, streamingText]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || disabled) return;
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
          <p className="text-muted text-sm text-center">Caricamento messaggi…</p>
        )}
        {error && (
          <p role="alert" className="text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {/* Streaming (M5): la prosa in arrivo come bolla assistant, con cursore mentre scorre. */}
        {hasStreaming && (
          <div className="flex justify-start" aria-live="polite">
            <div className="max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words bg-surface-stronger text-content">
              {streamingText}
              {analyzing && <span className="animate-pulse">▋</span>}
            </div>
          </div>
        )}
        {/* Attesa: solo finché non è arrivato il primo pezzo di testo. */}
        {analyzing && !hasStreaming && (
          <p className="text-muted text-sm text-center animate-pulse" aria-live="polite">
            L'agente sta analizzando…
          </p>
        )}
        {analysisError && (
          <p role="alert" className="text-red-600 dark:text-red-400 text-sm text-center">
            {analysisError}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* composer */}
      <div className="border-t border-line px-4 py-3 flex flex-col gap-2 shrink-0">
        {sendError && (
          <p role="alert" className="text-red-600 dark:text-red-400 text-xs">
            {sendError}
          </p>
        )}
        {limitReached && (
          <p className="text-muted text-xs text-center">
            Hai raggiunto il limite di approfondimenti per questa sessione. Avvia una nuova analisi
            per continuare.
          </p>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled}
            placeholder={
              limitReached
                ? 'Limite di approfondimenti raggiunto'
                : analyzing
                  ? 'L’agente sta analizzando…'
                  : 'Scrivi un messaggio…'
            }
            className="flex-1 bg-surface-strong border border-line rounded-full px-4 py-2 text-sm text-content placeholder-faint focus:outline-none focus:border-freedom-accent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!text.trim() || disabled}
            className="bg-freedom-accent text-slate-950 px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50 hover:bg-freedom-accentHover transition-colors"
          >
            Invia
          </button>
        </form>
      </div>
    </div>
  );
}
