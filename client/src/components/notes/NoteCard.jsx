import { noteTextStyle } from '../../lib/notesFields.js';

export function NoteCard({ note, onEdit, onDelete }) {
  const title = note.title || 'Senza titolo';
  const content = note.content || 'Nota vuota.';
  const updatedAt = new Date(note.updated_at);
  const updatedLabel = Number.isNaN(updatedAt.getTime())
    ? ''
    : updatedAt.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

  return (
    <li className="flex h-full flex-col rounded-2xl border border-line bg-surface/70 p-5 transition-colors hover:border-freedom-accent">
      <article className="flex flex-1 flex-col">
        <div style={noteTextStyle(note)}>
          <h2 className="break-words text-lg font-semibold">{title}</h2>
          <p className="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {content}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="text-xs text-faint">{updatedLabel}</span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onEdit(note)}
              aria-label={`Modifica ${title}`}
              className="text-xs text-muted transition-colors hover:text-content"
            >
              Modifica
            </button>
            <button
              type="button"
              onClick={() => onDelete(note)}
              aria-label={`Elimina ${title}`}
              className="text-xs text-muted transition-colors hover:text-red-500"
            >
              Elimina
            </button>
          </div>
        </div>
      </article>
    </li>
  );
}
