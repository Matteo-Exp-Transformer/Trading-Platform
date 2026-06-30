import { vi, describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthProvider.jsx';

vi.mock('../lib/supabaseClient.js', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    }),
  },
}));

function TestConsumer() {
  const auth = useAuth();
  if (!auth) return <p>no context</p>;
  return <p>{auth.loading ? 'caricamento' : 'pronto'}</p>;
}

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
});
