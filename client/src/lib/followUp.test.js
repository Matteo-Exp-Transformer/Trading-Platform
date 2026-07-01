import { describe, it, expect } from 'vitest';
import { MAX_FOLLOW_UPS, followUpsUsed, followUpLimitReached } from './followUp.js';

// Costruisce una lista messaggi con `n` messaggi utente (e qualche risposta assistant in mezzo,
// che non deve mai contare ai fini del limite).
function withUserMessages(n) {
  const msgs = [];
  for (let i = 0; i < n; i++) {
    msgs.push({ role: 'user', content: `u${i}` });
    msgs.push({ role: 'assistant', content: `a${i}` });
  }
  return msgs;
}

describe('followUpsUsed', () => {
  it('la prima analisi non conta come follow-up', () => {
    expect(followUpsUsed(withUserMessages(1))).toBe(0);
  });

  it('conta solo i messaggi utente successivi al primo', () => {
    expect(followUpsUsed(withUserMessages(4))).toBe(3);
  });

  it('ignora i messaggi assistant', () => {
    const msgs = [
      { role: 'user', content: 'analisi' },
      { role: 'assistant', content: 'r1' },
      { role: 'assistant', content: 'r2' },
      { role: 'user', content: 'fu1' },
    ];
    expect(followUpsUsed(msgs)).toBe(1);
  });

  it('lista vuota → 0 (mai negativo)', () => {
    expect(followUpsUsed([])).toBe(0);
    expect(followUpsUsed()).toBe(0);
  });
});

describe('followUpLimitReached', () => {
  it('sotto il limite → false', () => {
    // 1 analisi + 4 follow-up = 5 messaggi utente → 4 usati, ancora libero.
    expect(followUpLimitReached(withUserMessages(5))).toBe(false);
  });

  it('al limite (5 follow-up usati) → true', () => {
    // 1 analisi + 5 follow-up = 6 messaggi utente → limite raggiunto.
    expect(followUpLimitReached(withUserMessages(1 + MAX_FOLLOW_UPS))).toBe(true);
  });

  it('oltre il limite → true', () => {
    expect(followUpLimitReached(withUserMessages(10))).toBe(true);
  });
});
