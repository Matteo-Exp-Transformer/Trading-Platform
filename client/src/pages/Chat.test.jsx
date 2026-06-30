import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Chat from './Chat.jsx';

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
  loadMessages: vi.fn().mockResolvedValue([]),
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
});
