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
  it('happy path: kit + storia -> provider -> testo', async () => {
    const supabase = fakeSupabase({ data: [{ role: 'user', content: 'Analizza' }], error: null });
    const text = await runAnalysis({ supabase, chatId: 'chat-1', images: [] });
    expect(text).toBe('Analisi in prosa');
    expect(mockLoad).toHaveBeenCalledOnce();
    // Il system (kit) deve arrivare al provider.
    expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({ system: 'KIT' }));
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
