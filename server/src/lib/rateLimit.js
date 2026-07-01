// rateLimit.js — limitatore di frequenza a finestra scorrevole, in memoria (per processo).
// Argine anti-abuso sulla route di analisi: molte chiamate ravvicinate = costi AI.
// Si somma al tetto follow-up per chat (che resta l'autorità sul totale per conversazione).
// Logica pura e iniettabile (clock nei test): nessun I/O, nessuna dipendenza.

// Oltre questa soglia di chiavi in memoria si esegue una pulizia (sessioni ormai fredde).
const SOGLIA_PULIZIA = 1000;

export function creaLimitatore({ finestraMs = 60_000 } = {}) {
  const registro = new Map(); // chiave (token di sessione) → timestamp delle richieste recenti

  // Elimina le chiavi senza richieste dentro la finestra (tiene la memoria limitata).
  function pulisci(ora) {
    const soglia = ora - finestraMs;
    for (const [chiave, tempi] of registro) {
      if (!tempi.some((t) => t > soglia)) registro.delete(chiave);
    }
  }

  return {
    // Vero se la richiesta è ammessa (e viene registrata); falso se il limite è superato.
    // `max` è letto dal chiamante a ogni richiesta (così resta configurabile e testabile).
    consenti(chiave, max, ora = Date.now()) {
      if (registro.size > SOGLIA_PULIZIA) pulisci(ora);
      const soglia = ora - finestraMs;
      const recenti = (registro.get(chiave) || []).filter((t) => t > soglia);
      if (recenti.length >= max) {
        registro.set(chiave, recenti);
        return false;
      }
      recenti.push(ora);
      registro.set(chiave, recenti);
      return true;
    },
    // Esposto per i test di pulizia memoria.
    dimensione() {
      return registro.size;
    },
  };
}
