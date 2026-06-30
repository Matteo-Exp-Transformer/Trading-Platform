import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login.jsx';

vi.mock('../lib/supabaseClient.js', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

describe('Login', () => {
  it('mostra il disclaimer (non è consulenza finanziaria)', () => {
    renderLogin();
    const disclaimers = screen.getAllByText(/non è consulenza finanziaria/i);
    expect(disclaimers.length).toBeGreaterThan(0);
  });

  it('mostra il campo email', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('mostra il campo password', () => {
    renderLogin();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('mostra il pulsante Accedi', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /accedi/i })).toBeInTheDocument();
  });
});
