import { useState } from 'react';
import { Link } from 'react-router-dom';

function formatChatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function SidebarChatRow({ chat, active, onSelect, onRename }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);

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
        <button
          type="button"
          onClick={startEdit}
          aria-label="Rinomina chat"
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted hover:text-content text-xs shrink-0 transition-opacity"
        >
          ✎
        </button>
      )}
    </li>
  );
}

export function Sidebar({
  open,
  onClose,
  chats,
  loading,
  error,
  renameError,
  currentChatId,
  onSelectChat,
  onRenameChat,
  onNuovaChat,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <aside
        aria-label="Storico chat"
        className="sidebar-panel relative z-50 w-72 max-w-[80vw] h-full bg-surface border-r border-line shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-line shrink-0">
          <span className="text-sm font-semibold text-muted">Storico chat</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi storico chat"
            className="text-muted hover:text-content"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-3 shrink-0">
          <button
            type="button"
            onClick={onNuovaChat}
            className="w-full bg-freedom-accent text-slate-950 rounded-full px-4 py-2 text-sm font-semibold hover:bg-freedom-accentHover transition-colors"
          >
            + Nuova chat
          </button>
        </div>

        {renameError && (
          <p role="alert" className="text-red-600 dark:text-red-400 text-sm text-center px-4 pb-2 shrink-0">
            {renameError}
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
              />
            ))}
          </ul>
        </div>

        <div className="border-t border-line px-2 py-3 shrink-0">
          <Link
            to="/impostazioni"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted hover:bg-surface hover:text-content"
          >
            <span aria-hidden="true">⚙</span> Impostazioni
          </Link>
        </div>
      </aside>
    </div>
  );
}
