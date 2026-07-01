import { relativeDayLabel } from '../../lib/dateFormat.js';
import { useActiveSession } from './useActiveSession.js';

// Card "Riprendi sessione" della Home (FU-022): mostra la sessione più recente dell'utente e la
// riapre al click. Dati INTERNI (chat dell'utente via RLS), nessuna fonte/licenza di terzi.
// Se non c'è nessuna sessione (o durante il caricamento) → la card NON compare (return null),
// così il primo accesso resta pulito. `onReprendi(chatId)` è fornito dalla Home (apre la Chat).
export function ActiveSessionCard({ onReprendi }) {
  const { session, limitReached, loading } = useActiveSession();
  if (loading || !session) return null;

  const asset = session.form_context?.asset;
  const meta = [asset, `aggiornata ${relativeDayLabel(session.updated_at)}`]
    .filter(Boolean)
    .join(' · ');
  // Se l'ultima sessione ha esaurito i follow-up non è più "riprendibile" con nuove domande:
  // resta consultabile, quindi la etichetta cambia in "Apri ultima sessione".
  const label = limitReached ? 'Apri ultima sessione' : 'Riprendi sessione';

  return (
    <button
      type="button"
      onClick={() => onReprendi(session.id)}
      className="group home-fade-up flex w-full items-center justify-between gap-4 rounded-2xl border border-line bg-surface/60 px-5 py-4 text-left transition-all duration-200 hover:border-freedom-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-freedom-accent"
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-xs font-semibold uppercase tracking-widest text-freedom-accent">
          {label}
        </span>
        <span className="mt-1 truncate text-base font-semibold text-content">{session.title}</span>
        {meta && <span className="mt-0.5 truncate text-sm text-muted">{meta}</span>}
      </span>
      <span
        aria-hidden="true"
        className="shrink-0 text-freedom-accent transition-transform duration-200 group-hover:translate-x-0.5"
      >
        →
      </span>
    </button>
  );
}
