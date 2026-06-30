import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute.jsx';

vi.mock('./AuthProvider.jsx', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from './AuthProvider.jsx';

describe('ProtectedRoute', () => {
  it('reindirizza a /login se non autenticato', () => {
    useAuth.mockReturnValue({ session: null, loading: false });
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/login" element={<p>pagina login</p>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <p>contenuto protetto</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('pagina login')).toBeInTheDocument();
    expect(screen.queryByText('contenuto protetto')).not.toBeInTheDocument();
  });

  it('mostra il contenuto se autenticato', () => {
    useAuth.mockReturnValue({ session: { user: { id: '1' } }, loading: false });
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/login" element={<p>pagina login</p>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <p>contenuto protetto</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('contenuto protetto')).toBeInTheDocument();
  });

  it('non mostra nulla durante il caricamento', () => {
    useAuth.mockReturnValue({ session: undefined, loading: true });
    const { container } = render(
      <MemoryRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <p>contenuto</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
