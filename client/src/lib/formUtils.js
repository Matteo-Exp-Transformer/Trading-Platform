export const ASSET_OPTIONS = [
  'Oro XAU/USD',
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'Nasdaq US100',
  'S&P500 US500',
  'DAX DE40',
  'Bitcoin',
  'Ethereum',
  'Azioni USA',
];

export const STILE_OPTIONS = ['Scalping', 'Intraday'];

export const OBIETTIVO_OPTIONS = ['Studiare', 'Analisi completa', 'Lettura operativa'];

function resolveAsset(values) {
  return values.asset === '__altro__'
    ? (values.altroAsset ?? '').trim()
    : values.asset;
}

export function validateForm(values) {
  const errors = {};

  if (!resolveAsset(values)) {
    errors.asset = 'Seleziona o scrivi un asset.';
  }

  if (!values.stileOperativo) {
    errors.stileOperativo = 'Seleziona come operi.';
  }

  if (!values.obiettivo) {
    errors.obiettivo = "Seleziona l'obiettivo.";
  }

  if (values.obiettivo === 'Lettura operativa') {
    if (!values.hasPosizione) {
      errors.hasPosizione = 'Indica se hai una posizione aperta.';
    } else if (values.hasPosizione === 'si') {
      if (!values.tipoPosizione) {
        errors.tipoPosizione = 'Indica Long o Short.';
      }
      if (!(values.prezzoApertura ?? '').trim()) {
        errors.prezzoApertura = 'Inserisci il prezzo di apertura.';
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function buildTitle(values) {
  const idea = (values.idea ?? '').trim();
  if (idea) return idea.slice(0, 60);
  const asset = resolveAsset(values) || 'Asset';
  return `${asset} · ${values.obiettivo}`;
}

// Timeframe derivati dallo stile operativo (fedeli al kit / CHAT_ANALISI_CONTEXT §4).
const TF_BY_STILE = {
  Scalping: { contesto: '1H', decisionale: '5m' },
  Intraday: { contesto: '4H', decisionale: '15m' },
};

export function timeframesFor(stile) {
  return TF_BY_STILE[stile] ?? { contesto: null, decisionale: null };
}

// Slot screenshot FISSI ed etichettati per timeframe (FU-012 / CHAT_ANALISI_CONTEXT §4).
// Derivano da stile × obiettivo. Sempre top-down (contesto → decisionale). Il decisionale
// (5m/15m) è SEMPRE obbligatorio (regola ferma del kit); il contesto è obbligatorio per
// "Studiare"/"Analisi completa" e opzionale in "Lettura operativa"; GoldenTrend è un extra
// opzionale solo in "Analisi completa". Torna [] finché non è scelto lo stile operativo.
export function screenshotSlots(stile, obiettivo) {
  const tf = timeframesFor(stile);
  if (!tf.decisionale) return [];

  const operativa = obiettivo === 'Lettura operativa';
  const slots = [
    {
      key: 'contesto',
      tf: tf.contesto,
      label: `Contesto ${tf.contesto}`,
      // obbligatorio solo quando l'obiettivo è scelto e non è la lettura operativa
      required: Boolean(obiettivo) && !operativa,
    },
    {
      key: 'decisionale',
      tf: tf.decisionale,
      label: operativa ? `Decisionale ${tf.decisionale} (attuale)` : `Decisionale ${tf.decisionale}`,
      required: true,
    },
  ];

  if (obiettivo === 'Analisi completa') {
    slots.push({ key: 'goldentrend', tf: 'GoldenTrend', label: 'GoldenTrend (opz.)', required: false });
  }

  return slots;
}

// Contesto strutturato salvato su chats.form_context (jsonb). Resta valido per tutta la chat.
export function buildFormContext(values) {
  const ctx = {
    asset: resolveAsset(values) || null,
    stile: values.stileOperativo || null,
    obiettivo: values.obiettivo || null,
    timeframe: timeframesFor(values.stileOperativo),
    idea: (values.idea ?? '').trim() || null,
    posizione: null,
  };

  if (values.hasPosizione === 'si') {
    ctx.posizione = {
      tipo: values.tipoPosizione || null,
      prezzoApertura: (values.prezzoApertura ?? '').trim() || null,
      sl: (values.sl ?? '').trim() || null,
      tp: (values.tp ?? '').trim() || null,
    };
  }

  return ctx;
}

// `attachedLabels` (opz.): etichette degli screenshot allegati, NELLO STESSO ORDINE delle
// immagini inviate al modello. Le mette nel riepilogo così l'agente sa quale grafico è quale
// timeframe (es. "Screenshot allegati: Contesto 4H, Decisionale 15m") — vision più affidabile.
export function buildSummary(values, attachedLabels = []) {
  const asset = resolveAsset(values) || 'Asset';
  const parts = [
    `Asset: ${asset}`,
    `Come operi: ${values.stileOperativo}`,
    `Obiettivo: ${values.obiettivo}`,
  ];

  if (values.hasPosizione === 'si') {
    let pos = `Posizione: ${values.tipoPosizione} @ ${values.prezzoApertura}`;
    if ((values.sl ?? '').trim()) pos += `, SL ${values.sl.trim()}`;
    if ((values.tp ?? '').trim()) pos += `, TP ${values.tp.trim()}`;
    parts.push(pos);
  }

  const idea = (values.idea ?? '').trim();
  if (idea) parts.push(`Idea: ${idea}`);

  if (Array.isArray(attachedLabels) && attachedLabels.length > 0) {
    parts.push(`Screenshot allegati: ${attachedLabels.join(', ')}`);
  }

  return parts.join(' · ');
}

// Estrae { mimeType, data } (base64 senza prefisso) da un data URL prodotto da
// FileReader.readAsDataURL. Le immagini viaggiano inline verso Gemini (M3, niente Storage).
export function dataUrlToImagePart(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}
