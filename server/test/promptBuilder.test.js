import { describe, it, expect } from 'vitest';
import { buildMessages } from '../src/agent/promptBuilder.js';

const HISTORY = [
  { role: 'user', content: 'Asset: Oro · Intraday' },
  { role: 'assistant', content: 'Analisi precedente' },
  { role: 'user', content: 'Esco o tengo?' },
];

describe('buildMessages', () => {
  it('passa il system e mappa la storia testuale', () => {
    const { system, messages } = buildMessages('KIT', HISTORY, []);
    expect(system).toBe('KIT');
    expect(messages).toHaveLength(3);
    expect(messages[0]).toEqual({ role: 'user', content: 'Asset: Oro · Intraday' });
    expect(messages.every((m) => !('images' in m))).toBe(true);
  });

  it('aggancia le immagini all’ultimo turno utente', () => {
    const imgs = [{ mimeType: 'image/png', data: 'AAA' }];
    const { messages } = buildMessages('KIT', HISTORY, imgs);
    expect(messages[2].images).toEqual(imgs);
    // I turni precedenti restano text-only.
    expect('images' in messages[0]).toBe(false);
    expect('images' in messages[1]).toBe(false);
  });

  it('senza turni utente crea un turno corrente con le immagini', () => {
    const imgs = [{ mimeType: 'image/png', data: 'AAA' }];
    const { messages } = buildMessages('KIT', [{ role: 'assistant', content: 'x' }], imgs);
    expect(messages).toHaveLength(2);
    expect(messages[1]).toEqual({ role: 'user', content: '', images: imgs });
  });

  it('storia vuota senza immagini → nessun messaggio', () => {
    const { messages } = buildMessages('KIT', [], []);
    expect(messages).toEqual([]);
  });
});
