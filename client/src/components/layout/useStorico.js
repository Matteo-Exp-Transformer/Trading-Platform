import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteChat as deleteChatRecord, listChats, updateChatTitle } from '../../lib/chatData.js';

// Stato + logica dello Storico/Sidebar in un solo posto, così ogni pagina autenticata
// (Home · Chat · Impostazioni) apre la STESSA Sidebar senza duplicare lista o logica.
// Espone anche le navigazioni di default (selectChat/nuovaAnalisi) usate dalle pagine che
// non ospitano la chat: aprono la Chat andando su «/nuova-analisi». La pagina Chat, invece,
// passa i propri handler in-place (carica la chat senza cambiare rotta).
export function useStorico() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [renameError, setRenameError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const fetchChats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setChats(await listChats());
    } catch {
      setError('Impossibile caricare lo storico. Riprova.');
    } finally {
      setLoading(false);
    }
  }, []);

  const openSidebar = useCallback(() => {
    setRenameError(null);
    setDeleteError(null);
    setOpen(true);
    fetchChats();
  }, [fetchChats]);

  const closeSidebar = useCallback(() => setOpen(false), []);

  const renameChat = useCallback(async (chatId, title) => {
    setRenameError(null);
    try {
      const updated = await updateChatTitle(chatId, title);
      setChats((prev) =>
        prev
          .map((c) => (c.id === chatId ? updated : c))
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)),
      );
    } catch {
      setRenameError('Rinomina non riuscita. Riprova.');
    }
  }, []);

  const deleteChat = useCallback(async (chatId) => {
    setDeleteError(null);
    try {
      await deleteChatRecord(chatId);
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      return true;
    } catch {
      setDeleteError('Eliminazione non riuscita. Riprova.');
      return false;
    }
  }, []);

  // Navigazioni di default: dalla Home/Impostazioni la chat si apre andando alla rotta Chat.
  const selectChat = useCallback(
    (chatId) => {
      setOpen(false);
      navigate('/nuova-analisi', { state: { openChatId: chatId } });
    },
    [navigate],
  );

  const nuovaAnalisi = useCallback(() => {
    setOpen(false);
    navigate('/nuova-analisi', { state: { nuovaAnalisi: true } });
  }, [navigate]);

  return {
    open,
    chats,
    loading,
    error,
    renameError,
    deleteError,
    openSidebar,
    closeSidebar,
    fetchChats,
    renameChat,
    deleteChat,
    selectChat,
    nuovaAnalisi,
  };
}
