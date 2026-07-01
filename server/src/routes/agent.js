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
import { resolveUserModel } from '../agent/models.js';
import { classificaTesto } from '../agent/topicGuard.js';
import { testoRifiuto } from '../agent/security.js';

export const agentRouter = Router();

const MAX_IMAGES = Number(process.env.MAX_SCREENSHOT_PER_ANALISI) || 3;
// Limite approfondimenti per sessione: la prima analisi non conta, poi max MAX_FOLLOW_UPS
// follow-up testuali. Il client è la prima barriera (blocco scrittura); questa è l'autorità.
const MAX_FOLLOW_UPS = Number(process.env.MAX_FOLLOW_UP_PER_SESSIONE) || 5;

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

  // Limite approfondimenti (solo per i follow-up: il turno con immagini è la prima analisi).
  // Conta i messaggi utente già salvati per questa chat (il follow-up corrente è già stato
  // persistito dal client prima di chiamarci): oltre 1+MAX_FOLLOW_UPS si rifiuta.
  // Fallback mai-crash: se il conteggio fallisce non blocchiamo (il client resta la prima barriera).
  if (imgs.length === 0) {
    const { count, error: countErr } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('chat_id', chatId)
      .eq('role', 'user');
    if (!countErr && (count ?? 0) - 1 > MAX_FOLLOW_UPS) {
      res.status(429).json({
        error: `Hai raggiunto il limite di ${MAX_FOLLOW_UPS} approfondimenti per questa sessione.`,
      });
      return null;
    }
  }

  // Modello AI per-account (M6): letto dalla riga profilo dell'utente (la RLS torna SOLO la sua).
  // resolveUserModel filtra sulla lista curata; fuori lista/null → undefined (default .env).
  // RULE fallback mai-crash: se la lettura del profilo fallisce, si degrada al default, non si blocca.
  let model;
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_model')
      .maybeSingle();
    model = resolveUserModel(profile?.ai_model);
  } catch {
    model = undefined;
  }

  return { supabase, chatId, imgs, model };
}

// Strato 2 (classificatore d'ingresso). Legge l'ULTIMO messaggio utente della chat (via il client
// RLS: solo le proprie chat) e lo classifica. Ritorna { consentito, motivo }:
//  - consentito=true  → l'analisi procede;
//  - consentito=false → la route consegna il testo di rifiuto sul canale normale (non un errore).
// Fail-open mai-crash: se la lettura del messaggio fallisce, non si blocca (consentito).
// Si applica al TESTO (prima analisi = riepilogo del form, e follow-up), non agli screenshot.
async function guardIngresso(supabase, chatId) {
  let ultimoTesto = '';
  try {
    const { data } = await supabase
      .from('messages')
      .select('content')
      .eq('chat_id', chatId)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    ultimoTesto = data?.content || '';
  } catch {
    return { consentito: true, motivo: 'ok' };
  }
  return classificaTesto(ultimoTesto);
}

agentRouter.post('/analyze', async (req, res) => {
  try {
    const ctx = await authorizeAnalyze(req, res);
    if (!ctx) return;

    // Ordine: auth → limite FU (429, in authorizeAnalyze) → classificatore → analisi.
    // Rifiuto consegnato sul canale normale della risposta (il client lo salva come msg agente).
    const guard = await guardIngresso(ctx.supabase, ctx.chatId);
    if (!guard.consentito) {
      return res.json({ text: testoRifiuto(guard.motivo), transcript: null });
    }

    // { text: prosa mostrata all'utente, transcript: scheda JSON dell'analisi (o null) — M4 }
    const { text, transcript } = await runAnalysis({
      supabase: ctx.supabase,
      chatId: ctx.chatId,
      images: ctx.imgs,
      model: ctx.model,
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
    // Ordine: auth → limite FU (429) → classificatore → analisi. Rifiuto sul canale normale:
    // un delta col testo + done con transcript null (il client lo salva come msg agente).
    const guard = await guardIngresso(ctx.supabase, ctx.chatId);
    if (!guard.consentito) {
      write({ type: 'delta', text: testoRifiuto(guard.motivo) });
      write({ type: 'done', transcript: null });
      return; // il finally chiude lo stream (res.end)
    }

    for await (const event of runAnalysisStream({
      supabase: ctx.supabase,
      chatId: ctx.chatId,
      images: ctx.imgs,
      model: ctx.model,
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
