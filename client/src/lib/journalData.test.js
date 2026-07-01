import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('./supabaseClient.js', () => ({
  supabase: {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  },
}));

import {
  listEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
} from './journalData.js';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
});

describe('listEntries', () => {
  it('legge journal_entries ordinate per traded_at poi created_at desc', async () => {
    const secondOrder = vi.fn().mockResolvedValue({
      data: [{ id: 'e1' }, { id: 'e2' }],
      error: null,
    });
    const firstOrder = vi.fn().mockReturnValue({ order: secondOrder });
    const select = vi.fn().mockReturnValue({ order: firstOrder });
    mockFrom.mockReturnValue({ select });

    const entries = await listEntries();
    expect(mockFrom).toHaveBeenCalledWith('journal_entries');
    expect(firstOrder).toHaveBeenCalledWith('traded_at', { ascending: false });
    expect(secondOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(entries).toHaveLength(2);
  });

  it('rilancia se Supabase restituisce errore', async () => {
    const secondOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('list fail') });
    const firstOrder = vi.fn().mockReturnValue({ order: secondOrder });
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ order: firstOrder }) });
    await expect(listEntries()).rejects.toThrow('list fail');
  });
});

describe('getEntry', () => {
  it('legge una voce per id', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 'e1', asset: 'EURUSD' }, error: null });
    const eq = vi.fn().mockReturnValue({ single });
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    const entry = await getEntry('e1');
    expect(mockFrom).toHaveBeenCalledWith('journal_entries');
    expect(eq).toHaveBeenCalledWith('id', 'e1');
    expect(entry.asset).toBe('EURUSD');
  });

  it('rilancia se Supabase restituisce errore', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: new Error('get fail') });
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single }) }) });
    await expect(getEntry('e1')).rejects.toThrow('get fail');
  });
});

describe('createEntry', () => {
  function setupInsert(captured) {
    const single = vi.fn().mockResolvedValue({ data: { id: 'e-new' }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn((row) => {
      captured.row = row;
      return { select };
    });
    mockFrom.mockReturnValue({ insert });
    return { single };
  }

  it('inserisce con user_id dell\'utente autenticato', async () => {
    const captured = {};
    setupInsert(captured);
    await createEntry({ asset: 'EURUSD', timeframe: '5m' });
    expect(mockFrom).toHaveBeenCalledWith('journal_entries');
    expect(captured.row).toMatchObject({ asset: 'EURUSD', timeframe: '5m', user_id: 'user-1' });
  });

  it('scarta campi non nella whitelist (no id/created_at arbitrari)', async () => {
    const captured = {};
    setupInsert(captured);
    await createEntry({ asset: 'BTC', id: 'hack', created_at: '1999-01-01', foo: 'bar' });
    expect(captured.row).not.toHaveProperty('id');
    expect(captured.row).not.toHaveProperty('created_at');
    expect(captured.row).not.toHaveProperty('foo');
    expect(captured.row.asset).toBe('BTC');
  });

  it('mantiene chat_id quando passato (link all\'analisi)', async () => {
    const captured = {};
    setupInsert(captured);
    await createEntry({ asset: 'BTC', chat_id: 'chat-9' });
    expect(captured.row.chat_id).toBe('chat-9');
  });

  it('rilancia se utente non autenticato', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(createEntry({ asset: 'X' })).rejects.toThrow('Utente non autenticato.');
  });

  it('rilancia se Supabase restituisce errore', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: new Error('insert fail') });
    mockFrom.mockReturnValue({ insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }) });
    await expect(createEntry({ asset: 'X' })).rejects.toThrow('insert fail');
  });
});

describe('updateEntry', () => {
  it('aggiorna solo i campi whitelistati per id', async () => {
    const captured = {};
    const single = vi.fn().mockResolvedValue({ data: { id: 'e1', outcome: 'win' }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn((row) => {
      captured.row = row;
      return { eq };
    });
    mockFrom.mockReturnValue({ update });

    const entry = await updateEntry('e1', { outcome: 'win', id: 'nope' });
    expect(mockFrom).toHaveBeenCalledWith('journal_entries');
    expect(eq).toHaveBeenCalledWith('id', 'e1');
    expect(captured.row).toEqual({ outcome: 'win' });
    expect(entry.outcome).toBe('win');
  });

  it('rilancia se Supabase restituisce errore', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: new Error('update fail') });
    const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    mockFrom.mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) });
    await expect(updateEntry('e1', { outcome: 'win' })).rejects.toThrow('update fail');
  });
});

describe('deleteEntry', () => {
  it('elimina la voce per id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ delete: del });

    await deleteEntry('e1');
    expect(mockFrom).toHaveBeenCalledWith('journal_entries');
    expect(eq).toHaveBeenCalledWith('id', 'e1');
  });

  it('rilancia se Supabase restituisce errore', async () => {
    const eq = vi.fn().mockResolvedValue({ error: new Error('delete fail') });
    mockFrom.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq }) });
    await expect(deleteEntry('e1')).rejects.toThrow('delete fail');
  });
});
