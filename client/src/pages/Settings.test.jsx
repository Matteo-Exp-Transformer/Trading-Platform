import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const {
  mockReload,
  mockSignIn,
  mockUpdateUser,
  mockSaveTheme,
  mockListChats,
  mockLogout,
} = vi.hoisted(() => ({
  mockReload: vi.fn(),
  mockSignIn: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockSaveTheme: vi.fn(),
  mockListChats: vi.fn(),
  mockLogout: vi.fn(),
}));

let authState;
vi.mock('../auth/AuthProvider.jsx', () => ({ useAuth: () => authState }));

vi.mock('../lib/supabaseClient.js', () => ({
  supabase: { auth: { signInWithPassword: mockSignIn, updateUser: mockUpdateUser } },
}));

vi.mock('../lib/chatData.js', () => ({
  listChats: mockListChats,
  updateChatTitle: vi.fn(),
}));

vi.mock('../lib/theme.js', async (importActual) => {
  const actual = await importActual();
  return { ...actual, saveTheme: mockSaveTheme };
});

import Settings from './Settings.jsx';

function RouteProbe() {
  const location = useLocation();
  return <div>CHAT {location.state?.openChatId ?? 'NUOVA'}</div>;
}

function renderSettings() {
  return render(
    <MemoryRouter initialEntries={['/impostazioni']}>
      <Routes>
        <Route path="/impostazioni" element={<Settings />} />
        <Route path="/nuova-analisi" element={<RouteProbe />} />
      </Routes>
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
    logout: mockLogout,
  };
  mockSaveTheme.mockResolvedValue('light');
  mockSignIn.mockResolvedValue({ error: null });
  mockUpdateUser.mockResolvedValue({ error: null });
  mockListChats.mockResolvedValue([
    { id: 'c1', title: 'Analisi BTC', updated_at: '2026-07-01T10:00:00Z' },
  ]);
});

describe('Settings — struttura', () => {
  it('mostra header condiviso e titolo pagina, senza freccia indietro', () => {
    renderSettings();
    expect(screen.getByRole('button', { name: 'Apri menu' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'FREEDOM TRADING SYSTEM' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('heading', { name: 'Impostazioni', level: 1 })).toBeInTheDocument();
    expect(screen.queryByLabelText('Torna alla chat')).not.toBeInTheDocument();
  });

  it('apre una chat dello storico dalla Sidebar', async () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Apri menu' }));
    fireEvent.click(await screen.findByText('Analisi BTC'));
    expect(screen.getByText('CHAT c1')).toBeInTheDocument();
  });

  it('avvia una nuova analisi dalla Sidebar', async () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Apri menu' }));
    fireEvent.click(await screen.findByRole('button', { name: /Nuova analisi/i }));
    expect(screen.getByText('CHAT NUOVA')).toBeInTheDocument();
  });
});

describe('Settings — tema', () => {
  it('salva il tema sul profilo e lo ricarica', async () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Chiaro' }));
    await waitFor(() => {
      expect(mockSaveTheme).toHaveBeenCalledWith('u1', 'light');
    });
    expect(mockReload).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Chiaro' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('se il salvataggio fallisce mostra errore e fa rollback', async () => {
    mockSaveTheme.mockRejectedValue(new Error('Impossibile salvare il tema. Riprova.'));
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Chiaro' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Impossibile salvare il tema/);
    });
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

  it('se la password attuale è errata non aggiorna l’utente', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    renderSettings();
    compila({});
    fireEvent.click(screen.getByRole('button', { name: 'Aggiorna password' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Password attuale errata.');
    });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('riverifica la vecchia password e aggiorna quella nuova', async () => {
    renderSettings();
    compila({});
    fireEvent.click(screen.getByRole('button', { name: 'Aggiorna password' }));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/Password aggiornata/);
    });
    expect(mockSignIn).toHaveBeenCalledWith({ email: 'mario@demo.local', password: 'vecchia' });
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'nuovapass' });
  });

  it('traduce l’errore di password debole in un messaggio chiaro', async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Password should be at least 6 characters' },
    });
    renderSettings();
    compila({});
    fireEvent.click(screen.getByRole('button', { name: 'Aggiorna password' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/non è abbastanza robusta/);
    });
  });

  it('gestisce un errore di rete e riabilita il form', async () => {
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
