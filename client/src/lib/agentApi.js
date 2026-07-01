import { supabase } from './supabaseClient.js';

// Invia un turno di analisi alla route server (il "cervello"): la route legge la storia da
// Supabase, chiama Gemini e restituisce { text, transcript }. `text` è la prosa da mostrare;
// `transcript` è la scheda JSON dell'analisi (M4) da salvare col messaggio assistant (o null).
// La chiave AI vive SOLO lato server: qui passiamo solo l'access token dell'utente (per RLS)
// e gli screenshot del primo turno. Mai un crash a vista: ogni errore diventa un messaggio chiaro.
export async function analyzeChat(chatId, images = []) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error('Sessione scaduta. Esci e rientra per continuare.');
  }

  let response;
  try {
    response = await fetch('/api/agent/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ chatId, images }),
    });
  } catch {
    throw new Error("L'agente non è raggiungibile. Controlla la connessione e riprova.");
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || 'Analisi non riuscita. Riprova.');
  }
  if (!payload?.text) {
    throw new Error('Analisi non riuscita. Riprova.');
  }
  return { text: payload.text, transcript: payload.transcript ?? null };
}

// Versione STREAMING (M5): consuma la route /analyze/stream (NDJSON) e chiama `onDelta(text)` per
// ogni pezzo di prosa man mano che arriva. Ritorna { transcript } a fine risposta. Se lo stream si
// interrompe (rete/errore) LANCIA: il chiamante tiene il parziale già mostrato + avviso, senza salvare.
export async function analyzeChatStream(chatId, images = [], { onDelta } = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error('Sessione scaduta. Esci e rientra per continuare.');
  }

  let response;
  try {
    response = await fetch('/api/agent/analyze/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ chatId, images }),
    });
  } catch {
    throw new Error("L'agente non è raggiungibile. Controlla la connessione e riprova.");
  }

  // Errore PRIMA dello stream (status HTTP): body JSON con messaggio chiaro.
  if (!response.ok || !response.body) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    throw new Error(payload?.error || 'Analisi non riuscita. Riprova.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let transcript = null;
  let done = false;

  // Interpreta una riga NDJSON. Lancia sull'evento d'errore in-band.
  const handleLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let evt;
    try {
      evt = JSON.parse(trimmed);
    } catch {
      return; // riga non-JSON: ignora (robustezza)
    }
    if (evt.type === 'delta') {
      if (evt.text && onDelta) onDelta(evt.text);
    } else if (evt.type === 'done') {
      transcript = evt.transcript ?? null;
      done = true;
    } else if (evt.type === 'error') {
      throw new Error(evt.error || 'Analisi non riuscita. Riprova.');
    }
  };

  for (;;) {
    let chunk;
    try {
      chunk = await reader.read();
    } catch {
      throw new Error('Risposta interrotta. Riprova.');
    }
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    let nl;
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      handleLine(line);
    }
  }
  if (buffer.trim()) handleLine(buffer);

  if (!done) {
    throw new Error('Risposta interrotta. Riprova.');
  }
  return { transcript };
}
