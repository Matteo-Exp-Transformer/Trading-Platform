import { describe, it, expect } from 'vitest';
import {
  emptyEntry,
  prefillFromChat,
  toDbFields,
  toFormFields,
  directionLabel,
  outcomeLabel,
} from './journalFields.js';

describe('emptyEntry', () => {
  it('ha i default sensati (direction none, outcome vuoto, data oggi)', () => {
    const e = emptyEntry();
    expect(e.direction).toBe('none');
    expect(e.outcome).toBe('');
    expect(e.tags).toEqual([]);
    expect(e.traded_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('prefillFromChat', () => {
  it('senza chat restituisce una voce vuota', () => {
    expect(prefillFromChat(null).asset).toBe('');
  });

  it('mappa asset, timeframe decisionale e posizione dalla chat', () => {
    const chat = {
      id: 'chat-1',
      form_context: {
        asset: 'EURUSD',
        timeframe: { contesto: '4H', decisionale: '15m' },
        posizione: { tipo: 'Long', prezzoApertura: '1.0850', sl: '1.0820' },
      },
    };
    const pre = prefillFromChat(chat);
    expect(pre.chat_id).toBe('chat-1');
    expect(pre.asset).toBe('EURUSD');
    expect(pre.timeframe).toBe('15m');
    expect(pre.direction).toBe('long');
    expect(pre.entry_price).toBe('1.0850');
    expect(pre.stop_price).toBe('1.0820');
  });

  it('senza posizione lascia direction none', () => {
    const pre = prefillFromChat({ id: 'c', form_context: { asset: 'BTC' } });
    expect(pre.direction).toBe('none');
    expect(pre.entry_price).toBe('');
  });
});

describe('toDbFields', () => {
  it('converte numeri (con virgola) e null dove vuoto', () => {
    const db = toDbFields({ ...emptyEntry(), asset: 'BTC', entry_price: '1,5', pnl: '', rr: '2' });
    expect(db.entry_price).toBe(1.5);
    expect(db.rr).toBe(2);
    expect(db.pnl).toBeNull();
  });

  it('outcome vuoto → null; outcome valorizzato resta', () => {
    expect(toDbFields({ ...emptyEntry(), asset: 'X', outcome: '' }).outcome).toBeNull();
    expect(toDbFields({ ...emptyEntry(), asset: 'X', outcome: 'win' }).outcome).toBe('win');
  });

  it('tags da stringa "a, b" diventano array pulito', () => {
    const db = toDbFields({ ...emptyEntry(), asset: 'X', tags: 'breakout, , contro-trend ' });
    expect(db.tags).toEqual(['breakout', 'contro-trend']);
  });

  it('emotion vuota → null', () => {
    expect(toDbFields({ ...emptyEntry(), asset: 'X', emotion: '  ' }).emotion).toBeNull();
  });
});

describe('toFormFields', () => {
  it('numeri e tag tornano stringhe per gli input controllati', () => {
    const form = toFormFields({
      asset: 'BTC',
      entry_price: 100,
      pnl: null,
      tags: ['a', 'b'],
      outcome: 'loss',
    });
    expect(form.entry_price).toBe('100');
    expect(form.pnl).toBe('');
    expect(form.tags).toBe('a, b');
    expect(form.outcome).toBe('loss');
  });
});

describe('label helpers', () => {
  it('directionLabel e outcomeLabel mappano i valori noti', () => {
    expect(directionLabel('long')).toBe('Long');
    expect(directionLabel('none')).toBe('—');
    expect(outcomeLabel('win')).toBe('Vinto');
    expect(outcomeLabel(null)).toBe('— Da definire');
  });
});
