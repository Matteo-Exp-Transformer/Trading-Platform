import { useState } from 'react';
import {
  DIRECTION_OPTIONS,
  OUTCOME_OPTIONS,
  EMOTION_SUGGESTIONS,
  toDbFields,
} from '../../lib/journalFields.js';

const inputCls =
  'bg-surface-strong border border-line rounded-xl px-3 py-2 text-content text-sm ' +
  'placeholder:text-faint focus:outline-none focus:border-freedom-accent';

function Field({ label, children, hint }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </label>
  );
}

// Form di una voce di journal (crea/modifica). Riceve i campi già come stringhe (toFormFields),
// li tiene controllati e all'invio li normalizza verso i tipi DB (toDbFields). L'asset è l'unico
// campo obbligatorio: senza, non ha senso una voce. I numeri sono opzionali (li registriamo, non
// li consigliamo — vedi disclaimer in pagina).
export function JournalEntryForm({ initial, onSubmit, onCancel, saving = false, linkedToChat = false }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState(null);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!(form.asset ?? '').trim()) {
      setError('Indica almeno l’asset (es. EURUSD).');
      return;
    }
    setError(null);
    onSubmit(toDbFields(form));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {linkedToChat && (
        <p className="text-xs text-freedom-accent">Collegata all’analisi selezionata.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Asset *">
          <input
            className={inputCls}
            value={form.asset}
            onChange={(e) => set('asset', e.target.value)}
            placeholder="Es. EURUSD"
          />
        </Field>
        <Field label="Timeframe">
          <input
            className={inputCls}
            value={form.timeframe}
            onChange={(e) => set('timeframe', e.target.value)}
            placeholder="Es. 5m"
          />
        </Field>
        <Field label="Data">
          <input
            type="date"
            className={inputCls}
            value={form.traded_at}
            onChange={(e) => set('traded_at', e.target.value)}
          />
        </Field>
        <Field label="Direzione">
          <select
            className={inputCls}
            value={form.direction}
            onChange={(e) => set('direction', e.target.value)}
          >
            {DIRECTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-app text-content">
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Esito">
          <select
            className={inputCls}
            value={form.outcome}
            onChange={(e) => set('outcome', e.target.value)}
          >
            {OUTCOME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-app text-content">
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Emozione">
          <input
            className={inputCls}
            value={form.emotion}
            onChange={(e) => set('emotion', e.target.value)}
            placeholder={EMOTION_SUGGESTIONS.join(' · ')}
            list="journal-emotions"
          />
          <datalist id="journal-emotions">
            {EMOTION_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
      </div>

      {/* Numeri del trade (opzionali) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Entry">
          <input className={inputCls} value={form.entry_price} onChange={(e) => set('entry_price', e.target.value)} placeholder="0.00" inputMode="decimal" />
        </Field>
        <Field label="Exit">
          <input className={inputCls} value={form.exit_price} onChange={(e) => set('exit_price', e.target.value)} placeholder="0.00" inputMode="decimal" />
        </Field>
        <Field label="Stop">
          <input className={inputCls} value={form.stop_price} onChange={(e) => set('stop_price', e.target.value)} placeholder="0.00" inputMode="decimal" />
        </Field>
        <Field label="R:R">
          <input className={inputCls} value={form.rr} onChange={(e) => set('rr', e.target.value)} placeholder="Es. 2" inputMode="decimal" />
        </Field>
        <Field label="P&L (opz.)">
          <input className={inputCls} value={form.pnl} onChange={(e) => set('pnl', e.target.value)} placeholder="Es. 120" inputMode="decimal" />
        </Field>
        <Field label="Tag">
          <input className={inputCls} value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="breakout, contro-trend" />
        </Field>
      </div>

      <Field label="Nota" hint="Cos'è successo, come hai gestito il trade.">
        <textarea
          className={`${inputCls} resize-none`}
          rows={3}
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
          placeholder="Contesto, esecuzione, dubbi…"
        />
      </Field>

      <Field label="Lezione appresa" hint="La cosa da ricordare per la prossima volta.">
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          value={form.lesson}
          onChange={(e) => set('lesson', e.target.value)}
          placeholder="Es. Ho anticipato l’ingresso senza conferma."
        />
      </Field>

      {error && (
        <p role="alert" className="text-red-600 dark:text-red-400 text-sm">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-2xl text-sm text-muted hover:text-content transition-colors"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-freedom-accent text-slate-950 font-semibold px-5 py-2 rounded-2xl hover:bg-freedom-accentHover disabled:opacity-50 transition-colors text-sm"
        >
          {saving ? 'Salvataggio…' : 'Salva voce'}
        </button>
      </div>
    </form>
  );
}
