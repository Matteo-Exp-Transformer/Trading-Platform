import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './Home.jsx';

vi.mock('../auth/AuthProvider.jsx', () => ({
  useAuth: () => ({
    profile: { display_name: 'Matteo Test' },
    session: { user: { email: 'matteo@demo.local' } },
    logout: vi.fn(),
  }),
}));

describe('Home (guscio autenticato)', () => {
  it('mostra il nome del profilo', () => {
    render(<Home />);
    expect(screen.getByText('Matteo Test')).toBeInTheDocument();
  });

  it("mostra l'email dell'utente", () => {
    render(<Home />);
    expect(screen.getAllByText('matteo@demo.local').length).toBeGreaterThan(0);
  });

  it('mostra il pulsante Esci', () => {
    render(<Home />);
    expect(screen.getByRole('button', { name: /esci/i })).toBeInTheDocument();
  });

  it('mostra il disclaimer', () => {
    render(<Home />);
    expect(screen.getByText(/non è consulenza finanziaria/i)).toBeInTheDocument();
  });
});
