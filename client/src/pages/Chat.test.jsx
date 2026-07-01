import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Chat from './Chat.jsx';

// La Chat monta la Sidebar, che contiene un <Link> (ingresso Impostazioni): serve un Router.
function renderChat(entries) {
  return render(
    <MemoryRouter initialEntries={entries}>
      <Chat />
    </MemoryRouter>,
  );
}

vi.mock('../auth/AuthProvider.jsx', () => ({
  useAuth: () => ({
    profile: null,
    session: { user: { email: 'test@demo.local' } },
    logout: vi.fn(),
  }),
}));

const { mockListChats } = vi.hoisted(() => ({
  mockListChats: vi.fn().mockResolvedValue([]),
}));

vi.mock('../lib/chatData.js', () => ({
  createChat: vi.fn(),
  addMessage: vi.fn(),
  loadMessages: vi.fn().mockResolvedValue([]),
  listChats: mockListChats,
  updateChatTitle: vi.fn(),
}));

vi.mock('../lib/agentApi.js', () => ({
  analyzeChatStream: vi.fn().mockResolvedValue({ transcript: null }),
}));

describe('Chat (pagina)', () => {
  it('mostra il nome prodotto nell\'header', () => {
    renderChat();
    expect(screen.getByText('FREEDOM TRADING SYSTEM')).toBeInTheDocument();
  });

  it('mostra il form di nuova analisi al primo caricamento', () => {
    renderChat();
    expect(screen.getByText('Nuova analisi')).toBeInTheDocument();
  });

  it('mostra il disclaimer fisso nel footer', () => {
    renderChat();
    const disclaimers = screen.getAllByText(/non è consulenza finanziaria/i);
    expect(disclaimers.length).toBeGreaterThan(0);
  });

  it('mostra il pulsante Esci', () => {
    renderChat();
    expect(screen.getByRole('button', { name: /esci/i })).toBeInTheDocument();
  });

  it('apre la sidebar e carica lo storico al click sull\'icona menu', async () => {
    renderChat();
    fireEvent.click(screen.getByRole('button', { name: /apri storico chat/i }));
    expect(mockListChats).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('Storico chat')).toBeInTheDocument();
    });
  });

  it('apre lo storico all\'arrivo dalla Home con lo stato openStorico', async () => {
    renderChat([{ pathname: '/nuova-analisi', state: { openStorico: true } }]);
    expect(mockListChats).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('Storico chat')).toBeInTheDocument();
    });
  });

  it('senza stato di navigazione lo storico resta chiuso all\'avvio', () => {
    renderChat();
    expect(screen.queryByText('Storico chat')).not.toBeInTheDocument();
  });

  it('chiude la sidebar al click su chiudi', async () => {
    renderChat();
    fireEvent.click(screen.getByRole('button', { name: /apri storico chat/i }));
    await waitFor(() => {
      expect(screen.getByText('Storico chat')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /chiudi storico chat/i }));
    expect(screen.queryByText('Storico chat')).not.toBeInTheDocument();
  });
});
