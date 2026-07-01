// Route agente: POST /api/agent/analyze
// Riceve { chatId, images? } + header Authorization: Bearer <access_token Supabase>.
// Verifica autenticazione + proprietà della chat tramite un client vincolato al token utente
// (la RLS resta attiva: si accede SOLO alle proprie chat — isolamento, LOCK Bussola §2).
// Chiama l'orchestrator e restituisce il testo dell'analisi. La persistenza dei messaggi
// (utente + assistant) avviene nel flusso client (chatData), non qui.
// RULE prodotto: mai un'eccezione non gestita verso l'utente — ogni errore -> messaggio chiaro.
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { runAnalysis } from '../agent/orchestrator.js';

export const agentRouter = Router();

const MAX_IMAGES = Number(process.env.MAX_SCREENSHOT_PER_ANALISI) || 3;

// Client Supabase per-richiesta, vincolato al token dell'utente: la RLS filtra alle sue chat.
function userClient(token) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Traduce un errore tecnico in un messaggio chiaro per la chat.
export function messaggioErrore(err) {
  const m = err?.message || '';
  if (m.includes('GOOGLE_API_KEY') || m.includes('Chiave AI') || m.includes('Provider AI')) {
    return "L'analisi non è configurata correttamente (chiave o provider AI). Avvisa chi gestisce il sistema.";
  }
  if (m.includes('Gemini') || m.toLowerCase().includes('fetch') || m.toLowerCase().includes('network')) {
    return "L'agente non è raggiungibile in questo momento. Riprova tra poco.";
  }
  if (m.includes('cronologia') || m.includes('analizzare')) {
    return 'Non riesco a recuperare questa conversazione. Riprova.';
  }
  return 'Qualcosa è andato storto durante l’analisi. Riprova.';
}

agentRouter.post('/analyze', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
    if (!token) {
      return res.status(401).json({ error: 'Sessione non valida. Esci e rientra.' });
    }

    const { chatId, images } = req.body || {};
    if (!chatId) {
      return res.status(400).json({ error: 'Richiesta incompleta: manca la chat.' });
    }

    const imgs = Array.isArray(images) ? images : [];
    if (imgs.length > MAX_IMAGES) {
      return res.status(400).json({ error: `Troppi screenshot: massimo ${MAX_IMAGES}.` });
    }

    const supabase = userClient(token);

    // Verifica token + proprietà chat: con la RLS, la select torna vuota se la chat non è sua.
    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .maybeSingle();
    if (chatErr) {
      return res.status(401).json({ error: 'Sessione non valida. Esci e rientra.' });
    }
    if (!chat) {
      return res.status(404).json({ error: 'Analisi non trovata.' });
    }

    // { text: prosa mostrata all'utente, transcript: scheda JSON dell'analisi (o null) — M4 }
    const { text, transcript } = await runAnalysis({ supabase, chatId, images: imgs });
    return res.json({ text, transcript });
  } catch (err) {
    console.error('[agent] analyze:', err?.message);
    return res.status(502).json({ error: messaggioErrore(err) });
  }
});
