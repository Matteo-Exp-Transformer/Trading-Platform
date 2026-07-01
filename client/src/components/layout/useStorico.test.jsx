import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useStorico } from './useStorico.js';

const { mockListChats, mockUpdateChatTitle } = vi.hoisted(() => ({
  mockListChats: vi.fn(),
  mockUpdateChatTitle: vi.fn(),
}));

vi.mock('../../lib/chatData.js', () => ({
  listChats: mockListChats,
  updateChatTitle: mockUpdateChatTitle,
}));

const chats = [
  { id: 'c1', title: 'Prima analisi', updated_at: '2026-06-30T10:00:00Z' },
  { id: 'c2', title: 'Seconda analisi', updated_at: '2026-06-29T10:00:00Z' },
];

function Harness() {
  const storico = useStorico();
  const location = useLocation();

  return (
    <>
      <p>{storico.open ? 'APERTO' : 'CHIUSO'}</p>
      <p>{storico.loading ? 'CARICAMENTO' : 'PRONTO'}</p>
      <p>{storico.error ?? 'NESSUN ERRORE'}</p>
      <p>{storico.renameError ?? 'NESSUN ERRORE RINOMINA'}</p>
      <p>{storico.chats.map((chat) => chat.title).join('|')}</p>
      <p>
        ROTTA {location.pathname} CHAT {location.state?.openChatId ?? 'NESSUNA'}
      </p>
      <button type="button" onClick={storico.openSidebar}>Apri</button>
      <button type="button" onClick={storico.closeSidebar}>Chiudi</button>
      <button type="button" onClick={() => storico.selectChat('c1')}>Apri c1</button>
      <button type="button" onClick={storico.nuovaAnalisi}>Nuova</button>
      <button type="button" onClick={() => storico.renameChat('c1', 'Titolo aggiornato')}>
        Rinomina c1
      </button>
    </>
  );
}

function renderHookHarness() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Harness />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListChats.mockResolvedValue(chats);
  mockUpdateChatTitle.mockResolvedValue({
    ...chats[0],
    title: 'Titolo aggiornato',
    updated_at: '2026-07-01T10:00:00Z',
  });
});

describe('useStorico', () => {
  it('apre il drawer e carica lo storico', async () => {
    renderHookHarness();
    fireEvent.click(screen.getByRole('button', { name: 'Apri' }));
    expect(screen.getByText('APERTO')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Prima analisi|Seconda analisi')).toBeInTheDocument();
    });
    expect(mockListChats).toHaveBeenCalledOnce();
  });

  it('mostra un errore leggibile se lo storico non si carica', async () => {
    mockListChats.mockRejectedValue(new Error('rete'));
    renderHookHarness();
    fireEvent.click(screen.getByRole('button', { name: 'Apri' }));
    await waitFor(() => {
      expect(screen.getByText('Impossibile caricare lo storico. Riprova.')).toBeInTheDocument();
    });
  });

  it('apre una chat sulla rotta Nuova analisi e chiude il drawer', async () => {
    renderHookHarness();
    fireEvent.click(screen.getByRole('button', { name: 'Apri' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apri c1' }));
    expect(screen.getByText('CHIUSO')).toBeInTheDocument();
    expect(screen.getByText('ROTTA /nuova-analisi CHAT c1')).toBeInTheDocument();
  });

  it('apre una nuova analisi pulita', () => {
    renderHookHarness();
    fireEvent.click(screen.getByRole('button', { name: 'Nuova' }));
    expect(screen.getByText('ROTTA /nuova-analisi CHAT NESSUNA')).toBeInTheDocument();
  });

  it('aggiorna e riordina una chat rinominata', async () => {
    renderHookHarness();
    fireEvent.click(screen.getByRole('button', { name: 'Apri' }));
    await screen.findByText('Prima analisi|Seconda analisi');
    fireEvent.click(screen.getByRole('button', { name: 'Rinomina c1' }));
    await waitFor(() => {
      expect(screen.getByText('Titolo aggiornato|Seconda analisi')).toBeInTheDocument();
    });
    expect(mockUpdateChatTitle).toHaveBeenCalledWith('c1', 'Titolo aggiornato');
  });

  it('espone un errore leggibile se la rinomina fallisce', async () => {
    mockUpdateChatTitle.mockRejectedValue(new Error('rete'));
    renderHookHarness();
    fireEvent.click(screen.getByRole('button', { name: 'Rinomina c1' }));
    await waitFor(() => {
      expect(screen.getByText('Rinomina non riuscita. Riprova.')).toBeInTheDocument();
    });
  });
});
