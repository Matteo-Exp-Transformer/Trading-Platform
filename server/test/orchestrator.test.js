import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockLoad, mockRequest, mockParse } = vi.hoisted(() => ({
  mockLoad: vi.fn(),
  mockRequest: vi.fn(),
  mockParse: vi.fn(),
}));

vi.mock('../src/agent/skillLoader.js', () => ({
  loadSkillPrompt: mockLoad,
}));
vi.mock('../src/agent/providerClient.js', () => ({
  requestCompletion: mockRequest,
  parseCompletionResponse: mockParse,
}));

import { runAnalysis, readHistory } from '../src/agent/orchestrator.js';

// Costruisce un finto client Supabase la cui catena from().select().eq().order() risolve `result`.
function fakeSupabase(result) {
  const order = vi.fn().mockResolvedValue(result);
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { from, _spies: { from, select, eq, order } };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLoad.mockResolvedValue('KIT');
  mockRequest.mockResolvedValue({ raw: true });
  mockParse.mockReturnValue('Analisi in prosa');
});

describe('readHistory', () => {
  it('legge role+content ordinati e restituisce i dati', async () => {
    const supabase = fakeSupabase({ data: [{ role: 'user', content: 'x' }], error: null });
    const out = await readHistory(supabase, 'chat-1');
    expect(supabase._spies.from).toHaveBeenCalledWith('messages');
    expect(supabase._spies.eq).toHaveBeenCalledWith('chat_id', 'chat-1');
    expect(out).toEqual([{ role: 'user', content: 'x' }]);
  });

  it('lancia se Supabase restituisce errore', async () => {
    const supabase = fakeSupabase({ data: null, error: { message: 'boom' } });
    await expect(readHistory(supabase, 'chat-1')).rejects.toThrow(/boom/);
  });
});

describe('runAnalysis', () => {
  it('happy path (follow-up senza immagini): ritorna prosa e transcript null', async () => {
    const supabase = fakeSupabase({ data: [{ role: 'user', content: 'Analizza' }], error: null });
    const out = await runAnalysis({ supabase, chatId: 'chat-1', images: [] });
    expect(out).toEqual({ text: 'Analisi in prosa', transcript: null });
    expect(mockLoad).toHaveBeenCalledOnce();
    // Il system (kit) deve arrivare al provider.
    expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({ system: 'KIT' }));
    // Senza immagini non si chiede la scheda: nessuna istruzione appesa al turno utente.
    const sent = mockRequest.mock.calls[0][0];
    expect(JSON.stringify(sent.messages)).not.toContain('SCHEDA_JSON');
  });

  it('con immagini: appende l’istruzione scheda e separa prosa/transcript (M4)', async () => {
    mockParse.mockReturnValue('Analisi in prosa\n\n===SCHEDA_JSON===\n{"asset":"XAU/USD","bias":"long"}');
    const supabase = fakeSupabase({ data: [{ role: 'user', content: 'Analizza' }], error: null });
    const out = await runAnalysis({
      supabase,
      chatId: 'chat-1',
      images: [{ mimeType: 'image/png', data: 'A' }],
    });
    expect(out.text).toBe('Analisi in prosa');
    expect(out.transcript).toEqual({ asset: 'XAU/USD', bias: 'long' });
    // Le istruzioni (controllo immagini + scheda) sono nel turno utente, non nel system/kit.
    const sent = mockRequest.mock.calls[0][0];
    expect(sent.system).toBe('KIT');
    const messagesStr = JSON.stringify(sent.messages);
    expect(messagesStr).toContain('SCHEDA_JSON');
    expect(messagesStr.toLowerCase()).toContain('segnala'); // direttiva controllo immagini
  });

  it('lancia se non c’è storia da analizzare', async () => {
    const supabase = fakeSupabase({ data: [], error: null });
    await expect(runAnalysis({ supabase, chatId: 'c', images: [] })).rejects.toThrow(/Nessun messaggio/);
  });

  it('lancia se il modello non restituisce testo', async () => {
    mockParse.mockReturnValue(null);
    const supabase = fakeSupabase({ data: [{ role: 'user', content: 'x' }], error: null });
    await expect(runAnalysis({ supabase, chatId: 'c', images: [] })).rejects.toThrow(/risposta valida/);
  });
});
