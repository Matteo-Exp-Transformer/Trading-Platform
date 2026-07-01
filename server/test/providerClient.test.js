import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  toGeminiContents,
  buildGeminiPayload,
  parseCompletionResponse,
  requestCompletion,
  parseSseTextChunks,
  streamGeminiText,
} from '../src/agent/providerClient.js';

// Costruisce un finto response.body.getReader() che emette le stringhe passate come chunk UTF-8.
function fakeStreamResponse(chunks, { ok = true, status = 200 } = {}) {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    ok,
    status,
    text: async () => 'err',
    body: {
      getReader: () => ({
        read: async () =>
          i < chunks.length
            ? { value: encoder.encode(chunks[i++]), done: false }
            : { value: undefined, done: true },
        releaseLock: () => {},
      }),
    },
  };
}

function sse(obj) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}
function chunk(text) {
  return { candidates: [{ content: { parts: [{ text }] } }] };
}

describe('toGeminiContents', () => {
  it('mappa un turno utente in role user con part testo', () => {
    expect(toGeminiContents([{ role: 'user', content: 'ciao' }])).toEqual([
      { role: 'user', parts: [{ text: 'ciao' }] },
    ]);
  });

  it('mappa assistant -> model', () => {
    const out = toGeminiContents([{ role: 'assistant', content: 'ok' }]);
    expect(out[0].role).toBe('model');
  });

  it('aggiunge le immagini come inline_data (multimodale)', () => {
    const out = toGeminiContents([
      { role: 'user', content: 'guarda', images: [{ mimeType: 'image/png', data: 'AAA' }] },
    ]);
    expect(out[0].parts).toEqual([
      { text: 'guarda' },
      { inline_data: { mime_type: 'image/png', data: 'AAA' } },
    ]);
  });

  it('garantisce almeno una part anche con content vuoto e nessuna immagine', () => {
    const out = toGeminiContents([{ role: 'user', content: '' }]);
    expect(out[0].parts).toEqual([{ text: '' }]);
  });
});

describe('buildGeminiPayload', () => {
  it('mette il system come systemInstruction (blocco fisso in testa)', () => {
    const p = buildGeminiPayload({ system: 'KIT', messages: [{ role: 'user', content: 'x' }] });
    expect(p.systemInstruction).toEqual({ parts: [{ text: 'KIT' }] });
    expect(p.contents).toHaveLength(1);
    expect(p.generationConfig).toHaveProperty('temperature');
  });

  it('omette systemInstruction se system è vuoto', () => {
    const p = buildGeminiPayload({ system: '', messages: [] });
    expect(p.systemInstruction).toBeUndefined();
  });

  it('mette un tetto al thinking (lascia spazio alla prosa)', () => {
    const p = buildGeminiPayload({ system: 'KIT', messages: [], thinkingBudget: 4096 });
    expect(p.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 4096 });
    expect(p.generationConfig.maxOutputTokens).toBeGreaterThan(4096);
  });

  it('omette thinkingConfig se thinkingBudget è null', () => {
    const p = buildGeminiPayload({ system: 'KIT', messages: [], thinkingBudget: null });
    expect(p.generationConfig.thinkingConfig).toBeUndefined();
  });
});

describe('parseCompletionResponse', () => {
  it('estrae e concatena il testo dalle parts', () => {
    const data = { candidates: [{ content: { parts: [{ text: 'ciao' }, { text: ' mondo' }] } }] };
    expect(parseCompletionResponse(data)).toBe('ciao mondo');
  });

  it('null se non c’è testo', () => {
    expect(parseCompletionResponse({ candidates: [{ content: { parts: [] } }] })).toBeNull();
  });

  it('null se data è nullo', () => {
    expect(parseCompletionResponse(null)).toBeNull();
  });
});

describe('requestCompletion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lancia se il provider non è supportato', async () => {
    await expect(
      requestCompletion({ system: 's', messages: [], provider: 'openrouter' }),
    ).rejects.toThrow(/non supportato/);
  });

  it('lancia un messaggio chiaro se manca la chiave', async () => {
    const saved = process.env.GOOGLE_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    try {
      await expect(
        requestCompletion({ system: 's', messages: [], provider: 'google' }),
      ).rejects.toThrow(/GOOGLE_API_KEY/);
    } finally {
      if (saved !== undefined) process.env.GOOGLE_API_KEY = saved;
    }
  });

  it('happy path: chiama fetch e restituisce il json', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';
    const json = { candidates: [{ content: { parts: [{ text: 'ok' }] } }] };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => json,
    });
    const out = await requestCompletion({
      system: 'KIT',
      messages: [{ role: 'user', content: 'x' }],
      provider: 'google',
      model: 'gemini-2.5-pro',
    });
    expect(out).toEqual(json);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('gemini-2.5-pro:generateContent');
    expect(opts.headers['x-goog-api-key']).toBe('test-key');
  });

  it('senza modello configurato usa Gemini 2.5 Flash come fallback interno', async () => {
    const savedModel = process.env.AI_MODEL;
    process.env.GOOGLE_API_KEY = 'test-key';
    delete process.env.AI_MODEL;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [] }),
    });
    try {
      await requestCompletion({ system: 'KIT', messages: [], provider: 'google' });
      expect(fetchMock.mock.calls[0][0]).toContain('gemini-2.5-flash:generateContent');
    } finally {
      if (savedModel === undefined) delete process.env.AI_MODEL;
      else process.env.AI_MODEL = savedModel;
    }
  });

  it('lancia con lo status se la risposta non è ok', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'rate limit',
    });
    await expect(
      requestCompletion({ system: 's', messages: [], provider: 'google' }),
    ).rejects.toThrow(/Gemini 429/);
  });
});

describe('parseSseTextChunks', () => {
  it('estrae i testi dai data-line completi e tiene la coda incompleta', () => {
    const buf = `${sse(chunk('ciao'))}data: ${JSON.stringify(chunk('mondo'))}`; // seconda linea senza \n
    const { texts, rest } = parseSseTextChunks(buf);
    expect(texts).toEqual(['ciao']);
    expect(rest).toContain('mondo'); // resta in coda finché non arriva il newline
  });

  it('ignora righe non-data e [DONE], non trimma gli spazi del delta', () => {
    const buf = `: keep-alive\n${sse(chunk(' in '))}data: [DONE]\n`;
    const { texts } = parseSseTextChunks(buf);
    expect(texts).toEqual([' in ']); // spazio ai bordi preservato
  });

  it('non lancia su data-line non-JSON', () => {
    const { texts } = parseSseTextChunks('data: {rotto\n');
    expect(texts).toEqual([]);
  });
});

describe('streamGeminiText', () => {
  afterEach(() => vi.restoreAllMocks());

  it('produce i delta di testo nell’ordine di arrivo', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      fakeStreamResponse([sse(chunk('Analisi ')), sse(chunk('in prosa.'))]),
    );
    const out = [];
    for await (const t of streamGeminiText({ system: 'KIT', messages: [], provider: 'google' })) {
      out.push(t);
    }
    expect(out).toEqual(['Analisi ', 'in prosa.']);
  });

  it('gestisce un data-line spezzato tra due chunk di rete', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';
    const full = sse(chunk('pezzo unico'));
    const half = Math.floor(full.length / 2);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      fakeStreamResponse([full.slice(0, half), full.slice(half)]),
    );
    const out = [];
    for await (const t of streamGeminiText({ system: 'KIT', messages: [], provider: 'google' })) {
      out.push(t);
    }
    expect(out.join('')).toBe('pezzo unico');
  });

  it('lancia se la risposta non è ok', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(fakeStreamResponse([], { ok: false, status: 503 }));
    const gen = streamGeminiText({ system: 'KIT', messages: [], provider: 'google' });
    await expect(gen.next()).rejects.toThrow(/Gemini 503/);
  });
});
