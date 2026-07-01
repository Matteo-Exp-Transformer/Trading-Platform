import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const { mockGetSession } = vi.hoisted(() => ({ mockGetSession: vi.fn() }));

vi.mock('./supabaseClient.js', () => ({
  supabase: { auth: { getSession: mockGetSession } },
}));

import { analyzeChat } from './agentApi.js';

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

  it('happy path: invia token + chatId e restituisce il testo', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'Analisi' }),
    });
    const out = await analyzeChat('chat-1', [{ mimeType: 'image/png', data: 'A' }]);
    expect(out).toBe('Analisi');
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/agent/analyze');
    expect(opts.headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(opts.body)).toEqual({
      chatId: 'chat-1',
      images: [{ mimeType: 'image/png', data: 'A' }],
    });
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
