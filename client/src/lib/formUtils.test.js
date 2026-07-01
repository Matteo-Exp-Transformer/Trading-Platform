import { describe, it, expect } from 'vitest';
import {
  validateForm,
  buildTitle,
  buildSummary,
  buildFormContext,
  timeframesFor,
  screenshotSlots,
  dataUrlToImagePart,
} from './formUtils.js';

const BASE = {
  asset: 'Oro XAU/USD',
  altroAsset: '',
  stileOperativo: 'Intraday',
  obiettivo: 'Studiare',
  hasPosizione: '',
  tipoPosizione: '',
  prezzoApertura: '',
  sl: '',
  tp: '',
  idea: '',
};

describe('validateForm', () => {
  it('valido con campi base corretti', () => {
    expect(validateForm(BASE).valid).toBe(true);
  });

  it('errore se asset mancante', () => {
    const { valid, errors } = validateForm({ ...BASE, asset: '' });
    expect(valid).toBe(false);
    expect(errors.asset).toBeDefined();
  });

  it('errore se stileOperativo mancante', () => {
    const { valid, errors } = validateForm({ ...BASE, stileOperativo: '' });
    expect(valid).toBe(false);
    expect(errors.stileOperativo).toBeDefined();
  });

  it('errore se obiettivo mancante', () => {
    const { valid, errors } = validateForm({ ...BASE, obiettivo: '' });
    expect(valid).toBe(false);
    expect(errors.obiettivo).toBeDefined();
  });

  it('posizione obbligatoria per Lettura operativa', () => {
    const { valid, errors } = validateForm({
      ...BASE,
      obiettivo: 'Lettura operativa',
      hasPosizione: '',
    });
    expect(valid).toBe(false);
    expect(errors.hasPosizione).toBeDefined();
  });

  it('posizione = si richiede tipoPosizione e prezzoApertura', () => {
    const { valid, errors } = validateForm({
      ...BASE,
      obiettivo: 'Lettura operativa',
      hasPosizione: 'si',
      tipoPosizione: '',
      prezzoApertura: '',
    });
    expect(valid).toBe(false);
    expect(errors.tipoPosizione).toBeDefined();
    expect(errors.prezzoApertura).toBeDefined();
  });

  it('valido: Lettura operativa con posizione compilata', () => {
    expect(
      validateForm({
        ...BASE,
        obiettivo: 'Lettura operativa',
        hasPosizione: 'si',
        tipoPosizione: 'Short',
        prezzoApertura: '2350',
      }).valid,
    ).toBe(true);
  });

  it('valido: Lettura operativa con hasPosizione = no', () => {
    expect(
      validateForm({
        ...BASE,
        obiettivo: 'Lettura operativa',
        hasPosizione: 'no',
      }).valid,
    ).toBe(true);
  });

  it('__altro__ senza altroAsset → errore', () => {
    const { valid, errors } = validateForm({ ...BASE, asset: '__altro__', altroAsset: '' });
    expect(valid).toBe(false);
    expect(errors.asset).toBeDefined();
  });

  it('__altro__ con altroAsset compilato → valido', () => {
    expect(validateForm({ ...BASE, asset: '__altro__', altroAsset: 'USOIL' }).valid).toBe(true);
  });
});

describe('buildTitle', () => {
  it('usa idea se compilata', () => {
    expect(buildTitle({ ...BASE, idea: 'RSI diverge' })).toBe('RSI diverge');
  });

  it('tronca idea lunga a 60 caratteri', () => {
    const long = 'A'.repeat(80);
    expect(buildTitle({ ...BASE, idea: long })).toHaveLength(60);
  });

  it('usa "asset · obiettivo" se idea vuota', () => {
    expect(buildTitle(BASE)).toBe('Oro XAU/USD · Studiare');
  });

  it('usa altroAsset per __altro__', () => {
    expect(
      buildTitle({ ...BASE, asset: '__altro__', altroAsset: 'USOIL', idea: '' }),
    ).toBe('USOIL · Studiare');
  });
});

describe('buildSummary', () => {
  it('include asset, stile e obiettivo', () => {
    const s = buildSummary(BASE);
    expect(s).toContain('Asset: Oro XAU/USD');
    expect(s).toContain('Come operi: Intraday');
    expect(s).toContain('Obiettivo: Studiare');
  });

  it('include posizione con SL se presenti', () => {
    const s = buildSummary({
      ...BASE,
      obiettivo: 'Lettura operativa',
      hasPosizione: 'si',
      tipoPosizione: 'Short',
      prezzoApertura: '2350',
      sl: '2360',
      tp: '',
    });
    expect(s).toContain('Posizione: Short @ 2350');
    expect(s).toContain('SL 2360');
    expect(s).not.toContain('TP');
  });

  it('include TP se presente', () => {
    const s = buildSummary({
      ...BASE,
      obiettivo: 'Lettura operativa',
      hasPosizione: 'si',
      tipoPosizione: 'Long',
      prezzoApertura: '2300',
      sl: '',
      tp: '2400',
    });
    expect(s).toContain('TP 2400');
  });

  it('include idea se presente', () => {
    const s = buildSummary({ ...BASE, idea: 'RSI risale' });
    expect(s).toContain('Idea: RSI risale');
  });

  it('omette posizione se hasPosizione non è si', () => {
    const s = buildSummary({ ...BASE, hasPosizione: 'no' });
    expect(s).not.toContain('Posizione');
  });

  it('elenca le etichette degli screenshot allegati quando presenti', () => {
    const s = buildSummary(BASE, ['Contesto 4H', 'Decisionale 15m']);
    expect(s).toContain('Screenshot allegati: Contesto 4H, Decisionale 15m');
  });

  it('omette la riga screenshot se non ci sono etichette', () => {
    expect(buildSummary(BASE)).not.toContain('Screenshot allegati');
    expect(buildSummary(BASE, [])).not.toContain('Screenshot allegati');
  });
});

describe('timeframesFor', () => {
  it('Scalping → 1H / 5m', () => {
    expect(timeframesFor('Scalping')).toEqual({ contesto: '1H', decisionale: '5m' });
  });
  it('Intraday → 4H / 15m', () => {
    expect(timeframesFor('Intraday')).toEqual({ contesto: '4H', decisionale: '15m' });
  });
  it('stile ignoto → null', () => {
    expect(timeframesFor('')).toEqual({ contesto: null, decisionale: null });
  });
});

describe('screenshotSlots', () => {
  it('[] finché lo stile operativo non è scelto', () => {
    expect(screenshotSlots('', 'Studiare')).toEqual([]);
    expect(screenshotSlots(undefined, 'Studiare')).toEqual([]);
  });

  it('Studiare → contesto + decisionale, entrambi obbligatori', () => {
    const slots = screenshotSlots('Intraday', 'Studiare');
    expect(slots).toHaveLength(2);
    expect(slots[0]).toMatchObject({ key: 'contesto', tf: '4H', required: true });
    expect(slots[1]).toMatchObject({ key: 'decisionale', tf: '15m', required: true });
  });

  it('Lettura operativa → contesto opzionale, decisionale obbligatorio ed etichettato "(attuale)"', () => {
    const slots = screenshotSlots('Intraday', 'Lettura operativa');
    expect(slots).toHaveLength(2);
    expect(slots[0]).toMatchObject({ key: 'contesto', required: false });
    expect(slots[1]).toMatchObject({ key: 'decisionale', required: true });
    expect(slots[1].label).toContain('(attuale)');
  });

  it('Analisi completa → aggiunge lo slot GoldenTrend opzionale', () => {
    const slots = screenshotSlots('Intraday', 'Analisi completa');
    expect(slots).toHaveLength(3);
    expect(slots[2]).toMatchObject({ key: 'goldentrend', required: false });
    expect(slots[0].required).toBe(true);
  });

  it('obiettivo non ancora scelto → decisionale resta obbligatorio, contesto no', () => {
    const slots = screenshotSlots('Intraday', '');
    expect(slots).toHaveLength(2);
    expect(slots[0].required).toBe(false);
    expect(slots[1].required).toBe(true);
  });
});

describe('buildFormContext', () => {
  it('struttura base con timeframe derivati e posizione null', () => {
    const ctx = buildFormContext(BASE);
    expect(ctx).toMatchObject({
      asset: 'Oro XAU/USD',
      stile: 'Intraday',
      obiettivo: 'Studiare',
      timeframe: { contesto: '4H', decisionale: '15m' },
      posizione: null,
    });
  });

  it('include la posizione quando aperta', () => {
    const ctx = buildFormContext({
      ...BASE,
      obiettivo: 'Lettura operativa',
      hasPosizione: 'si',
      tipoPosizione: 'Short',
      prezzoApertura: '2350',
      sl: '2360',
      tp: '',
    });
    expect(ctx.posizione).toEqual({
      tipo: 'Short',
      prezzoApertura: '2350',
      sl: '2360',
      tp: null,
    });
  });

  it('usa altroAsset per __altro__', () => {
    const ctx = buildFormContext({ ...BASE, asset: '__altro__', altroAsset: 'USOIL' });
    expect(ctx.asset).toBe('USOIL');
  });
});

describe('dataUrlToImagePart', () => {
  it('estrae mimeType e base64 da un data URL', () => {
    expect(dataUrlToImagePart('data:image/png;base64,AAAB')).toEqual({
      mimeType: 'image/png',
      data: 'AAAB',
    });
  });
  it('null se non è un data URL valido', () => {
    expect(dataUrlToImagePart('non-un-data-url')).toBeNull();
    expect(dataUrlToImagePart(null)).toBeNull();
  });
});
