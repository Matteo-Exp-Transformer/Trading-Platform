import { describe, it, expect } from 'vitest';
import { compressImageToDataUrl } from './imageCompression.js';

// In jsdom il canvas 2D non è utilizzabile: la funzione deve SEMPRE ripiegare
// sull'immagine originale senza lanciare (mai bloccare l'utente per la compressione).

function pngFile(bytes = 'hello-png') {
  return new File([bytes], 'grafico.png', { type: 'image/png' });
}

describe('compressImageToDataUrl', () => {
  it('ritorna un data URL a partire da un File', async () => {
    const out = await compressImageToDataUrl(pngFile());
    expect(typeof out).toBe('string');
    expect(out.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('senza canvas (jsdom) ripiega sull’originale, non compresso', async () => {
    const file = pngFile('contenuto-di-prova');
    const out = await compressImageToDataUrl(file);
    // l'originale letto da FileReader inizia con lo stesso prefisso mime del file
    expect(out).toMatch(/^data:image\/png;base64,/);
  });

  it('accetta opzioni custom senza lanciare', async () => {
    await expect(
      compressImageToDataUrl(pngFile(), { maxDim: 800, quality: 0.6, outputMime: 'image/webp' }),
    ).resolves.toEqual(expect.any(String));
  });
});
