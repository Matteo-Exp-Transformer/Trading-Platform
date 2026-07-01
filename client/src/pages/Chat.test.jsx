import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Chat from './Chat.jsx';

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
    render(<Chat />);
    expect(screen.getByText('FREEDOM TRADING SYSTEM')).toBeInTheDocument();
  });

  it('mostra il form di nuova analisi al primo caricamento', () => {
    render(<Chat />);
    expect(screen.getByText('Nuova analisi')).toBeInTheDocument();
  });

  it('mostra il disclaimer fisso nel footer', () => {
    render(<Chat />);
    const disclaimers = screen.getAllByText(/non è consulenza finanziaria/i);
    expect(disclaimers.length).toBeGreaterThan(0);
  });

  it('mostra il pulsante Esci', () => {
    render(<Chat />);
    expect(screen.getByRole('button', { name: /esci/i })).toBeInTheDocument();
  });

  it('apre la sidebar e carica lo storico al click sull\'icona menu', async () => {
    render(<Chat />);
    fireEvent.click(screen.getByRole('button', { name: /apri storico chat/i }));
    expect(mockListChats).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('Storico chat')).toBeInTheDocument();
    });
  });

  it('chiude la sidebar al click su chiudi', async () => {
    render(<Chat />);
    fireEvent.click(screen.getByRole('button', { name: /apri storico chat/i }));
    await waitFor(() => {
      expect(screen.getByText('Storico chat')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /chiudi storico chat/i }));
    expect(screen.queryByText('Storico chat')).not.toBeInTheDocument();
  });
});
