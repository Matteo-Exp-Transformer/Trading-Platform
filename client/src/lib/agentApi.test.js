import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const { mockGetSession } = vi.hoisted(() => ({ mockGetSession: vi.fn() }));

vi.mock('./supabaseClient.js', () => ({
  supabase: { auth: { getSession: mockGetSession } },
}));

import { analyzeChat, analyzeChatStream } from './agentApi.js';

// Finto response con body.getReader() che emette le stringhe passate come chunk UTF-8.
function fakeStream(chunks, { ok = true } = {}) {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    ok,
    json: async () => ({ error: 'errore server' }),
    body: {
      getReader: () => ({
        read: async () =>
          i < chunks.length
            ? { value: encoder.encode(chunks[i++]), done: false }
            : { value: undefined, done: true },
      }),
    },
  };
}
const ndjson = (obj) => `${JSON.stringify(obj)}\n`;

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('analyzeChat', () => {
  it('lancia se manca il token di sessione', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await expect(analyzeChat('chat-1', [])).rejects.toThrow(/Sessione scaduta/);
  });

  it('happy path: invia token + chatId e restituisce { text, transcript }', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'Analisi', transcript: { asset: 'XAU/USD' } }),
    });
    const out = await analyzeChat('chat-1', [{ mimeType: 'image/png', data: 'A' }]);
    expect(out).toEqual({ text: 'Analisi', transcript: { asset: 'XAU/USD' } });
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/agent/analyze');
    expect(opts.headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(opts.body)).toEqual({
      chatId: 'chat-1',
      images: [{ mimeType: 'image/png', data: 'A' }],
    });
  });

  it('transcript assente nel payload → null (mai undefined)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'Analisi' }),
    });
    const out = await analyzeChat('chat-1', []);
    expect(out).toEqual({ text: 'Analisi', transcript: null });
  });

  it('propaga il messaggio di errore del server su risposta non ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Chiave AI mancante' }),
    });
    await expect(analyzeChat('chat-1', [])).rejects.toThrow(/Chiave AI mancante/);
  });

  it('messaggio di rete chiaro se fetch fallisce', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    await expect(analyzeChat('chat-1', [])).rejects.toThrow(/non è raggiungibile/);
  });

  it('lancia se la risposta è ok ma senza testo', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({}) });
    await expect(analyzeChat('chat-1', [])).rejects.toThrow(/non riuscita/);
  });
});

describe('analyzeChatStream', () => {
  it('chiama onDelta per ogni pezzo e restituisce il transcript a fine', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      fakeStream([
        ndjson({ type: 'delta', text: 'Analisi ' }),
        ndjson({ type: 'delta', text: 'in prosa.' }),
        ndjson({ type: 'done', transcript: { asset: 'XAU/USD' } }),
      ]),
    );
    const deltas = [];
    const out = await analyzeChatStream('chat-1', [], { onDelta: (t) => deltas.push(t) });
    expect(deltas.join('')).toBe('Analisi in prosa.');
    expect(out.transcript).toEqual({ asset: 'XAU/USD' });
  });

  it('gestisce un evento spezzato tra due chunk di rete', async () => {
    const line = ndjson({ type: 'delta', text: 'ciao' });
    const mid = Math.floor(line.length / 2);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      fakeStream([line.slice(0, mid), line.slice(mid), ndjson({ type: 'done', transcript: null })]),
    );
    const deltas = [];
    await analyzeChatStream('chat-1', [], { onDelta: (t) => deltas.push(t) });
    expect(deltas.join('')).toBe('ciao');
  });

  it('lancia sul messaggio dell’evento error in-band', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      fakeStream([
        ndjson({ type: 'delta', text: 'Inizio…' }),
        ndjson({ type: 'error', error: "L'agente non è raggiungibile." }),
      ]),
    );
    await expect(analyzeChatStream('chat-1', [])).rejects.toThrow(/non è raggiungibile/);
  });

  it('lancia "interrotta" se lo stream finisce senza evento done', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      fakeStream([ndjson({ type: 'delta', text: 'a metà' })]),
    );
    await expect(analyzeChatStream('chat-1', [])).rejects.toThrow(/interrotta/i);
  });

  it('propaga l’errore server se lo status non è ok (prima dello stream)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(fakeStream([], { ok: false }));
    await expect(analyzeChatStream('chat-1', [])).rejects.toThrow(/errore server/);
  });

  it('lancia se manca il token', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await expect(analyzeChatStream('chat-1', [])).rejects.toThrow(/Sessione scaduta/);
  });
});
