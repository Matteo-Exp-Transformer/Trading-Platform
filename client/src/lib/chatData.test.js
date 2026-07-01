import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockGetUser, mockFrom, mockSingle, mockSelect, mockInsert, mockUpdate, mockOrder, mockEq } =
  vi.hoisted(() => ({
    mockGetUser: vi.fn(),
    mockFrom: vi.fn(),
    mockSingle: vi.fn(),
    mockSelect: vi.fn(),
    mockInsert: vi.fn(),
    mockUpdate: vi.fn(),
    mockOrder: vi.fn(),
    mockEq: vi.fn(),
  }));

vi.mock('./supabaseClient.js', () => ({
  supabase: {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  },
}));

import { createChat, addMessage, loadMessages, listChats, updateChatTitle } from './chatData.js';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

  // catena: from().insert().select().single() / from().update().eq().select().single()
  mockSingle.mockResolvedValue({ data: { id: 'record-1' }, error: null });
  mockSelect.mockReturnValue({ single: mockSingle, eq: mockEq });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ order: mockOrder, select: mockSelect });
  mockOrder.mockResolvedValue({ data: [], error: null });
  mockFrom.mockReturnValue({ insert: mockInsert, select: mockSelect, update: mockUpdate });
});

describe('createChat', () => {
  it('inserisce in chats e restituisce il record', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'chat-1', title: 'Titolo' }, error: null });
    const chat = await createChat('Titolo');
    expect(mockFrom).toHaveBeenCalledWith('chats');
    expect(chat.id).toBe('chat-1');
    expect(chat.title).toBe('Titolo');
  });

  it('include user_id nella insert', async () => {
    const capturedInsert = vi.fn().mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: capturedInsert });
    mockSingle.mockResolvedValue({ data: { id: 'c1' }, error: null });
    await createChat('Test');
    expect(capturedInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1' }),
    );
  });

  it('salva form_context sulla chat', async () => {
    const capturedInsert = vi.fn().mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: capturedInsert });
    mockSingle.mockResolvedValue({ data: { id: 'c1' }, error: null });
    const fc = { asset: 'Oro', stile: 'Intraday' };
    await createChat('Test', fc);
    expect(capturedInsert).toHaveBeenCalledWith(
      expect.objectContaining({ form_context: fc }),
    );
  });

  it('default form_context = {} se non passato', async () => {
    const capturedInsert = vi.fn().mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: capturedInsert });
    mockSingle.mockResolvedValue({ data: { id: 'c1' }, error: null });
    await createChat('Test');
    expect(capturedInsert).toHaveBeenCalledWith(
      expect.objectContaining({ form_context: {} }),
    );
  });

  it('rilancia se Supabase restituisce errore', async () => {
    mockSingle.mockResolvedValue({ data: null, error: new Error('DB error') });
    await expect(createChat('X')).rejects.toThrow('DB error');
  });

  it('rilancia se utente non autenticato', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(createChat('X')).rejects.toThrow('Utente non autenticato.');
  });
});

describe('addMessage', () => {
  it('inserisce in messages con role user', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'msg-1', role: 'user', content: 'ciao' },
      error: null,
    });
    const msg = await addMessage('chat-1', 'ciao');
    expect(mockFrom).toHaveBeenCalledWith('messages');
    expect(msg.id).toBe('msg-1');
  });

  it('include chat_id, user_id e role user', async () => {
    const capturedInsert = vi.fn().mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: capturedInsert });
    mockSingle.mockResolvedValue({ data: { id: 'm1' }, error: null });
    await addMessage('chat-abc', 'testo');
    expect(capturedInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 'chat-abc',
        user_id: 'user-1',
        role: 'user',
        content: 'testo',
      }),
    );
  });

  it('salva con role assistant quando richiesto', async () => {
    const capturedInsert = vi.fn().mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: capturedInsert });
    mockSingle.mockResolvedValue({ data: { id: 'm1', role: 'assistant' }, error: null });
    await addMessage('chat-abc', 'risposta AI', 'assistant');
    expect(capturedInsert).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'assistant', content: 'risposta AI' }),
    );
  });

  it('rilancia se Supabase restituisce errore', async () => {
    mockSingle.mockResolvedValue({ data: null, error: new Error('insert fail') });
    await expect(addMessage('chat-1', 'x')).rejects.toThrow('insert fail');
  });
});

describe('loadMessages', () => {
  it('carica messaggi con select su messages', async () => {
    const capturedSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: capturedSelect });
    mockOrder.mockResolvedValue({ data: [{ id: 'm1' }, { id: 'm2' }], error: null });
    const msgs = await loadMessages('chat-1');
    expect(mockFrom).toHaveBeenCalledWith('messages');
    expect(msgs).toHaveLength(2);
  });

  it('rilancia se Supabase restituisce errore', async () => {
    const capturedSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: capturedSelect });
    mockOrder.mockResolvedValue({ data: null, error: new Error('select fail') });
    await expect(loadMessages('chat-1')).rejects.toThrow('select fail');
  });
});

describe('listChats', () => {
  it('legge chats ordinate per updated_at desc', async () => {
    const capturedOrder = vi.fn().mockResolvedValue({
      data: [{ id: 'c1', updated_at: '2026-06-30' }],
      error: null,
    });
    const capturedSelect = vi.fn().mockReturnValue({ order: capturedOrder });
    mockFrom.mockReturnValue({ select: capturedSelect });
    const chats = await listChats();
    expect(mockFrom).toHaveBeenCalledWith('chats');
    expect(capturedOrder).toHaveBeenCalledWith('updated_at', { ascending: false });
    expect(chats).toHaveLength(1);
  });

  it('rilancia se Supabase restituisce errore', async () => {
    const capturedOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('list fail') });
    const capturedSelect = vi.fn().mockReturnValue({ order: capturedOrder });
    mockFrom.mockReturnValue({ select: capturedSelect });
    await expect(listChats()).rejects.toThrow('list fail');
  });
});

describe('updateChatTitle', () => {
  it('aggiorna il titolo della chat', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'chat-1', title: 'Nuovo titolo' }, error: null });
    const chat = await updateChatTitle('chat-1', 'Nuovo titolo');
    expect(mockFrom).toHaveBeenCalledWith('chats');
    expect(mockUpdate).toHaveBeenCalledWith({ title: 'Nuovo titolo' });
    expect(chat.title).toBe('Nuovo titolo');
  });

  it('rilancia se Supabase restituisce errore', async () => {
    mockSingle.mockResolvedValue({ data: null, error: new Error('update fail') });
    await expect(updateChatTitle('chat-1', 'X')).rejects.toThrow('update fail');
  });
});
