import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { mockReload, mockSignIn, mockUpdateUser, mockSaveTheme } = vi.hoisted(() => ({
  mockReload: vi.fn(),
  mockSignIn: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockSaveTheme: vi.fn(),
}));

let authState;
vi.mock('../auth/AuthProvider.jsx', () => ({ useAuth: () => authState }));

vi.mock('../lib/supabaseClient.js', () => ({
  supabase: { auth: { signInWithPassword: mockSignIn, updateUser: mockUpdateUser } },
}));

// theme.js reale (normalizeTheme/applyTheme veri), solo saveTheme mockato (niente rete).
vi.mock('../lib/theme.js', async (importActual) => {
  const actual = await importActual();
  return { ...actual, saveTheme: mockSaveTheme };
});

import Settings from './Settings.jsx';

function renderSettings() {
  return render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  document.documentElement.classList.remove('dark');
  authState = {
    session: { user: { id: 'u1', email: 'mario@demo.local' } },
    profile: { theme: 'dark' },
    reloadProfile: mockReload,
  };
  mockSaveTheme.mockResolvedValue('light');
  mockSignIn.mockResolvedValue({ error: null });
  mockUpdateUser.mockResolvedValue({ error: null });
});

describe('Settings — disclaimer', () => {
  it('mostra sempre il disclaimer', () => {
    renderSettings();
    expect(screen.getByText(/non è consulenza finanziaria/i)).toBeInTheDocument();
  });
});

describe('Settings — tema', () => {
  it('cambia tema: salva sul profilo e ricarica il profilo', async () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Chiaro' }));
    await waitFor(() => {
      expect(mockSaveTheme).toHaveBeenCalledWith('u1', 'light');
    });
    expect(mockReload).toHaveBeenCalled();
    // Il segmented riflette la scelta (aria-pressed sul bottone Chiaro).
    expect(screen.getByRole('button', { name: 'Chiaro' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('se il salvataggio tema fallisce, mostra errore e fa rollback', async () => {
    mockSaveTheme.mockRejectedValue(new Error('Impossibile salvare il tema. Riprova.'));
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Chiaro' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Impossibile salvare il tema/);
    });
    // Rollback: torna a Scuro attivo.
    expect(screen.getByRole('button', { name: 'Scuro' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Settings — cambio password', () => {
  function compila({ attuale = 'vecchia', nuova = 'nuovapass', conferma = 'nuovapass' }) {
    fireEvent.change(screen.getByLabelText('Password attuale'), { target: { value: attuale } });
    fireEvent.change(screen.getByLabelText('Nuova password'), { target: { value: nuova } });
    fireEvent.change(screen.getByLabelText('Conferma nuova password'), {
      target: { value: conferma },
    });
  }

  it('rifiuta una nuova password troppo corta senza chiamare Supabase', async () => {
    renderSettings();
    compila({ nuova: '123', conferma: '123' });
    fireEvent.click(screen.getByRole('button', { name: 'Aggiorna password' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/troppo corta/);
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('rifiuta se nuova e conferma non coincidono', async () => {
    renderSettings();
    compila({ nuova: 'nuovapass', conferma: 'diversa1' });
    fireEvent.click(screen.getByRole('button', { name: 'Aggiorna password' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/non coincidono/);
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('password attuale errata: messaggio chiaro, nessun updateUser', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    renderSettings();
    compila({});
    fireEvent.click(screen.getByRole('button', { name: 'Aggiorna password' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Password attuale errata.');
    });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('happy path: riverifica la vecchia poi aggiorna, messaggio di successo', async () => {
    renderSettings();
    compila({});
    fireEvent.click(screen.getByRole('button', { name: 'Aggiorna password' }));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/Password aggiornata/);
    });
    expect(mockSignIn).toHaveBeenCalledWith({ email: 'mario@demo.local', password: 'vecchia' });
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'nuovapass' });
  });

  it('errore su updateUser (password debole): messaggio chiaro, nessun crash', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Password should be at least 6 characters' } });
    renderSettings();
    compila({});
    fireEvent.click(screen.getByRole('button', { name: 'Aggiorna password' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/non è abbastanza robusta/);
    });
  });

  it('errore di rete inatteso: mostra un messaggio e riabilita il form', async () => {
    mockSignIn.mockRejectedValue(new Error('fetch failed'));
    renderSettings();
    compila({});
    fireEvent.click(screen.getByRole('button', { name: 'Aggiorna password' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Rete non raggiungibile/);
    });
    expect(screen.getByRole('button', { name: 'Aggiorna password' })).toBeEnabled();
  });
});
