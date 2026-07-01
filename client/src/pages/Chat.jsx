import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { NewAnalysisForm } from '../components/chat/NewAnalysisForm.jsx';
import { ChatPanel } from '../components/chat/ChatPanel.jsx';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { createChat, addMessage, loadMessages, listChats, updateChatTitle } from '../lib/chatData.js';
import { analyzeChatStream } from '../lib/agentApi.js';

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
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [streamingText, setStreamingText] = useState(null); // prosa in arrivo (M5), o parziale su interruzione
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState(null);
  const [renameError, setRenameError] = useState(null);

  const fetchChats = useCallback(async () => {
    setChatsLoading(true);
    setChatsError(null);
    try {
      const data = await listChats();
      setChats(data);
    } catch {
      setChatsError('Impossibile caricare lo storico. Riprova.');
    } finally {
      setChatsLoading(false);
    }
  }, []);

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

  // Esegue un turno di analisi in STREAMING (M5): la prosa scorre a schermo man mano che arriva;
  // a fine risposta si salva il messaggio con la scheda JSON (M4). Se lo stream si interrompe, il
  // testo parziale resta a vista con un avviso e NON viene salvato. Non rilancia (mai un crash a vista).
  async function runAnalysisTurn(chatId, images) {
    setAnalyzing(true);
    setAnalysisError(null);
    setStreamingText('');
    let streamed = '';
    try {
      const { transcript } = await analyzeChatStream(chatId, images, {
        onDelta: (t) => {
          streamed += t;
          setStreamingText(streamed);
        },
      });
      // M4: la scheda (se presente) si salva come elemento tipizzato in attachments (jsonb, array).
      const attachments = transcript ? [{ type: 'transcript', data: transcript }] : null;
      const assistantMsg = await addMessage(chatId, streamed, 'assistant', attachments);
      setMessages((prev) => [...prev, assistantMsg]);
      setStreamingText(null); // ora è un messaggio salvato: svuota il buffer progressivo
    } catch (e) {
      // Interruzione/errore: tieni il testo parziale a vista (streamingText) + avviso, senza salvare.
      setAnalysisError(e?.message || 'Analisi non riuscita. Riprova.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleFormSubmit({ title, summary, formContext, images }) {
    setFormLoading(true);
    setFormError(null);
    try {
      const chat = await createChat(title, formContext);
      const userMsg = await addMessage(chat.id, summary, 'user');
      setCurrentChatId(chat.id);
      setShowForm(false);
      setMessages([userMsg]);
      await runAnalysisTurn(chat.id, images);
    } catch {
      setFormError('Avvio analisi non riuscito. Riprova.');
    } finally {
      setFormLoading(false);
    }
  }

  // Follow-up: solo testo, nessun nuovo screenshot (le immagini esistono solo nel primo turno).
  async function handleSendMessage(content) {
    const msg = await addMessage(currentChatId, content, 'user');
    setMessages((prev) => [...prev, msg]);
    await runAnalysisTurn(currentChatId, []);
  }

  function handleNuovaAnalisi() {
    setCurrentChatId(null);
    setMessages([]);
    setShowForm(true);
    setFormError(null);
    setMessagesError(null);
    setAnalysisError(null);
    setStreamingText(null);
  }

  function handleOpenSidebar() {
    setSidebarOpen(true);
    setRenameError(null);
    fetchChats();
  }

  function handleSelectChat(chatId) {
    setCurrentChatId(chatId);
    setShowForm(false);
    setFormError(null);
    setMessagesError(null);
    setAnalysisError(null);
    setStreamingText(null);
    setSidebarOpen(false);
  }

  function handleNuovaChatFromSidebar() {
    handleNuovaAnalisi();
    setSidebarOpen(false);
  }

  async function handleRenameChat(chatId, title) {
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
  }

  return (
    <div className="h-screen bg-freedom-bg text-white flex flex-col">
      {/* header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenSidebar}
            aria-label="Apri storico chat"
            className="text-white/70 hover:text-white"
          >
            ☰
          </button>
          <span className="font-bold text-freedom-accent">FREEDOM TRADING SYSTEM</span>
        </div>
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
            loading={messagesLoading}
            error={messagesError}
            analyzing={analyzing}
            analysisError={analysisError}
            streamingText={streamingText}
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

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        chats={chats}
        loading={chatsLoading}
        error={chatsError}
        renameError={renameError}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onRenameChat={handleRenameChat}
        onNuovaChat={handleNuovaChatFromSidebar}
      />
    </div>
  );
}
