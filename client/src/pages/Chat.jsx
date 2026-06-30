import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { NewAnalysisForm } from '../components/chat/NewAnalysisForm.jsx';
import { ChatPanel } from '../components/chat/ChatPanel.jsx';
import { createChat, addMessage, loadMessages } from '../lib/chatData.js';

const DISCLAIMER =
  "Strumento di supporto all'analisi tecnica. Non è consulenza finanziaria.";

export default function Chat() {
  const { profile, session, logout } = useAuth();
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);

  const fetchMessages = useCallback(async (chatId) => {
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const data = await loadMessages(chatId);
      setMessages(data);
    } catch {
      setMessagesError('Impossibile caricare i messaggi. Riprova.');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentChatId) fetchMessages(currentChatId);
  }, [currentChatId, fetchMessages]);

  async function handleFormSubmit({ title, summary }) {
    setFormLoading(true);
    setFormError(null);
    try {
      const chat = await createChat(title);
      await addMessage(chat.id, summary);
      setCurrentChatId(chat.id);
      setShowForm(false);
    } catch {
      setFormError('Avvio analisi non riuscito. Riprova.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleSendMessage(content) {
    const msg = await addMessage(currentChatId, content);
    setMessages((prev) => [...prev, msg]);
  }

  function handleNuovaAnalisi() {
    setCurrentChatId(null);
    setMessages([]);
    setShowForm(true);
    setFormError(null);
    setMessagesError(null);
  }

  return (
    <div className="h-screen bg-freedom-bg text-white flex flex-col">
      {/* header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
        <span className="font-bold text-freedom-accent">FREEDOM TRADING SYSTEM</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/50 hidden sm:inline">
            {profile?.display_name ?? session?.user?.email}
          </span>
          <button
            onClick={logout}
            className="text-sm text-white/70 hover:text-white"
          >
            Esci
          </button>
        </div>
      </header>

      {/* area principale */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {showForm || !currentChatId ? (
          <div className="flex-1 overflow-y-auto flex flex-col justify-center">
            {formError && (
              <p role="alert" className="text-red-400 text-sm text-center px-4 mb-2">
                {formError}
              </p>
            )}
            <NewAnalysisForm onSubmit={handleFormSubmit} loading={formLoading} />
          </div>
        ) : (
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            onNuovaAnalisi={handleNuovaAnalisi}
            loading={messagesLoading}
            error={messagesError}
          />
        )}
      </main>

      {/* disclaimer fisso */}
      <footer
        role="contentinfo"
        className="border-t border-white/10 px-6 py-3 text-xs text-white/60 text-center shrink-0"
      >
        {DISCLAIMER}
      </footer>
    </div>
  );
}
