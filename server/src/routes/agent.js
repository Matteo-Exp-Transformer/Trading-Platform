// Route agente: POST /api/agent/analyze
// Riceve { chatId, images? } + header Authorization: Bearer <access_token Supabase>.
// Verifica autenticazione + proprietà della chat tramite un client vincolato al token utente
// (la RLS resta attiva: si accede SOLO alle proprie chat — isolamento, LOCK Bussola §2).
// Chiama l'orchestrator e restituisce il testo dell'analisi. La persistenza dei messaggi
// (utente + assistant) avviene nel flusso client (chatData), non qui.
// RULE prodotto: mai un'eccezione non gestita verso l'utente — ogni errore -> messaggio chiaro.
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { runAnalysis, runAnalysisStream } from '../agent/orchestrator.js';

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

// Autenticazione + validazione + proprietà chat, condivisa da /analyze e /analyze/stream.
// Ritorna { supabase, chatId, imgs } se ok; altrimenti invia la risposta d'errore e ritorna null.
async function authorizeAnalyze(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
  if (!token) {
    res.status(401).json({ error: 'Sessione non valida. Esci e rientra.' });
    return null;
  }

  const { chatId, images } = req.body || {};
  if (!chatId) {
    res.status(400).json({ error: 'Richiesta incompleta: manca la chat.' });
    return null;
  }

  const imgs = Array.isArray(images) ? images : [];
  if (imgs.length > MAX_IMAGES) {
    res.status(400).json({ error: `Troppi screenshot: massimo ${MAX_IMAGES}.` });
    return null;
  }

  const supabase = userClient(token);

  // Verifica token + proprietà chat: con la RLS, la select torna vuota se la chat non è sua.
  const { data: chat, error: chatErr } = await supabase
    .from('chats')
    .select('id')
    .eq('id', chatId)
    .maybeSingle();
  if (chatErr) {
    res.status(401).json({ error: 'Sessione non valida. Esci e rientra.' });
    return null;
  }
  if (!chat) {
    res.status(404).json({ error: 'Analisi non trovata.' });
    return null;
  }

  return { supabase, chatId, imgs };
}

agentRouter.post('/analyze', async (req, res) => {
  try {
    const ctx = await authorizeAnalyze(req, res);
    if (!ctx) return;
    // { text: prosa mostrata all'utente, transcript: scheda JSON dell'analisi (o null) — M4 }
    const { text, transcript } = await runAnalysis({
      supabase: ctx.supabase,
      chatId: ctx.chatId,
      images: ctx.imgs,
    });
    return res.json({ text, transcript });
  } catch (err) {
    console.error('[agent] analyze:', err?.message);
    return res.status(502).json({ error: messaggioErrore(err) });
  }
});

// Streaming (M5): risposta a flusso NDJSON. Ogni riga è un evento JSON:
//   { type:'delta', text }      — pezzo di prosa (marcatore/scheda già nascosti dall'orchestrator)
//   { type:'done', transcript } — fine risposta, scheda JSON (o null)
//   { type:'error', error }     — errore in-band (gli header 200 sono già partiti: niente status)
// L'auth avviene PRIMA di iniziare lo stream (così un errore d'auth resta un vero status HTTP).
agentRouter.post('/analyze/stream', async (req, res) => {
  const ctx = await authorizeAnalyze(req, res);
  if (!ctx) return;

  res.status(200);
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no'); // no buffering dietro proxy (nginx)

  const write = (obj) => res.write(`${JSON.stringify(obj)}\n`);
  try {
    for await (const event of runAnalysisStream({
      supabase: ctx.supabase,
      chatId: ctx.chatId,
      images: ctx.imgs,
    })) {
      write(event);
    }
  } catch (err) {
    console.error('[agent] analyze/stream:', err?.message);
    write({ type: 'error', error: messaggioErrore(err) });
  } finally {
    res.end();
  }
});
