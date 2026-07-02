import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NewAnalysisForm } from '../components/chat/NewAnalysisForm.jsx';
import { ChatPanel } from '../components/chat/ChatPanel.jsx';
import { AppHeader } from '../components/layout/AppHeader.jsx';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { useStorico } from '../components/layout/useStorico.js';
import { createChat, addMessage, loadMessages, getChat } from '../lib/chatData.js';
import { analyzeChatStream } from '../lib/agentApi.js';
import { followUpLimitReached } from '../lib/followUp.js';
import { prefillFromChat } from '../lib/journalFields.js';

const DISCLAIMER =
  "Strumento di supporto all'analisi tecnica. Non è consulenza finanziaria.";

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const storico = useStorico();
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatContext, setChatContext] = useState(null); // chat corrente (per il pre-fill journal)
  const [messages, setMessages] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [streamingText, setStreamingText] = useState(null); // prosa in arrivo (M5), o parziale su interruzione

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

  // Carica il form_context della chat corrente per pre-compilare il journal («Salva nel journal»).
  // Vale sia per una chat appena creata sia per una riaperta dallo storico. Errori ignorati: il
  // pulsante funziona comunque (senza pre-fill di asset/posizione).
  useEffect(() => {
    if (!currentChatId) {
      setChatContext(null);
      return;
    }
    let cancelled = false;
    getChat(currentChatId)
      .then((c) => {
        if (!cancelled) setChatContext(c);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentChatId]);

  // Arrivo dalla Home/Impostazioni selezionando una chat dello storico: la rotta porta
  // `openChatId` nello stato di navigazione → apri quella chat all'ingresso. Solo al mount
  // (non riapre sui re-render). Senza stato, resta il form pulito (default) = «Nuova analisi».
  useEffect(() => {
    const chatId = location.state?.openChatId;
    if (chatId) {
      setCurrentChatId(chatId);
      setShowForm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Limite approfondimenti: dopo la prima analisi l'utente può fare al massimo 5 follow-up
  // (vedi lib/followUp.js). Raggiunto il limite, la scrittura si blocca. Il server è comunque
  // l'autorità e rifiuta un follow-up oltre soglia (routes/agent.js).
  const followUpLimit = followUpLimitReached(messages);

  // Follow-up: solo testo, nessun nuovo screenshot (le immagini esistono solo nel primo turno).
  async function handleSendMessage(content) {
    if (followUpLimit) return; // barriera anche qui: mai inviare oltre il limite
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

  // Sulla pagina Chat la selezione di una chat e la nuova analisi agiscono IN-PLACE (senza
  // cambiare rotta): sovrascrivono le navigazioni di default del hook. Chiudono poi il drawer.
  function handleSelectChat(chatId) {
    setCurrentChatId(chatId);
    setShowForm(false);
    setFormError(null);
    setMessagesError(null);
    setAnalysisError(null);
    setStreamingText(null);
    storico.closeSidebar();
  }

  function handleNuovaChatFromSidebar() {
    handleNuovaAnalisi();
    storico.closeSidebar();
  }

  // «Salva nel journal»: porta alla pagina Journal col form pre-compilato dai dati dell'analisi
  // (asset, timeframe decisionale e, se dichiarata, la posizione). Il resto lo completa l'utente.
  function handleSalvaNelJournal() {
    const prefill = prefillFromChat(chatContext ?? { id: currentChatId });
    navigate('/journal', { state: { newEntry: prefill } });
  }

  return (
    <div className="h-screen bg-app text-content flex flex-col">
      <AppHeader onOpenSidebar={storico.openSidebar} className="border-b border-line shrink-0" />

      {/* area principale */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {showForm || !currentChatId ? (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {formError && (
              <p role="alert" className="text-red-600 dark:text-red-400 text-sm text-center px-4 mb-2">
                {formError}
              </p>
            )}
            <div className="my-auto">
              <NewAnalysisForm onSubmit={handleFormSubmit} loading={formLoading} />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0 flex-col">
            <div className="flex justify-end px-4 py-2 border-b border-line shrink-0">
              <button
                type="button"
                onClick={handleSalvaNelJournal}
                className="text-sm text-freedom-accent hover:text-freedom-accentHover transition-colors"
              >
                + Salva nel journal
              </button>
            </div>
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              loading={messagesLoading}
              error={messagesError}
              analyzing={analyzing}
              analysisError={analysisError}
              streamingText={streamingText}
              limitReached={followUpLimit}
            />
          </div>
        )}
      </main>

      {/* disclaimer fisso */}
      <footer
        role="contentinfo"
        className="border-t border-line px-6 py-3 text-xs text-muted text-center shrink-0"
      >
        {DISCLAIMER}
      </footer>

      <Sidebar
        open={storico.open}
        onClose={storico.closeSidebar}
        chats={storico.chats}
        loading={storico.loading}
        error={storico.error}
        renameError={storico.renameError}
        deleteError={storico.deleteError}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNuovaAnalisi={handleNuovaChatFromSidebar}
        onRenameChat={storico.renameChat}
        onDeleteChat={storico.deleteChat}
      />
    </div>
  );
}
