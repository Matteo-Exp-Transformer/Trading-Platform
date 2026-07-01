// screenshots.js — validazione degli screenshot in ingresso alla route di analisi.
// Il client comprime in webp prima dell'invio, ma il server non si fida del client:
// numero, formato e dimensione vanno riverificati qui (gli screenshot arrivano come
// base64 dentro il JSON della richiesta). Logica pura, testabile senza I/O.

// Formati accettati: quelli che il client può produrre (webp; png/jpeg come ripiego canvas).
export const MIME_AMMESSI = ['image/webp', 'image/png', 'image/jpeg'];

// Tetto per singola immagine, in caratteri base64 (~6 MB reali: il base64 pesa ~4/3).
// Il limite globale del body (25 MB in app.js) resta la barriera complessiva.
export const MAX_BASE64_CHARS = 8 * 1024 * 1024;

// Valida la lista di screenshot. Ritorna null se tutto ok, altrimenti il messaggio
// d'errore (già pronto per l'utente) da restituire con status 400.
export function erroreScreenshot(imgs, maxImmagini) {
  if (imgs.length > maxImmagini) {
    return `Troppi screenshot: massimo ${maxImmagini}.`;
  }
  for (const img of imgs) {
    if (!img || typeof img.data !== 'string' || img.data.length === 0) {
      return 'Uno screenshot non è leggibile. Ricaricalo e riprova.';
    }
    if (!MIME_AMMESSI.includes(img.mimeType)) {
      return 'Formato screenshot non supportato: usa immagini webp, png o jpeg.';
    }
    if (img.data.length > MAX_BASE64_CHARS) {
      return 'Uno screenshot è troppo grande. Riduci la dimensione e riprova.';
    }
  }
  return null;
}
