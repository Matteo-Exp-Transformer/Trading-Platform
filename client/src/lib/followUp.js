// Limite di approfondimenti (follow-up) per sessione di analisi.
// La PRIMA analisi (il messaggio nato dal form) NON conta: dopo di essa l'utente può fare al
// massimo MAX_FOLLOW_UPS domande di approfondimento, poi la scrittura si blocca.
// Il server resta l'autorità (vedi routes/agent.js): qui gestiamo solo l'esperienza in chat.
export const MAX_FOLLOW_UPS = 5;

// Quanti follow-up ha già usato l'utente in una sessione, dato l'elenco messaggi.
// Follow-up = messaggi dell'utente successivi al primo (la prima analisi è esclusa).
export function followUpsUsed(messages = []) {
  const userMessages = messages.filter((m) => m.role === 'user').length;
  return Math.max(0, userMessages - 1);
}

// True se la sessione ha esaurito i follow-up disponibili → scrittura da bloccare.
export function followUpLimitReached(messages = []) {
  return followUpsUsed(messages) >= MAX_FOLLOW_UPS;
}
