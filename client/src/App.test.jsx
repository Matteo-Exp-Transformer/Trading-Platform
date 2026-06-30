// Test d'integrazione leggero: l'app redirige a /login quando non autenticato,
// mostrando titolo e disclaimer obbligatorio.
import { vi, describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';

vi.mock('./lib/supabaseClient.js', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    }),
  },
}));

describe('<App />', () => {
  it('mostra il titolo del prodotto', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('FREEDOM TRADING SYSTEM')).toBeInTheDocument();
    });
  });

  it('mostra sempre il disclaimer (non è consulenza finanziaria)', async () => {
    render(<App />);
    await waitFor(() => {
      // Login mostra il disclaimer sia nel body sia nel footer: getAllByText è corretto.
      expect(screen.getAllByText(/non è consulenza finanziaria/i).length).toBeGreaterThan(0);
    });
  });
});
