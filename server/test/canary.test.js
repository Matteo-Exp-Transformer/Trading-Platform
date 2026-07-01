import { describe, it, expect } from 'vitest';
import { contieneCanary, creaFiltroCanary } from '../src/agent/canary.js';
import { CANARY } from '../src/agent/security.js';

describe('contieneCanary', () => {
  it('vero se il testo contiene la sentinella', () => {
    expect(contieneCanary(`prima ${CANARY} dopo`)).toBe(true);
  });
  it('falso su testo pulito o non-stringa', () => {
    expect(contieneCanary('analisi normale')).toBe(false);
    expect(contieneCanary(null)).toBe(false);
    expect(contieneCanary(undefined)).toBe(false);
  });
});

describe('creaFiltroCanary (streaming)', () => {
  // Raccoglie l'output sicuro emesso finché non c'è leak. Ritorna { emesso, leak }.
  function esegui(deltas) {
    const f = creaFiltroCanary();
    let emesso = '';
    let leak = false;
    for (const d of deltas) {
      const r = f.push(d);
      if (r.leak) {
        leak = true;
        break;
      }
      emesso += r.safe;
    }
    if (!leak) emesso += f.flush().safe;
    return { emesso, leak };
  }

  it('testo pulito passa integro', () => {
    const { emesso, leak } = esegui(['Ecco ', 'la mia ', 'analisi.']);
    expect(leak).toBe(false);
    expect(emesso).toBe('Ecco la mia analisi.');
  });

  it('sentinella in un solo delta → leak, niente emissione della sentinella', () => {
    const { emesso, leak } = esegui([`testo ${CANARY} fine`]);
    expect(leak).toBe(true);
    expect(emesso).not.toContain(CANARY);
  });

  it('sentinella spezzata fra due delta → comunque rilevata', () => {
    const meta = Math.floor(CANARY.length / 2);
    const a = `inizio ${CANARY.slice(0, meta)}`;
    const b = `${CANARY.slice(meta)} coda`;
    const { emesso, leak } = esegui([a, b]);
    expect(leak).toBe(true);
    expect(emesso).not.toContain(CANARY);
  });

  it('non emette una coda che potrebbe essere inizio di sentinella prima di aver visto abbastanza', () => {
    // La coda trattenuta è lunga (CANARY.length - 1): il testo prima resta comunque emesso a fine stream.
    const { emesso, leak } = esegui(['Analisi lunga senza problemi.']);
    expect(leak).toBe(false);
    expect(emesso).toBe('Analisi lunga senza problemi.');
  });
});
