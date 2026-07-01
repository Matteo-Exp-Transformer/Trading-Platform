import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login.jsx';

const { mockSignIn } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
}));

vi.mock('../lib/supabaseClient.js', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignIn,
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

beforeEach(() => {
  vi.clearAllMocks();
  mockSignIn.mockResolvedValue({ error: null });
});

describe('Login', () => {
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

  it('se la rete non risponde mostra un errore e riabilita il form', async () => {
    mockSignIn.mockRejectedValue(new Error('fetch failed'));
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'mario@demo.local' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Rete non raggiungibile/);
    });
    expect(screen.getByRole('button', { name: /accedi/i })).toBeEnabled();
  });
});
