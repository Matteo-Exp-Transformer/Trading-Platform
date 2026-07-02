import { useState } from 'react';
import {
  COLOR_OPTIONS,
  FONT_OPTIONS,
  noteTextStyle,
  toDbFields,
} from '../../lib/notesFields.js';

const fieldClass =
  'rounded-xl border border-line bg-surface-strong px-3 py-2 text-sm text-content ' +
  'placeholder:text-faint focus:border-freedom-accent focus:outline-none';

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

export function NoteEditor({ initial, onSubmit, onCancel, saving = false }) {
  const [form, setForm] = useState(initial);

  function setField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(toDbFields(form));
  }

  const previewStyle = noteTextStyle(form);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Titolo">
        <input
          value={form.title}
          onChange={(event) => setField('title', event.target.value)}
          className={fieldClass}
          placeholder="Es. Idee per la prossima settimana"
        />
      </Field>

      <Field label="Testo">
        <textarea
          value={form.content}
          onChange={(event) => setField('content', event.target.value)}
          className={`${fieldClass} min-h-44 resize-y`}
          placeholder="Scrivi qui la tua nota…"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Font">
          <select
            value={form.font}
            onChange={(event) => setField('font', event.target.value)}
            className={fieldClass}
          >
            {FONT_OPTIONS.map((option) => (
              <option
                key={option.value || 'default'}
                value={option.value}
                style={{ fontFamily: option.family }}
                className="bg-app text-content"
              >
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">Colore testo</span>
          <div
            role="group"
            aria-label="Colore testo"
            className="flex min-h-10 flex-wrap items-center gap-2"
          >
            {COLOR_OPTIONS.map((option) => {
              const selected = form.color === option.value;
              return (
                <button
                  key={option.value || 'default'}
                  type="button"
                  onClick={() => setField('color', option.value)}
                  aria-label={`Colore ${option.label}`}
                  aria-pressed={selected}
                  title={option.label}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border border-line transition ${
                    selected ? 'ring-2 ring-freedom-accent ring-offset-2 ring-offset-surface' : ''
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-5 w-5 rounded-full ${option.value ? '' : 'bg-content'}`}
                    style={option.value ? { backgroundColor: option.value } : undefined}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section
        aria-labelledby="note-preview-title"
        className="rounded-2xl border border-line bg-app/50 p-4"
      >
        <p id="note-preview-title" className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
          Anteprima
        </p>
        <div style={previewStyle}>
          <h3 className="break-words text-lg font-semibold">
            {form.title || 'Titolo della nota'}
          </h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {form.content || 'Scrivi qualcosa per vedere l’anteprima.'}
          </p>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl px-4 py-2 text-sm text-muted transition-colors hover:text-content"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-freedom-accent px-5 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-freedom-accentHover disabled:opacity-50"
        >
          {saving ? 'Salvataggio…' : 'Salva nota'}
        </button>
      </div>
    </form>
  );
}
