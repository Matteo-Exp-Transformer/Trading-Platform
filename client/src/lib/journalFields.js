// Opzioni e helper condivisi del Journal (FU-023). Tenuti fuori dai componenti così sono
// testabili in isolamento e riusati da form, card e pagina. Nessun colore/palette qui: solo dati.

export const DIRECTION_OPTIONS = [
  { value: 'none', label: '—' },
  { value: 'long', label: 'Long' },
  { value: 'short', label: 'Short' },
];

export const OUTCOME_OPTIONS = [
  { value: '', label: '— Da definire' },
  { value: 'win', label: 'Vinto' },
  { value: 'loss', label: 'Perso' },
  { value: 'breakeven', label: 'Pari (BE)' },
  { value: 'no_trade', label: 'Non entrato' },
];

// Suggerimenti emozione (campo libero: l'utente può scrivere altro).
export const EMOTION_SUGGESTIONS = ['Calmo', 'Impulsivo', 'Esitante', 'FOMO', 'Fiducioso', 'Frustrato'];

export function directionLabel(value) {
  return DIRECTION_OPTIONS.find((o) => o.value === value)?.label ?? '—';
}

export function outcomeLabel(value) {
  return OUTCOME_OPTIONS.find((o) => o.value === (value ?? ''))?.label ?? '—';
}

// Valori iniziali di una voce nuova (vuota). direction 'none' e outcome '' = "non specificato".
export function emptyEntry() {
  return {
    chat_id: null,
    asset: '',
    timeframe: '',
    traded_at: new Date().toISOString().slice(0, 10), // yyyy-mm-dd (input date)
    direction: 'none',
    outcome: '',
    entry_price: '',
    exit_price: '',
    stop_price: '',
    rr: '',
    pnl: '',
    emotion: '',
    tags: [],
    note: '',
    lesson: '',
  };
}

// Pre-compila una voce dai dati di una chat/analisi (bottone «Salva nel journal» in Chat).
// Mappa il form_context dell'analisi sui campi del journal: asset, timeframe decisionale e, se
// c'era una posizione dichiarata, direzione/entry/stop. Il resto lo completa l'utente.
export function prefillFromChat(chat) {
  const base = emptyEntry();
  if (!chat) return base;
  const fc = chat.form_context ?? {};
  const pos = fc.posizione ?? {};
  const tipo = (pos.tipo ?? '').toLowerCase();
  return {
    ...base,
    chat_id: chat.id ?? null,
    asset: fc.asset ?? '',
    timeframe: fc.timeframe?.decisionale ?? '',
    direction: tipo === 'long' || tipo === 'short' ? tipo : 'none',
    entry_price: pos.prezzoApertura ?? '',
    stop_price: pos.sl ?? '',
  };
}

// Normalizza i campi del form (stringhe dagli input) verso i tipi del DB: numeri o null,
// tag da stringa "a, b" ad array, stringhe vuote → null dove la colonna è nullable.
export function toDbFields(form) {
  const num = (v) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };
  const str = (v) => {
    const s = (v ?? '').trim();
    return s === '' ? null : s;
  };
  const tags = Array.isArray(form.tags)
    ? form.tags
    : String(form.tags ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

  return {
    chat_id: form.chat_id ?? null,
    asset: (form.asset ?? '').trim(),
    timeframe: (form.timeframe ?? '').trim(),
    traded_at: form.traded_at || new Date().toISOString().slice(0, 10),
    direction: form.direction || 'none',
    outcome: form.outcome ? form.outcome : null,
    entry_price: num(form.entry_price),
    exit_price: num(form.exit_price),
    stop_price: num(form.stop_price),
    rr: num(form.rr),
    pnl: num(form.pnl),
    emotion: str(form.emotion),
    tags,
    note: (form.note ?? '').trim(),
    lesson: (form.lesson ?? '').trim(),
  };
}

// Porta una voce dal DB verso i campi del form (numeri/array → stringhe per gli input controllati).
export function toFormFields(entry) {
  const s = (v) => (v === null || v === undefined ? '' : String(v));
  return {
    chat_id: entry.chat_id ?? null,
    asset: entry.asset ?? '',
    timeframe: entry.timeframe ?? '',
    traded_at: entry.traded_at ?? new Date().toISOString().slice(0, 10),
    direction: entry.direction ?? 'none',
    outcome: entry.outcome ?? '',
    entry_price: s(entry.entry_price),
    exit_price: s(entry.exit_price),
    stop_price: s(entry.stop_price),
    rr: s(entry.rr),
    pnl: s(entry.pnl),
    emotion: entry.emotion ?? '',
    tags: Array.isArray(entry.tags) ? entry.tags.join(', ') : '',
    note: entry.note ?? '',
    lesson: entry.lesson ?? '',
  };
}
