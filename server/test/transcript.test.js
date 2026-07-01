import { describe, it, expect } from 'vitest';
import {
  TRANSCRIPT_MARKER,
  buildImageCheckInstruction,
  buildTranscriptInstruction,
  splitTranscript,
  createProseStreamer,
} from '../src/agent/transcript.js';

const SCHEDA = '{"asset":"XAU/USD","timeframe":{"Contesto 4H":"rialzista"},"livelli":["2350","2360"],"struttura":"HH/HL","indicatori":"RSI 58","bias":"long","posizione":null,"avvisi":null}';

describe('buildImageCheckInstruction', () => {
  it('chiede di segnalare gli screenshot non validi e avvisare di analisi incompleta', () => {
    const t = buildImageCheckInstruction();
    expect(t.toLowerCase()).toContain('segnala');
    expect(t.toLowerCase()).toContain('incompleta');
    // Deve comunque procedere con ciò che è leggibile (non blocca).
    expect(t.toLowerCase()).toContain('procedi');
  });
});

describe('buildTranscriptInstruction', () => {
  it('cita il marcatore e i campi della scheda (incluso avvisi)', () => {
    const t = buildTranscriptInstruction();
    expect(t).toContain(TRANSCRIPT_MARKER);
    expect(t).toContain('asset');
    expect(t).toContain('bias');
    expect(t).toContain('avvisi');
  });
});

describe('splitTranscript', () => {
  it('separa prosa e scheda JSON', () => {
    const raw = `Analisi in prosa qui.\n\n${TRANSCRIPT_MARKER}\n${SCHEDA}`;
    const { prose, transcript } = splitTranscript(raw);
    expect(prose).toBe('Analisi in prosa qui.');
    expect(transcript).toMatchObject({ asset: 'XAU/USD', bias: 'long', posizione: null });
  });

  it('tollera code fences ```json attorno alla scheda', () => {
    const raw = `Prosa.\n${TRANSCRIPT_MARKER}\n\`\`\`json\n${SCHEDA}\n\`\`\``;
    const { prose, transcript } = splitTranscript(raw);
    expect(prose).toBe('Prosa.');
    expect(transcript.asset).toBe('XAU/USD');
  });

  it('marcatore assente → tutto prosa, transcript null', () => {
    const { prose, transcript } = splitTranscript('Solo analisi, nessuna scheda.');
    expect(prose).toBe('Solo analisi, nessuna scheda.');
    expect(transcript).toBeNull();
  });

  it('JSON rotto dopo il marcatore → prosa tenuta, transcript null (mai crash)', () => {
    const raw = `Prosa buona.\n${TRANSCRIPT_MARKER}\n{ questo non è json valido`;
    const { prose, transcript } = splitTranscript(raw);
    expect(prose).toBe('Prosa buona.');
    expect(transcript).toBeNull();
  });

  it('input non stringa → prosa vuota, transcript null', () => {
    expect(splitTranscript(null)).toEqual({ prose: '', transcript: null });
    expect(splitTranscript(undefined)).toEqual({ prose: '', transcript: null });
  });

  it('estrae solo il primo oggetto JSON bilanciato, ignora testo dopo', () => {
    const raw = `P.\n${TRANSCRIPT_MARKER}\n${SCHEDA}\nGrazie!`;
    const { transcript } = splitTranscript(raw);
    expect(transcript.asset).toBe('XAU/USD');
  });
});

describe('createProseStreamer', () => {
  // Alimenta lo streamer coi delta e concatena l'output mostrato + il residuo finale.
  function streamAll(deltas) {
    const s = createProseStreamer();
    let shown = '';
    for (const d of deltas) shown += s.push(d);
    const { remaining, transcript } = s.finish();
    return { shown: shown + remaining, transcript };
  }

  it('mostra tutta la prosa e nasconde marcatore+scheda (delta multipli)', () => {
    const { shown, transcript } = streamAll([
      'Analisi ',
      'in prosa.',
      `\n${TRANSCRIPT_MARKER}\n`,
      SCHEDA,
    ]);
    expect(shown).toBe('Analisi in prosa.\n');
    expect(shown).not.toContain('SCHEDA_JSON');
    expect(shown).not.toContain('XAU/USD');
    expect(transcript).toMatchObject({ asset: 'XAU/USD', bias: 'long' });
  });

  it('non mostra mai un marcatore spezzato tra due delta', () => {
    // Il marcatore arriva a pezzi: "===SCHE" poi "DA_JSON===".
    const s = createProseStreamer();
    let shown = '';
    shown += s.push('Prosa.');
    shown += s.push('\n===SCHE');
    shown += s.push(`DA_JSON===\n${SCHEDA}`);
    const { remaining } = s.finish();
    shown += remaining;
    expect(shown).toBe('Prosa.\n');
    expect(shown).not.toContain('===SCHE');
  });

  it('senza marcatore mostra tutta la prosa, transcript null', () => {
    const { shown, transcript } = streamAll(['Solo ', 'prosa ', 'senza scheda.']);
    expect(shown).toBe('Solo prosa senza scheda.');
    expect(transcript).toBeNull();
  });

  it('invariante: la prosa mostrata è tutto ciò che precede il marcatore', () => {
    const raw = `Prima riga.\nSeconda riga.\n${TRANSCRIPT_MARKER}\n${SCHEDA}`;
    // Delta a caratteri singoli: caso peggiore per il buffering.
    const { shown } = streamAll([...raw]);
    expect(shown).toBe('Prima riga.\nSeconda riga.\n');
  });
});
