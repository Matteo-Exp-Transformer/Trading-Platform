import { vi, describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './Home.jsx';

const { mockLogout } = vi.hoisted(() => ({ mockLogout: vi.fn() }));

vi.mock('../auth/AuthProvider.jsx', () => ({
  useAuth: () => ({
    profile: { display_name: 'Matteo Test' },
    session: { user: { email: 'matteo@demo.local' } },
    logout: mockLogout,
  }),
}));

// Sonda che mostra la rotta di destinazione e se è stato passato lo stato `openStorico`.
function RouteProbe() {
  const location = useLocation();
  return <div>NUOVA ANALISI {location.state?.openStorico ? 'STORICO' : 'FRESH'}</div>;
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nuova-analisi" element={<RouteProbe />} />
        <Route path="/impostazioni" element={<div>PAGINA IMPOSTAZIONI</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
  delete window.matchMedia;
});

describe('Home (landing immersiva)', () => {
  it('mostra il nome prodotto', () => {
    renderHome();
    expect(screen.getByText('FREEDOM TRADING SYSTEM')).toBeInTheDocument();
  });

  it('mostra sempre il disclaimer', () => {
    renderHome();
    expect(screen.getByText(/non è consulenza finanziaria/i)).toBeInTheDocument();
  });

  it('mostra i due CTA reali', () => {
    renderHome();
    expect(screen.getByRole('button', { name: 'Nuova analisi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Le mie analisi' })).toBeInTheDocument();
  });

  it('«Nuova analisi» apre la Chat (rotta /nuova-analisi) senza stato storico', () => {
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: 'Nuova analisi' }));
    expect(screen.getByText('NUOVA ANALISI FRESH')).toBeInTheDocument();
  });

  it('«Le mie analisi» apre la Chat passando lo stato openStorico', () => {
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: 'Le mie analisi' }));
    expect(screen.getByText('NUOVA ANALISI STORICO')).toBeInTheDocument();
  });

  it('«Impostazioni» porta alle impostazioni', () => {
    renderHome();
    fireEvent.click(screen.getByRole('link', { name: 'Impostazioni' }));
    expect(screen.getByText('PAGINA IMPOSTAZIONI')).toBeInTheDocument();
  });

  it('«Esci» chiama logout', () => {
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: 'Esci' }));
    expect(mockLogout).toHaveBeenCalled();
  });

  it('il wrapper forza il tema scuro anche senza .dark globale', () => {
    const { container } = renderHome();
    // La Home è sempre immersiva: il contenitore radice porta la classe `dark`.
    expect(container.querySelector('.dark')).not.toBeNull();
  });

  it('con prefers-reduced-motion lo sfondo è statico', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));
    const { container } = renderHome();
    expect(container.querySelector('[data-motion]')).toHaveAttribute('data-motion', 'static');
  });
});
