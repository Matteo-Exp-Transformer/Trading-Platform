import { describe, it, expect } from 'vitest';
import { erroreScreenshot, MIME_AMMESSI, MAX_BASE64_CHARS } from '../src/lib/screenshots.js';

const png = (data = 'AAAA') => ({ mimeType: 'image/png', data });

describe('erroreScreenshot', () => {
  it('nessun errore con lista vuota', () => {
    expect(erroreScreenshot([], 3)).toBeNull();
  });

  it('nessun errore con immagini valide entro il limite', () => {
    expect(erroreScreenshot([png(), { mimeType: 'image/webp', data: 'BBBB' }], 3)).toBeNull();
  });

  it('errore se troppe immagini', () => {
    expect(erroreScreenshot([png(), png(), png(), png()], 3)).toMatch(/Troppi screenshot: massimo 3/);
  });

  it('errore se il mime non è tra quelli ammessi', () => {
    expect(erroreScreenshot([{ mimeType: 'application/pdf', data: 'AAAA' }], 3)).toMatch(
      /Formato screenshot non supportato/,
    );
    expect(erroreScreenshot([{ data: 'AAAA' }], 3)).toMatch(/Formato screenshot non supportato/);
  });

  it('errore se data manca o non è una stringa', () => {
    expect(erroreScreenshot([{ mimeType: 'image/png' }], 3)).toMatch(/non è leggibile/);
    expect(erroreScreenshot([{ mimeType: 'image/png', data: 42 }], 3)).toMatch(/non è leggibile/);
    expect(erroreScreenshot([null], 3)).toMatch(/non è leggibile/);
    expect(erroreScreenshot([{ mimeType: 'image/png', data: '' }], 3)).toMatch(/non è leggibile/);
  });

  it('errore se una singola immagine supera il tetto base64', () => {
    const enorme = { mimeType: 'image/png', data: 'A'.repeat(MAX_BASE64_CHARS + 1) };
    expect(erroreScreenshot([enorme], 3)).toMatch(/troppo grande/);
  });

  it('la lista dei mime ammessi copre i formati del client (webp + ripieghi canvas)', () => {
    expect(MIME_AMMESSI).toEqual(['image/webp', 'image/png', 'image/jpeg']);
  });
});
