// transcript — istruzioni aggiunte al TURNO D'ANALISI (solo quando ci sono immagini) e separazione
// della risposta. Due direttive: (1) controllo degli screenshot — segnala quelli non validi; (2) scheda
// JSON dell'analisi (M4): invece di conservare gli screenshot, salviamo una trascrizione strutturata di
// ciò che i grafici mostravano. Gemini scrive la prosa e in fondo, dopo un marcatore, un blocco JSON:
// qui separiamo le due parti.
//
// LOCK catena/kit: le istruzioni si aggiungono SOLO in coda al turno utente corrente (parte variabile),
// mai nei file kit/ — così il blocco-kit in testa resta identico e il caching Gemini non si rompe.
// RULE mai crash a vista: se la scheda manca o è illeggibile, si tiene la prosa e transcript = null.

export const TRANSCRIPT_MARKER = '===SCHEDA_JSON===';

// Direttiva: se uno screenshot NON è un grafico di trading leggibile, va segnalato all'utente
// (consapevolezza che l'analisi può essere incompleta). Si procede comunque con ciò che è leggibile.
export function buildImageCheckInstruction() {
  return [
    `Prima di analizzare, controlla ogni screenshot. Se uno NON è un grafico di trading leggibile`,
    `(non mostra prezzi/candele/timeframe — es. una foto, uno screenshot generico), SEGNALALO in modo`,
    `esplicito e conciso all'inizio della risposta, indicando quale immagine, e avvisa che l'analisi`,
    `potrebbe essere incompleta. Procedi comunque con l'analisi di ciò che è leggibile.`,
  ].join('\n');
}

// Istruzione scheda JSON, appesa al turno utente con le immagini (solo vera analisi, mai nei follow-up).
export function buildTranscriptInstruction() {
  return [
    `Dopo l'analisi in prosa, aggiungi in fondo — su una riga a parte — esattamente il marcatore`,
    `${TRANSCRIPT_MARKER} seguito da un oggetto JSON valido con questi campi:`,
    `{"asset": string, "timeframe": {"<etichetta grafico>": string}, "livelli": string[],`,
    ` "struttura": string, "indicatori": string, "bias": string, "posizione": string|null,`,
    ` "avvisi": string|null}`,
    `Il campo "avvisi" riporta eventuali problemi sugli screenshot (es. immagine non valida), altrimenti null.`,
    `Non citare né descrivere questa scheda nella prosa: è un promemoria tecnico interno.`,
  ].join('\n');
}

// Estrae il primo oggetto JSON bilanciato da una stringa (tollera testo/fences attorno).
function extractJsonObject(str) {
  const start = str.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < str.length; i++) {
    const ch = str[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return str.slice(start, i + 1);
    }
  }
  return null;
}

// Separa la risposta in { prose, transcript }. Non lancia mai:
// - marcatore assente        -> prose = testo intero, transcript = null
// - JSON dopo marcatore rotto -> prose = testo prima del marcatore, transcript = null
export function splitTranscript(rawText) {
  const text = typeof rawText === 'string' ? rawText : '';
  const idx = text.indexOf(TRANSCRIPT_MARKER);
  if (idx === -1) return { prose: text.trim(), transcript: null };

  const prose = text.slice(0, idx).trim();
  const after = text.slice(idx + TRANSCRIPT_MARKER.length);
  const jsonStr = extractJsonObject(after);
  if (!jsonStr) return { prose, transcript: null };

  try {
    const transcript = JSON.parse(jsonStr);
    return { prose, transcript };
  } catch {
    return { prose, transcript: null };
  }
}
