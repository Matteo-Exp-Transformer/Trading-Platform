import { describe, it, expect } from 'vitest';
import { getMarketStatuses } from './useMarketStatus.js';

// Helper: mappa id → aperto per un istante UTC dato.
function statusAt(iso) {
  const byId = {};
  for (const m of getMarketStatuses(new Date(iso))) byId[m.id] = m.open;
  return byId;
}

describe('getMarketStatuses (orari mercati)', () => {
  // Mercoledì 2026-01-14 (inverno: Londra GMT+0, New York EST UTC-5, Tokyo UTC+9).
  it('Tokyo aperta di mattina locale (02:00Z → 11:00 a Tokyo)', () => {
    const s = statusAt('2026-01-14T02:00:00Z');
    expect(s.tokyo).toBe(true);
    expect(s.london).toBe(false);
    expect(s.newyork).toBe(false);
  });

  it('Londra aperta a metà mattina (10:00Z inverno = 10:00 a Londra)', () => {
    const s = statusAt('2026-01-14T10:00:00Z');
    expect(s.london).toBe(true);
    expect(s.tokyo).toBe(false);
    expect(s.newyork).toBe(false);
  });

  it('New York e Londra aperte insieme (15:00Z = NY 10:00, Londra 15:00)', () => {
    const s = statusAt('2026-01-14T15:00:00Z');
    expect(s.newyork).toBe(true);
    expect(s.london).toBe(true);
    expect(s.tokyo).toBe(false);
  });

  it('nel weekend tutti i mercati sono chiusi', () => {
    const s = statusAt('2026-01-17T10:00:00Z'); // sabato
    expect(s.london).toBe(false);
    expect(s.newyork).toBe(false);
    expect(s.tokyo).toBe(false);
  });

  // Verifica che il DST (ora legale) sia gestito: d'estate Londra è UTC+1, quindi alle 07:30Z
  // sono le 08:30 locali → mercato APERTO. Se ignorassimo il fuso risulterebbe chiuso.
  it('gestisce l’ora legale di Londra (07:30Z d’estate = 08:30 locali, aperto)', () => {
    const s = statusAt('2026-07-01T07:30:00Z'); // mercoledì, BST
    expect(s.london).toBe(true);
  });
});
