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
