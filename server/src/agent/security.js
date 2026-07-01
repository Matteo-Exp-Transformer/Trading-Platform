// security.js — costanti condivise della blindatura dell'agente (Strati 2 e 4).
// Testi di rifiuto ESATTI (fonte di verità: SICUREZZA_CONTEXT §4-bis) e stringa-sentinella (canary).
// Tenuti in UN solo posto così route, topicGuard e canary restano allineati.
//
// LOCK: nessun segreto qui; la sentinella è un marcatore anti-leak, non una chiave.

// Rifiuto FUORI-TEMA (gentile, col "tu", riporta al trading).
export const RIFIUTO_FUORI_TEMA =
  'Mi occupo solo di analisi dei mercati e trading, quindi su questo non posso aiutarti. Se vuoi, torniamo al grafico o alla tua strategia.';

// Rifiuto ESTRAZIONE del sistema (non conferma né nega dettagli).
export const RIFIUTO_ESTRAZIONE =
  'Non condivido come sono costruito o come funziona il sistema dietro di me. Torniamo pure all\'analisi.';

// Sentinella (canary): identica a quella nel kit (kit/10_SICUREZZA_GUARDRAIL.md). Se compare in
// output, è un leak certo del system prompt → si sopprime la risposta e si rifiuta per estrazione.
export const CANARY = 'FTS-CANARY-7Q2X-NON-DIVULGARE';

// Sceglie il testo di rifiuto dal motivo restituito dal classificatore.
export function testoRifiuto(motivo) {
  return motivo === 'estrazione' ? RIFIUTO_ESTRAZIONE : RIFIUTO_FUORI_TEMA;
}
