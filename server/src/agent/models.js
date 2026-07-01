// models.js — lista curata dei modelli AI assegnabili per-account (M6) + risoluzione sicura.
// Il modello per-utente si innesta nella catena passando `model` giù (route → orchestrator →
// providerClient). Qui NON c'è I/O: logica pura, testabile. La lista vive in UN solo posto:
// aggiungere un modello = una riga qui (nessuna migrazione — `ai_model` è senza CHECK di proposito).
//
// LOCK catena agente: questo modulo NON tocca il kit né il payload; decide solo QUALE endpoint.
// RULE fallback mai-crash: un valore fuori lista (o null) → undefined, così providerClient cade
// sul default .env (AI_MODEL) e l'analisi non fallisce mai per un valore errato nel DB.

export const CURATED_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash'];

// Ritorna il modello SOLO se appartiene alla lista curata; altrimenti undefined (→ default .env).
export function resolveUserModel(raw) {
  if (typeof raw !== 'string') return undefined;
  const model = raw.trim();
  return CURATED_MODELS.includes(model) ? model : undefined;
}
