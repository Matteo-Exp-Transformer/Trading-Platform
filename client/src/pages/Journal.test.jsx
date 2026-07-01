import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Journal, { filterEntries } from './Journal.jsx';

const { mockList, mockCreate, mockUpdate, mockDelete, mockListChats } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockListChats: vi.fn(),
}));

vi.mock('../auth/AuthProvider.jsx', () => ({
  useAuth: () => ({ profile: null, session: { user: { email: 'x@y.z' } }, logout: vi.fn() }),
}));

vi.mock('../lib/journalData.js', () => ({
  listEntries: mockList,
  createEntry: mockCreate,
  updateEntry: mockUpdate,
  deleteEntry: mockDelete,
}));

vi.mock('../lib/chatData.js', () => ({
  listChats: mockListChats,
  updateChatTitle: vi.fn(),
}));

function renderJournal(entries = ['/journal']) {
  return render(
    <MemoryRouter initialEntries={entries}>
      <Journal />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockList.mockResolvedValue([]);
  mockListChats.mockResolvedValue([]);
});

describe('filterEntries', () => {
  const data = [
    { id: '1', asset: 'EURUSD', outcome: 'win' },
    { id: '2', asset: 'BTCUSD', outcome: 'loss' },
    { id: '3', asset: 'EURJPY', outcome: '' },
  ];
  it('filtra per testo asset (case-insensitive)', () => {
    expect(filterEntries(data, { query: 'eur', outcome: '' }).map((e) => e.id)).toEqual(['1', '3']);
  });
  it('filtra per esito', () => {
    expect(filterEntries(data, { query: '', outcome: 'loss' }).map((e) => e.id)).toEqual(['2']);
  });
  it('senza filtri restituisce tutto', () => {
    expect(filterEntries(data, { query: '', outcome: '' })).toHaveLength(3);
  });
});

describe('Journal (pagina)', () => {
  it('mostra titolo e stato vuoto quando non ci sono voci', async () => {
    renderJournal();
    expect(screen.getByRole('heading', { name: 'Journal' })).toBeInTheDocument();
    expect(await screen.findByText(/Il journal è vuoto/i)).toBeInTheDocument();
  });

  it('elenca le voci esistenti', async () => {
    mockList.mockResolvedValue([
      { id: 'e1', asset: 'EURUSD', timeframe: '5m', traded_at: '2026-07-01', outcome: 'win', tags: [] },
    ]);
    renderJournal();
    const card = (await screen.findByText('EURUSD')).closest('li');
    expect(within(card).getByText('Vinto')).toBeInTheDocument();
  });

  it('mostra sempre il disclaimer', () => {
    renderJournal();
    expect(screen.getByText(/non è consulenza finanziaria/i)).toBeInTheDocument();
  });

  it('crea una nuova voce dal form', async () => {
    mockCreate.mockResolvedValue({ id: 'new', asset: 'GBPUSD', traded_at: '2026-07-02', tags: [] });
    renderJournal();
    await screen.findByText(/Il journal è vuoto/i);

    fireEvent.click(screen.getByRole('button', { name: /Nuova voce/i }));
    const dialog = await screen.findByRole('dialog', { name: /Nuova voce/i });
    fireEvent.change(within(dialog).getByLabelText(/Asset/i), { target: { value: 'GBPUSD' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /Salva voce/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ asset: 'GBPUSD' }));
    });
    expect(await screen.findByText('GBPUSD')).toBeInTheDocument();
  });

  it('blocca il salvataggio senza asset', async () => {
    renderJournal();
    await screen.findByText(/Il journal è vuoto/i);
    fireEvent.click(screen.getByRole('button', { name: /Nuova voce/i }));
    const dialog = await screen.findByRole('dialog', { name: /Nuova voce/i });
    fireEvent.click(within(dialog).getByRole('button', { name: /Salva voce/i }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/asset/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('pre-compila il form dallo stato di navigazione (Salva nel journal)', async () => {
    renderJournal([{ pathname: '/journal', state: { newEntry: { asset: 'XAUUSD', timeframe: '15m', direction: 'none', tags: [], traded_at: '2026-07-02' } } }]);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText(/Asset/i)).toHaveValue('XAUUSD');
  });
});
