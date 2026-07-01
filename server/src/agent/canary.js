// canary — Strato 4: sentinella anti-leak.
// La stringa CANARY è nel kit con l'istruzione di non emetterla MAI. Se compare nell'output del
// modello è la prova di un leak del system prompt → si sopprime la risposta e si rifiuta (estrazione).
// NB: questo NON è il filtro d'uscita completo (Strato 3, rimandato): rileva solo la sentinella.
import { CANARY } from './security.js';

// Vero se il testo contiene la sentinella (percorso non-streaming: testo intero già disponibile).
export function contieneCanary(text) {
  return typeof text === 'string' && text.includes(CANARY);
}

// Filtro per lo streaming. La sentinella può spezzarsi fra due delta ("...FTS-CAN" | "ARY-7Q2X..."):
// tratteniamo in coda gli ultimi (CANARY.length - 1) caratteri, così una sentinella a cavallo di due
// delta viene comunque ricomposta e rilevata prima di essere emessa al client.
//
// Uso:
//   const f = creaFiltroCanary();
//   for (const delta of stream) {
//     const { safe, leak } = f.push(delta);
//     if (leak) { /* sopprimi tutto, invia il rifiuto estrazione */ break; }
//     if (safe) emetti(safe);
//   }
//   const { safe } = f.flush(); // coda residua a fine stream (nessun leak possibile qui)
export function creaFiltroCanary() {
  const soglia = CANARY.length - 1; // quanto trattenere per coprire una sentinella spezzata
  let coda = ''; // caratteri non ancora emessi (potenziale inizio di sentinella)

  return {
    // Aggiunge un delta. Ritorna { safe, leak }:
    //  - leak: true se la sentinella è comparsa (il chiamante sopprime e rifiuta).
    //  - safe: la porzione di testo sicura da emettere al client (senza la coda trattenuta).
    push(delta) {
      coda += delta || '';
      if (coda.includes(CANARY)) {
        return { safe: '', leak: true };
      }
      // Emetti tutto tranne gli ultimi `soglia` caratteri (possibile inizio di sentinella futura).
      let safe = '';
      if (coda.length > soglia) {
        safe = coda.slice(0, coda.length - soglia);
        coda = coda.slice(coda.length - soglia);
      }
      return { safe, leak: false };
    },
    // Fine stream: emette la coda residua (non può più formare una sentinella nuova).
    flush() {
      const safe = coda;
      coda = '';
      return { safe };
    },
  };
}
