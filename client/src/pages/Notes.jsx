import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '../components/layout/AppHeader.jsx';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { useStorico } from '../components/layout/useStorico.js';
import { NoteCard } from '../components/notes/NoteCard.jsx';
import { NoteEditor } from '../components/notes/NoteEditor.jsx';
import { createNote, deleteNote, listNotes, updateNote } from '../lib/notesData.js';
import { emptyNote, toFormFields } from '../lib/notesFields.js';

const DISCLAIMER =
  "Strumento di supporto all'analisi tecnica. Non è consulenza finanziaria.";

export default function Notes() {
  const storico = useStorico();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNotes(await listNotes());
    } catch {
      setError('Impossibile caricare le note. Riprova.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  function openNew() {
    setFormError(null);
    setEditing({ note: null, initial: emptyNote() });
  }

  function openEdit(note) {
    setFormError(null);
    setEditing({ note, initial: toFormFields(note) });
  }

  function closeEditor() {
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(fields) {
    setSaving(true);
    setFormError(null);
    try {
      if (editing?.note) {
        const updated = await updateNote(editing.note.id, fields);
        setNotes((previous) => [
          updated,
          ...previous.filter((note) => note.id !== updated.id),
        ]);
      } else {
        const created = await createNote(fields);
        setNotes((previous) => [created, ...previous]);
      }
      closeEditor();
    } catch {
      setFormError('Salvataggio non riuscito. Riprova.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(note) {
    const confirmed = window.confirm(
      'Eliminare questa nota? L’azione non può essere annullata.',
    );
    if (!confirmed) return;

    const previous = notes;
    setNotes((current) => current.filter((item) => item.id !== note.id));
    setError(null);
    try {
      await deleteNote(note.id);
    } catch {
      setNotes(previous);
      setError('Eliminazione non riuscita. Riprova.');
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-app text-content">
      <AppHeader
        onOpenSidebar={storico.openSidebar}
        className="shrink-0 border-b border-line"
      />

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Note</h1>
              <p className="text-sm text-muted">
                Il tuo taccuino personale, sempre a portata di mano.
              </p>
            </div>
            <button
              type="button"
              onClick={openNew}
              className="shrink-0 rounded-2xl bg-freedom-accent px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-freedom-accentHover"
            >
              + Nuova nota
            </button>
          </div>

          {loading && <p className="text-sm text-muted">Caricamento…</p>}
          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {!loading && !error && notes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line p-8 text-center">
              <p className="text-muted">Il taccuino è vuoto.</p>
              <p className="mt-1 text-sm text-faint">
                Crea la prima nota e personalizzala con font e colore.
              </p>
            </div>
          )}

          {notes.length > 0 && (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
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
        className="shrink-0 border-t border-line px-6 py-3 text-center text-xs text-muted"
      >
        {DISCLAIMER}
      </footer>

      {editing && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeEditor}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editing.note ? 'Modifica nota' : 'Nuova nota'}
            className="relative z-50 my-8 w-full max-w-2xl rounded-2xl border border-line bg-surface p-6 shadow-2xl"
          >
            <h2 className="mb-4 text-lg font-semibold">
              {editing.note ? 'Modifica nota' : 'Nuova nota'}
            </h2>
            <NoteEditor
              initial={editing.initial}
              onSubmit={handleSubmit}
              onCancel={closeEditor}
              saving={saving}
            />
            {formError && (
              <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
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
        deleteError={storico.deleteError}
        onSelectChat={storico.selectChat}
        onNuovaAnalisi={storico.nuovaAnalisi}
        onRenameChat={storico.renameChat}
        onDeleteChat={storico.deleteChat}
      />
    </div>
  );
}
