import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { AppHeader } from '../components/layout/AppHeader.jsx';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { useStorico } from '../components/layout/useStorico.js';
import { JournalEntryForm } from '../components/journal/JournalEntryForm.jsx';
import { JournalEntryCard } from '../components/journal/JournalEntryCard.jsx';
import { listEntries, createEntry, updateEntry, deleteEntry } from '../lib/journalData.js';
import { emptyEntry, toFormFields, OUTCOME_OPTIONS } from '../lib/journalFields.js';

const DISCLAIMER =
  "Strumento di supporto all'analisi tecnica. Non è consulenza finanziaria. I dati inseriti sono un tuo registro personale.";

// Filtra le voci per testo (asset) ed esito. Estratto come funzione pura per chiarezza/test.
export function filterEntries(entries, { query, outcome }) {
  const q = (query ?? '').trim().toLowerCase();
  return entries.filter((e) => {
    if (outcome && (e.outcome ?? '') !== outcome) return false;
    if (q && !(e.asset ?? '').toLowerCase().includes(q)) return false;
    return true;
  });
}

export default function Journal() {
  const location = useLocation();
  const storico = useStorico();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(null); // { entry|null } quando il form è aperto
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const [query, setQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await listEntries());
    } catch {
      setError('Impossibile caricare il journal. Riprova.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Arrivo dalla Chat con «Salva nel journal»: apre il form pre-compilato (una sola volta al mount).
  useEffect(() => {
    const prefill = location.state?.newEntry;
    if (prefill) setEditing({ initial: prefill, entry: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openNew() {
    setFormError(null);
    setEditing({ initial: emptyEntry(), entry: null });
  }

  function openEdit(entry) {
    setFormError(null);
    setEditing({ initial: toFormFields(entry), entry });
  }

  function closeForm() {
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(dbFields) {
    setSaving(true);
    setFormError(null);
    try {
      if (editing?.entry) {
        const updated = await updateEntry(editing.entry.id, dbFields);
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        const created = await createEntry(dbFields);
        setEntries((prev) => [created, ...prev]);
      }
      closeForm();
    } catch {
      setFormError('Salvataggio non riuscito. Riprova.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry) {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Eliminare questa voce dal journal?')) return;
    const previous = entries;
    setEntries((prev) => prev.filter((e) => e.id !== entry.id)); // ottimistico
    try {
      await deleteEntry(entry.id);
    } catch {
      setEntries(previous); // rollback: mai perdere dati a vista
      setError('Eliminazione non riuscita. Riprova.');
    }
  }

  const visible = filterEntries(entries, { query, outcome: outcomeFilter });

  return (
    <div className="min-h-screen flex flex-col bg-app text-content">
      <AppHeader onOpenSidebar={storico.openSidebar} className="border-b border-line shrink-0" />

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Journal</h1>
              <p className="text-sm text-muted">Il tuo diario di trading: decisioni, esiti e lezioni.</p>
            </div>
            <button
              type="button"
              onClick={openNew}
              className="bg-freedom-accent text-slate-950 font-semibold px-4 py-2 rounded-2xl hover:bg-freedom-accentHover transition-colors text-sm shrink-0"
            >
              + Nuova voce
            </button>
          </div>

          {/* Filtri */}
          <div className="flex flex-wrap gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca asset…"
              aria-label="Cerca per asset"
              className="flex-1 min-w-[10rem] bg-surface-strong border border-line rounded-xl px-3 py-2 text-content text-sm placeholder:text-faint focus:outline-none focus:border-freedom-accent"
            />
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              aria-label="Filtra per esito"
              className="bg-surface-strong border border-line rounded-xl px-3 py-2 text-content text-sm focus:outline-none focus:border-freedom-accent"
            >
              <option value="" className="bg-app text-content">Tutti gli esiti</option>
              {OUTCOME_OPTIONS.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value} className="bg-app text-content">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {loading && <p className="text-muted text-sm">Caricamento…</p>}
          {error && (
            <p role="alert" className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </p>
          )}

          {!loading && !error && entries.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line p-8 text-center">
              <p className="text-muted">Il journal è vuoto.</p>
              <p className="text-sm text-faint mt-1">
                Annota la tua prima operazione con «Nuova voce», oppure salva un’analisi dalla chat.
              </p>
            </div>
          )}

          {!loading && !error && entries.length > 0 && visible.length === 0 && (
            <p className="text-faint text-sm">Nessuna voce corrisponde ai filtri.</p>
          )}

          {visible.length > 0 && (
            <ul className="flex flex-col gap-3">
              {visible.map((entry) => (
                <JournalEntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}
        </div>
      </main>

      <footer
        role="contentinfo"
        className="border-t border-line px-6 py-3 text-xs text-muted text-center shrink-0"
      >
        {DISCLAIMER}
      </footer>

      {/* Modale form crea/modifica */}
      {editing && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeForm} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editing.entry ? 'Modifica voce' : 'Nuova voce'}
            className="relative z-50 w-full max-w-2xl my-8 rounded-2xl border border-line bg-surface p-6 shadow-2xl"
          >
            <h2 className="text-lg font-semibold mb-4">
              {editing.entry ? 'Modifica voce' : 'Nuova voce'}
            </h2>
            <JournalEntryForm
              initial={editing.initial}
              onSubmit={handleSubmit}
              onCancel={closeForm}
              saving={saving}
              linkedToChat={Boolean(editing.initial?.chat_id)}
            />
            {formError && (
              <p role="alert" className="text-red-600 dark:text-red-400 text-sm mt-3">
                {formError}
              </p>
            )}
          </div>
        </div>
      )}

      <Sidebar
        open={storico.open}
        onClose={storico.closeSidebar}
        chats={storico.chats}
        loading={storico.loading}
        error={storico.error}
        renameError={storico.renameError}
        onSelectChat={storico.selectChat}
        onNuovaAnalisi={storico.nuovaAnalisi}
        onRenameChat={storico.renameChat}
      />
    </div>
  );
}
