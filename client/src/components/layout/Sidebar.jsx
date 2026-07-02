import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.jsx';

function formatChatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Stile condiviso delle voci di navigazione: attiva = superficie più marcata (token esistenti),
// inattiva = tenue con hover. Nessun colore fuori dai token slate+ciano.
function navItemClass(active) {
  return `flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
    active ? 'bg-surface-stronger text-content' : 'text-muted hover:bg-surface hover:text-content'
  }`;
}

function SidebarChatRow({ chat, active, onSelect, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);
  const [deleting, setDeleting] = useState(false);

  function startEdit(e) {
    e.stopPropagation();
    setTitle(chat.title);
    setEditing(true);
  }

  function commitEdit() {
    setEditing(false);
    const trimmed = title.trim();
    if (trimmed && trimmed !== chat.title) onRename(chat.id, trimmed);
  }

  async function confirmDelete(e) {
    e.stopPropagation();
    const confirmed = window.confirm(
      'Eliminare questa chat e tutti i suoi messaggi? L’azione non può essere annullata.',
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await onDelete(chat.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li
      onClick={() => !editing && onSelect(chat.id)}
      className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer ${
        active ? 'bg-surface-stronger' : 'hover:bg-surface'
      }`}
    >
      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') setEditing(false);
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-surface-strong border border-freedom-accent rounded-lg px-2 py-1 text-sm text-content focus:outline-none"
        />
      ) : (
        <div className="flex-1 min-w-0">
          <p className="text-sm text-content truncate">{chat.title}</p>
          <p className="text-xs text-faint">{formatChatDate(chat.updated_at)}</p>
        </div>
      )}
      {!editing && (
        <div className="flex items-center gap-2 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={startEdit}
            disabled={deleting}
            aria-label="Rinomina chat"
            title="Rinomina chat"
            className="text-muted hover:text-content disabled:opacity-50 text-xs transition-colors"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deleting}
            aria-label="Elimina chat"
            title="Elimina chat"
            className="text-muted hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
          >
            {deleting ? (
              <span aria-hidden="true" className="text-xs">…</span>
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v5M14 11v5" />
              </svg>
            )}
          </button>
        </div>
      )}
    </li>
  );
}

// Sidebar (drawer) condivisa da tutte le pagine autenticate. Organizza: Home · Nuova analisi ·
// sezione «Le mie analisi» (storico) · Impostazioni · Esci (in fondo, separato). Impostazioni ed
// Esci vivono SOLO qui, non negli header. La navigazione tra le rotte usa i Link/useLocation
// interni (stato attivo evidenziato); le azioni che dipendono dalla pagina (apri una chat, nuova
// analisi) arrivano come callback. Il logout riusa l'azione esistente da useAuth.
export function Sidebar({
  open,
  onClose,
  chats,
  loading,
  error,
  renameError,
  deleteError,
  currentChatId,
  onSelectChat,
  onNuovaAnalisi,
  onRenameChat,
  onDeleteChat,
}) {
  const { pathname } = useLocation();
  const { logout } = useAuth();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <aside
        aria-label="Menu"
        className="sidebar-panel relative z-50 w-72 max-w-[80vw] h-full bg-surface border-r border-line shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-line shrink-0">
          <span className="text-sm font-semibold text-muted">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi menu"
            className="text-muted hover:text-content"
          >
            ✕
          </button>
        </div>

        {/* Navigazione principale */}
        <nav aria-label="Navigazione" className="flex flex-col gap-1 px-2 py-3 shrink-0">
          <Link
            to="/"
            onClick={onClose}
            aria-current={pathname === '/' ? 'page' : undefined}
            className={navItemClass(pathname === '/')}
          >
            <span aria-hidden="true">⌂</span> Home
          </Link>
          <button
            type="button"
            onClick={onNuovaAnalisi}
            aria-current={pathname === '/nuova-analisi' ? 'page' : undefined}
            className={navItemClass(pathname === '/nuova-analisi')}
          >
            <span aria-hidden="true">＋</span> Nuova analisi
          </button>
          <Link
            to="/journal"
            onClick={onClose}
            aria-current={pathname === '/journal' ? 'page' : undefined}
            className={navItemClass(pathname === '/journal')}
          >
            <span aria-hidden="true">▤</span> Journal
          </Link>
          <Link
            to="/note"
            onClick={onClose}
            aria-current={pathname === '/note' ? 'page' : undefined}
            className={navItemClass(pathname === '/note')}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <rect x="6" y="3" width="14" height="18" rx="2" />
              <path d="M10 3v18M3.5 7H8M3.5 12H8M3.5 17H8" />
            </svg>
            Note
          </Link>
        </nav>

        {/* Storico */}
        <div className="px-4 pt-1 pb-2 shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-faint">
            Le mie analisi
          </span>
        </div>

        {renameError && (
          <p role="alert" className="text-red-600 dark:text-red-400 text-sm text-center px-4 pb-2 shrink-0">
            {renameError}
          </p>
        )}
        {deleteError && (
          <p role="alert" className="text-red-600 dark:text-red-400 text-sm text-center px-4 pb-2 shrink-0">
            {deleteError}
          </p>
        )}

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading && <p className="text-muted text-sm text-center px-2">Caricamento…</p>}
          {error && (
            <p role="alert" className="text-red-600 dark:text-red-400 text-sm text-center px-2">
              {error}
            </p>
          )}
          {!loading && !error && chats.length === 0 && (
            <p className="text-faint text-sm text-center px-2">Nessuna chat ancora.</p>
          )}
          <ul className="flex flex-col gap-1">
            {chats.map((chat) => (
              <SidebarChatRow
                key={chat.id}
                chat={chat}
                active={chat.id === currentChatId}
                onSelect={onSelectChat}
                onRename={onRenameChat}
                onDelete={async (chatId) => {
                  const deleted = await onDeleteChat(chatId);
                  if (deleted && chatId === currentChatId) onNuovaAnalisi();
                  return deleted;
                }}
              />
            ))}
          </ul>
        </div>

        {/* Impostazioni + Esci: ancorati in fondo, separati dal resto */}
        <div className="border-t border-line px-2 py-3 shrink-0 flex flex-col gap-1">
          <Link
            to="/impostazioni"
            onClick={onClose}
            aria-current={pathname === '/impostazioni' ? 'page' : undefined}
            className={navItemClass(pathname === '/impostazioni')}
          >
            <span aria-hidden="true">⚙</span> Impostazioni
          </Link>
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className={navItemClass(false)}
          >
            <span aria-hidden="true">⎋</span> Esci
          </button>
        </div>
      </aside>
    </div>
  );
}
