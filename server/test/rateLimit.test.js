import { describe, it, expect } from 'vitest';
import { creaLimitatore } from '../src/lib/rateLimit.js';

// Clock finto: i test controllano il tempo, niente attese reali.
const T0 = 1_000_000;

describe('creaLimitatore', () => {
  it('ammette fino a `max` richieste nella finestra', () => {
    const lim = creaLimitatore({ finestraMs: 60_000 });
    expect(lim.consenti('tok', 3, T0)).toBe(true);
    expect(lim.consenti('tok', 3, T0 + 1)).toBe(true);
    expect(lim.consenti('tok', 3, T0 + 2)).toBe(true);
  });

  it('blocca la richiesta oltre il limite', () => {
    const lim = creaLimitatore({ finestraMs: 60_000 });
    lim.consenti('tok', 2, T0);
    lim.consenti('tok', 2, T0 + 1);
    expect(lim.consenti('tok', 2, T0 + 2)).toBe(false);
  });

  it('la finestra scorre: le richieste vecchie non contano più', () => {
    const lim = creaLimitatore({ finestraMs: 60_000 });
    lim.consenti('tok', 2, T0);
    lim.consenti('tok', 2, T0 + 1);
    // Dopo la finestra le prime due sono scadute: si può di nuovo.
    expect(lim.consenti('tok', 2, T0 + 60_001)).toBe(true);
  });

  it('chiavi diverse hanno contatori indipendenti', () => {
    const lim = creaLimitatore({ finestraMs: 60_000 });
    lim.consenti('tok-a', 1, T0);
    expect(lim.consenti('tok-a', 1, T0 + 1)).toBe(false);
    expect(lim.consenti('tok-b', 1, T0 + 1)).toBe(true);
  });

  it('una richiesta bloccata non consuma il contatore', () => {
    const lim = creaLimitatore({ finestraMs: 60_000 });
    lim.consenti('tok', 1, T0);
    expect(lim.consenti('tok', 1, T0 + 1)).toBe(false);
    // Scaduta la prima, il rifiuto precedente non deve pesare.
    expect(lim.consenti('tok', 1, T0 + 60_001)).toBe(true);
  });

  it('pulisce le chiavi fredde quando il registro cresce (memoria limitata)', () => {
    const lim = creaLimitatore({ finestraMs: 60_000 });
    for (let i = 0; i < 1001; i++) lim.consenti(`tok-${i}`, 5, T0);
    expect(lim.dimensione()).toBe(1001);
    // Alla richiesta successiva, fuori finestra, le chiavi fredde vengono eliminate.
    lim.consenti('nuovo', 5, T0 + 120_000);
    expect(lim.dimensione()).toBe(1);
  });
});
