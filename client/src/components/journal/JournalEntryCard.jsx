import { directionLabel, outcomeLabel } from '../../lib/journalFields.js';

function formatDate(dateStr) {
  if (!dateStr) return '';
  // traded_at è una data pura (yyyy-mm-dd): niente fuso, formattazione diretta.
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

// Badge esito: usa solo token esistenti (surface + accento), niente nuova palette. Il testo dice
// tutto; il colore resta sobrio (accento per "vinto", tenue per il resto) senza semaforo verde/rosso.
function outcomeBadgeClass(outcome) {
  if (outcome === 'win') return 'border-freedom-accent text-freedom-accent';
  return 'border-line text-muted';
}

// Card di una voce di journal in lista. Mostra l'essenziale a colpo d'occhio (asset · TF · data ·
// esito) e, se presenti, i numeri del trade e un estratto della nota. Azioni: modifica / elimina.
export function JournalEntryCard({ entry, onEdit, onDelete }) {
  const numbers = [];
  if (entry.entry_price != null) numbers.push(`Entry ${entry.entry_price}`);
  if (entry.exit_price != null) numbers.push(`Exit ${entry.exit_price}`);
  if (entry.stop_price != null) numbers.push(`SL ${entry.stop_price}`);
  if (entry.rr != null) numbers.push(`R:R ${entry.rr}`);
  if (entry.pnl != null) numbers.push(`P&L ${entry.pnl}`);

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-line bg-surface/60 p-4 transition-colors hover:border-freedom-accent">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-content">{entry.asset || 'Senza asset'}</span>
            {entry.timeframe && <span className="text-xs text-faint">{entry.timeframe}</span>}
            {entry.direction && entry.direction !== 'none' && (
              <span className="text-xs text-muted">{directionLabel(entry.direction)}</span>
            )}
          </div>
          <p className="text-xs text-faint">{formatDate(entry.traded_at)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs ${outcomeBadgeClass(entry.outcome)}`}
        >
          {outcomeLabel(entry.outcome)}
        </span>
      </div>

      {numbers.length > 0 && (
        <p className="text-xs text-muted">{numbers.join('  ·  ')}</p>
      )}

      {entry.emotion && (
        <p className="text-xs text-faint">Emozione: {entry.emotion}</p>
      )}

      {entry.note && (
        <p className="text-sm text-muted line-clamp-3">{entry.note}</p>
      )}

      {Array.isArray(entry.tags) && entry.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {entry.tags.map((t) => (
            <li key={t} className="rounded-full border border-line px-2 py-0.5 text-xs text-faint">
              #{t}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-1 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onEdit(entry)}
          className="text-xs text-muted hover:text-content transition-colors"
        >
          Modifica
        </button>
        <button
          type="button"
          onClick={() => onDelete(entry)}
          className="text-xs text-muted hover:text-red-500 transition-colors"
        >
          Elimina
        </button>
      </div>
    </li>
  );
}
