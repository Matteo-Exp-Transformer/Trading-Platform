import { describe, it, expect } from 'vitest';
import { relativeDayLabel } from './dateFormat.js';

describe('relativeDayLabel', () => {
  const now = new Date('2026-07-01T12:00:00');

  it('mostra "oggi" per una data dello stesso giorno', () => {
    expect(relativeDayLabel(new Date('2026-07-01T08:00:00'), now)).toBe('oggi');
  });

  it('mostra "ieri" per il giorno precedente', () => {
    expect(relativeDayLabel(new Date('2026-06-30T23:00:00'), now)).toBe('ieri');
  });

  it('mostra "N giorni fa" entro la settimana', () => {
    expect(relativeDayLabel(new Date('2026-06-28T10:00:00'), now)).toBe('3 giorni fa');
  });

  it('mostra una data breve oltre la settimana', () => {
    // 15 giorni prima → non più "N giorni fa" ma data breve (gg mese).
    expect(relativeDayLabel(new Date('2026-06-16T10:00:00'), now)).toMatch(/16/);
  });

  it('accetta anche stringhe ISO', () => {
    expect(relativeDayLabel('2026-07-01T09:00:00', now)).toBe('oggi');
  });

  it('torna stringa vuota su input non valido', () => {
    expect(relativeDayLabel('non-una-data', now)).toBe('');
  });
});
