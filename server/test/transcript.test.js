import { describe, it, expect } from 'vitest';
import {
  TRANSCRIPT_MARKER,
  buildImageCheckInstruction,
  buildTranscriptInstruction,
  splitTranscript,
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
