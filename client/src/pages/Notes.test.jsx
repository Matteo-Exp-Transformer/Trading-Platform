import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Notes from './Notes.jsx';

const {
  mockCreateNote,
  mockDeleteNote,
  mockListChats,
  mockListNotes,
  mockUpdateNote,
} = vi.hoisted(() => ({
  mockCreateNote: vi.fn(),
  mockDeleteNote: vi.fn(),
  mockListChats: vi.fn(),
  mockListNotes: vi.fn(),
  mockUpdateNote: vi.fn(),
}));

vi.mock('../auth/AuthProvider.jsx', () => ({
  useAuth: () => ({
    profile: null,
    session: { user: { email: 'demo@example.test' } },
    logout: vi.fn(),
  }),
}));

vi.mock('../lib/notesData.js', () => ({
  createNote: mockCreateNote,
  deleteNote: mockDeleteNote,
  listNotes: mockListNotes,
  updateNote: mockUpdateNote,
}));

vi.mock('../lib/chatData.js', () => ({
  deleteChat: vi.fn(),
  listChats: mockListChats,
  updateChatTitle: vi.fn(),
}));

function renderNotes() {
  return render(
    <MemoryRouter initialEntries={['/note']}>
      <Notes />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListNotes.mockResolvedValue([]);
  mockListChats.mockResolvedValue([]);
});

describe('Notes', () => {
  it('mostra titolo, stato vuoto e disclaimer', async () => {
    renderNotes();

    expect(screen.getByRole('heading', { name: 'Note' })).toBeInTheDocument();
    expect(await screen.findByText('Il taccuino è vuoto.')).toBeInTheDocument();
    expect(screen.getByText(/Non è consulenza finanziaria/i)).toBeInTheDocument();
  });

  it('mostra titolo e anteprima con font e colore salvati', async () => {
    mockListNotes.mockResolvedValue([{
      id: 'n1',
      title: 'Promemoria',
      content: 'Aspettare la conferma.',
      font: 'lora',
      color: '#c44d74',
      updated_at: '2026-07-02T08:00:00Z',
    }]);

    renderNotes();

    const preview = await screen.findByText('Aspettare la conferma.');
    expect(preview.parentElement).toHaveStyle({
      fontFamily: '"Lora", serif',
      color: '#c44d74',
    });
    expect(screen.getByText('Promemoria')).toBeInTheDocument();
  });

  it('crea una nota e aggiorna l’anteprima dal vivo', async () => {
    mockCreateNote.mockResolvedValue({
      id: 'n2',
      title: 'Piano',
      content: 'Rivedere i livelli.',
      font: 'roboto-mono',
      color: '#3976cd',
      updated_at: '2026-07-02T09:00:00Z',
    });
    renderNotes();
    await screen.findByText('Il taccuino è vuoto.');

    fireEvent.click(screen.getByRole('button', { name: /Nuova nota/i }));
    const dialog = screen.getByRole('dialog', { name: 'Nuova nota' });
    fireEvent.change(within(dialog).getByLabelText('Titolo'), {
      target: { value: 'Piano' },
    });
    fireEvent.change(within(dialog).getByLabelText('Testo'), {
      target: { value: 'Rivedere i livelli.' },
    });
    fireEvent.change(within(dialog).getByLabelText('Font'), {
      target: { value: 'roboto-mono' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Colore Blu' }));

    const previewRegion = within(dialog).getByRole('region', { name: 'Anteprima' });
    const livePreview = within(previewRegion).getByText('Rivedere i livelli.');
    expect(livePreview.parentElement).toHaveStyle({
      fontFamily: '"Roboto Mono", monospace',
      color: '#3976cd',
    });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Salva nota' }));
    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith({
        title: 'Piano',
        content: 'Rivedere i livelli.',
        font: 'roboto-mono',
        color: '#3976cd',
      });
    });
    expect(await screen.findByText('Piano')).toBeInTheDocument();
  });

  it('modifica una nota esistente', async () => {
    mockListNotes.mockResolvedValue([{
      id: 'n1',
      title: 'Promemoria',
      content: 'Testo',
      font: '',
      color: '',
      updated_at: '2026-07-02T08:00:00Z',
    }]);
    mockUpdateNote.mockResolvedValue({
      id: 'n1',
      title: 'Promemoria aggiornato',
      content: 'Testo',
      font: '',
      color: '',
      updated_at: '2026-07-02T10:00:00Z',
    });
    renderNotes();

    fireEvent.click(await screen.findByRole('button', { name: 'Modifica Promemoria' }));
    const dialog = screen.getByRole('dialog', { name: 'Modifica nota' });
    fireEvent.change(within(dialog).getByLabelText('Titolo'), {
      target: { value: 'Promemoria aggiornato' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salva nota' }));

    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith(
        'n1',
        expect.objectContaining({ title: 'Promemoria aggiornato' }),
      );
    });
    expect(await screen.findByText('Promemoria aggiornato')).toBeInTheDocument();
  });

  it('elimina una nota dopo conferma', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockDeleteNote.mockResolvedValue({ id: 'n1' });
    mockListNotes.mockResolvedValue([{
      id: 'n1',
      title: 'Promemoria',
      content: 'Testo',
      font: '',
      color: '',
      updated_at: '2026-07-02T08:00:00Z',
    }]);
    renderNotes();

    fireEvent.click(await screen.findByRole('button', { name: 'Elimina Promemoria' }));

    await waitFor(() => expect(mockDeleteNote).toHaveBeenCalledWith('n1'));
    expect(screen.queryByText('Promemoria')).not.toBeInTheDocument();
    confirm.mockRestore();
  });

  it('mostra un errore leggibile se il caricamento fallisce', async () => {
    mockListNotes.mockRejectedValue(new Error('rete'));
    renderNotes();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossibile caricare le note. Riprova.',
    );
  });
});
