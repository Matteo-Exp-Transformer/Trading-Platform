// promptBuilder — costruisce una struttura di messaggi NEUTRA (provider-agnostica):
//   { system, messages: [{ role, content, images? }] }
// providerClient la traduce poi nel formato nativo del modello.
//
// LOCK vision: le immagini esistono SOLO nel primo turno (il form) e si agganciano
// all'ultimo turno utente (il messaggio corrente). Nei follow-up `images` è vuoto:
// si rimanda la storia testuale completa (incluse le analisi precedenti dell'AI), mai
// nuove immagini. Mai degradare a text-only quando ci sono i grafici.

export function buildMessages(systemPrompt, history = [], images = []) {
  const messages = history.map((m) => ({ role: m.role, content: m.content ?? '' }));

  if (images.length > 0) {
    let attached = false;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        messages[i] = { ...messages[i], images };
        attached = true;
        break;
      }
    }
    // Storia senza turni utente (caso limite): crea il turno corrente con le immagini.
    if (!attached) messages.push({ role: 'user', content: '', images });
  }

  return { system: systemPrompt, messages };
}
