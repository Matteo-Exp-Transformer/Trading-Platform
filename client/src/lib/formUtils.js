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

export function buildSummary(values) {
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

  return parts.join(' · ');
}
