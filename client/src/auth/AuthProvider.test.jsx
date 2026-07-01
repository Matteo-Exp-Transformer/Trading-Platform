import { vi, describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthProvider.jsx';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
  from: vi.fn(),
  single: vi.fn(),
  applyTheme: vi.fn(),
  authCallback: null,
}));

vi.mock('../lib/supabaseClient.js', () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signOut: mocks.signOut,
    },
    from: mocks.from,
  },
}));

vi.mock('../lib/theme.js', () => ({
  applyTheme: mocks.applyTheme,
}));

function profileQuery() {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    single: mocks.single,
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

function TestConsumer() {
  const auth = useAuth();
  if (!auth) return <p>no context</p>;
  return <p>{auth.loading ? 'caricamento' : 'pronto'}</p>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authCallback = null;
  mocks.getSession.mockResolvedValue({ data: { session: null } });
  mocks.onAuthStateChange.mockImplementation((callback) => {
    mocks.authCallback = callback;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  mocks.from.mockImplementation(() => profileQuery());
  mocks.single.mockResolvedValue({ data: null });
  mocks.signOut.mockResolvedValue({ error: null });
});

describe('AuthProvider', () => {
  it('fornisce il contesto ai figli e risolve il caricamento', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('pronto')).toBeInTheDocument();
    });
  });

  it('espone la funzione logout', async () => {
    let authCtx;
    function CaptureAuth() {
      authCtx = useAuth();
      return null;
    }
    render(
      <AuthProvider>
        <CaptureAuth />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(typeof authCtx?.logout).toBe('function');
    });
  });

  it('carica il profilo dopo un evento auth e applica il tema salvato', async () => {
    mocks.single.mockResolvedValue({ data: { id: 'u1', theme: 'light' } });
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('pronto')).toBeInTheDocument();
    });
    mocks.from.mockClear();
    mocks.applyTheme.mockClear();

    act(() => {
      mocks.authCallback('SIGNED_IN', { user: { id: 'u1' } });
    });

    await waitFor(() => {
      expect(mocks.from).toHaveBeenCalledWith('profiles');
      expect(mocks.applyTheme).toHaveBeenCalledWith('light');
    });
  });

  it('se il profilo non è raggiungibile mantiene la sessione e applica il tema di default', async () => {
    mocks.single.mockRejectedValue(new Error('rete non raggiungibile'));
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('pronto')).toBeInTheDocument();
    });
    mocks.applyTheme.mockClear();

    act(() => {
      mocks.authCallback('SIGNED_IN', { user: { id: 'u1' } });
    });

    await waitFor(() => {
      expect(mocks.applyTheme).toHaveBeenCalledWith();
    });
  });
});
