import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('./supabaseClient.js', () => ({
  supabase: {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  },
}));

import { createNote, deleteNote, listNotes, updateNote } from './notesData.js';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });
});

describe('notesData', () => {
  it('listNotes legge le note dalla più recente', async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ id: 'n1' }], error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({ order }),
    });

    await expect(listNotes()).resolves.toEqual([{ id: 'n1' }]);
    expect(mockFrom).toHaveBeenCalledWith('notes');
    expect(order).toHaveBeenCalledWith('updated_at', { ascending: false });
  });

  it('createNote usa lo user_id autenticato e scarta campi non scrivibili', async () => {
    const captured = {};
    const single = vi.fn().mockResolvedValue({ data: { id: 'n1' }, error: null });
    mockFrom.mockReturnValue({
      insert: vi.fn((row) => {
        captured.row = row;
        return { select: vi.fn().mockReturnValue({ single }) };
      }),
    });

    await createNote({ title: 'Idea', color: '#3976cd', id: 'forzato' });
    expect(captured.row).toEqual({
      title: 'Idea',
      color: '#3976cd',
      user_id: 'user-1',
    });
  });

  it('createNote rifiuta una sessione senza utente', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(createNote({ title: 'Idea' })).rejects.toThrow('Utente non autenticato.');
  });

  it('updateNote aggiorna solo i campi ammessi della nota indicata', async () => {
    const captured = {};
    const single = vi.fn().mockResolvedValue({
      data: { id: 'n1', title: 'Aggiornata' },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    mockFrom.mockReturnValue({
      update: vi.fn((row) => {
        captured.row = row;
        return { eq };
      }),
    });

    await expect(updateNote('n1', { title: 'Aggiornata', user_id: 'altro' }))
      .resolves.toMatchObject({ title: 'Aggiornata' });
    expect(captured.row).toEqual({ title: 'Aggiornata' });
    expect(eq).toHaveBeenCalledWith('id', 'n1');
  });

  it('deleteNote elimina e restituisce soltanto la nota indicata', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 'n1' }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({ eq }),
    });

    await expect(deleteNote('n1')).resolves.toEqual({ id: 'n1' });
    expect(eq).toHaveBeenCalledWith('id', 'n1');
    expect(select).toHaveBeenCalledWith('id');
  });

  it('rilancia gli errori restituiti da Supabase', async () => {
    const order = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('lettura fallita'),
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({ order }),
    });

    await expect(listNotes()).rejects.toThrow('lettura fallita');
  });
});
