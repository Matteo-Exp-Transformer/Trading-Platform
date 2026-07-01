// Test d'integrazione leggero: senza sessione l'app redirige a /login (titolo);
// con sessione la landing è la Home (rotta «/»), non più la Chat.
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';

const { mockGetSession, mockSingle } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockSingle: vi.fn(),
}));

vi.mock('./lib/supabaseClient.js', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    }),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSession.mockResolvedValue({ data: { session: null } });
  mockSingle.mockResolvedValue({ data: null });
});

describe('<App /> — non autenticato', () => {
  it('mostra il titolo del prodotto', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('FREEDOM TRADING SYSTEM')).toBeInTheDocument();
    });
  });

});

describe('<App /> — autenticato', () => {
  it('dopo il login la landing è la Home (CTA nuova analisi), non la Chat', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1', email: 'mario@demo.local' } } },
    });
    mockSingle.mockResolvedValue({ data: { id: 'u1', theme: 'dark' } });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Nuova analisi' })).toBeInTheDocument();
    });
    expect(
      screen.getByRole('heading', { name: 'Il tuo agente di analisi tecnica' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cosa puoi fare' })).toBeInTheDocument();
  });
});
