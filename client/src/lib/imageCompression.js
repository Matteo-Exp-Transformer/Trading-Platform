// Compressione immagini lato client (FU-012): ridimensiona e ricomprime gli screenshot
// prima di inviarli alla route/Gemini, così il payload resta leggero (limite route 25mb).
// Priorità alla LEGGIBILITÀ del grafico (prezzi/livelli/RSI): lato lungo generoso + qualità
// alta. Se il canvas non è disponibile (ambiente di test) o qualcosa fallisce, si ripiega
// sull'immagine ORIGINALE: mai bloccare l'utente per una compressione.

const DEFAULT_MAX_DIM = 1600; // lato lungo massimo in px
const DEFAULT_QUALITY = 0.85; // qualità WEBP/JPEG
const OUTPUT_MIME = 'image/webp';

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Lettura file non riuscita.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Immagine non valida.'));
    img.src = dataUrl;
  });
}

// Vero solo se il canvas 2D è realmente utilizzabile (nei test jsdom non lo è).
function canvasSupported() {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    if (!c || typeof c.getContext !== 'function' || typeof c.toDataURL !== 'function') return false;
    return Boolean(c.getContext('2d'));
  } catch {
    return false;
  }
}

// Ritorna un data URL (eventualmente compresso). Non lancia mai: in caso di problema
// restituisce l'originale.
export async function compressImageToDataUrl(file, {
  maxDim = DEFAULT_MAX_DIM,
  quality = DEFAULT_QUALITY,
  outputMime = OUTPUT_MIME,
} = {}) {
  const original = await readAsDataUrl(file);
  if (!canvasSupported()) return original;
  try {
    const img = await loadImage(original);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return original;

    const scale = Math.min(1, maxDim / Math.max(w, h));
    const targetW = Math.max(1, Math.round(w * scale));
    const targetH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const out = canvas.toDataURL(outputMime, quality);
    // Se il mime richiesto non è supportato, toDataURL ripiega su PNG (spesso più grande):
    // tieni il risultato solo se è davvero più leggero dell'originale.
    if (typeof out === 'string' && out.startsWith('data:image') && out.length < original.length) {
      return out;
    }
    return original;
  } catch {
    return original;
  }
}
