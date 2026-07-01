import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Chat from './Chat.jsx';

const { mockListChats, mockLoadMessages } = vi.hoisted(() => ({
  mockListChats: vi.fn(),
  mockLoadMessages: vi.fn(),
}));

vi.mock('../auth/AuthProvider.jsx', () => ({
  useAuth: () => ({
    profile: null,
    session: { user: { email: 'test@demo.local' } },
    logout: vi.fn(),
  }),
}));

vi.mock('../lib/chatData.js', () => ({
  createChat: vi.fn(),
  addMessage: vi.fn(),
  loadMessages: mockLoadMessages,
  listChats: mockListChats,
  updateChatTitle: vi.fn(),
  getChat: vi.fn().mockResolvedValue({ id: 'c1', form_context: {} }),
}));

vi.mock('../lib/agentApi.js', () => ({
  analyzeChatStream: vi.fn().mockResolvedValue({ transcript: null }),
}));

function renderChat(entries = ['/nuova-analisi']) {
  return render(
    <MemoryRouter initialEntries={entries}>
      <Chat />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListChats.mockResolvedValue([
    { id: 'c1', title: 'Analisi BTC', updated_at: '2026-07-01T10:00:00Z' },
  ]);
  mockLoadMessages.mockResolvedValue([]);
});

describe('Chat (pagina)', () => {
  it('mostra hamburger e nome prodotto cliccabile verso la Home', () => {
    renderChat();
    expect(screen.getByRole('button', { name: 'Apri menu' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'FREEDOM TRADING SYSTEM' })).toHaveAttribute('href', '/');
  });

  it('mostra il form di nuova analisi al primo caricamento', () => {
    renderChat();
    expect(screen.getByText('Nuova analisi')).toBeInTheDocument();
  });

  it('mostra il disclaimer fisso nel footer', () => {
    renderChat();
    expect(screen.getAllByText(/non è consulenza finanziaria/i).length).toBeGreaterThan(0);
  });

  it('non mostra Esci nell’header', () => {
    renderChat();
    expect(screen.queryByRole('button', { name: /Esci/i })).not.toBeInTheDocument();
  });

  it('apre il menu e carica lo storico dall’hamburger', async () => {
    renderChat();
    fireEvent.click(screen.getByRole('button', { name: 'Apri menu' }));
    expect(mockListChats).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.getByRole('complementary', { name: 'Menu' })).toBeInTheDocument();
    });
    expect(screen.getByText('Analisi BTC')).toBeInTheDocument();
  });

  it('apre una chat indicata nello stato di navigazione', async () => {
    renderChat([{ pathname: '/nuova-analisi', state: { openChatId: 'c1' } }]);
    await waitFor(() => {
      expect(mockLoadMessages).toHaveBeenCalledWith('c1');
    });
    expect(screen.queryByText('Nuova analisi')).not.toBeInTheDocument();
  });

  it('senza stato di navigazione il menu resta chiuso', () => {
    renderChat();
    expect(screen.queryByRole('complementary', { name: 'Menu' })).not.toBeInTheDocument();
  });

  it('chiude il menu dal pulsante dedicato', async () => {
    renderChat();
    fireEvent.click(screen.getByRole('button', { name: 'Apri menu' }));
    await screen.findByRole('complementary', { name: 'Menu' });
    fireEvent.click(screen.getByRole('button', { name: 'Chiudi menu' }));
    expect(screen.queryByRole('complementary', { name: 'Menu' })).not.toBeInTheDocument();
  });

  it('mostra «Salva nel journal» quando una chat è aperta', async () => {
    renderChat([{ pathname: '/nuova-analisi', state: { openChatId: 'c1' } }]);
    expect(
      await screen.findByRole('button', { name: /Salva nel journal/i }),
    ).toBeInTheDocument();
  });

  it('apre una chat dello storico restando nella pagina Chat', async () => {
    renderChat();
    fireEvent.click(screen.getByRole('button', { name: 'Apri menu' }));
    fireEvent.click(await screen.findByText('Analisi BTC'));
    await waitFor(() => {
      expect(mockLoadMessages).toHaveBeenCalledWith('c1');
    });
    expect(screen.queryByRole('complementary', { name: 'Menu' })).not.toBeInTheDocument();
  });
});
