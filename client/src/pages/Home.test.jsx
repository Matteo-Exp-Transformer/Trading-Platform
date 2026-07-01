import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Home from './Home.jsx';

const { mockLogout, mockListChats } = vi.hoisted(() => ({
  mockLogout: vi.fn(),
  mockListChats: vi.fn(),
}));

vi.mock('../auth/AuthProvider.jsx', () => ({
  useAuth: () => ({
    profile: { display_name: 'Matteo Test' },
    session: { user: { email: 'matteo@demo.local' } },
    logout: mockLogout,
  }),
}));

vi.mock('../lib/chatData.js', () => ({
  listChats: mockListChats,
  updateChatTitle: vi.fn(),
}));

vi.mock('../components/home/AnimatedTradingBackground.jsx', () => ({
  AnimatedTradingBackground: () => <div data-motion="static" />,
}));

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nuova-analisi" element={<div>PAGINA NUOVA ANALISI</div>} />
        <Route path="/impostazioni" element={<div>PAGINA IMPOSTAZIONI</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListChats.mockResolvedValue([
    { id: 'c1', title: 'Analisi BTC', updated_at: '2026-07-01T10:00:00Z' },
  ]);
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: true,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
});

afterEach(() => {
  delete window.matchMedia;
});

describe('Home (landing immersiva)', () => {
  it('mostra hamburger e nome prodotto cliccabile verso la Home', () => {
    renderHome();
    expect(screen.getByRole('button', { name: 'Apri menu' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'FREEDOM TRADING SYSTEM' })).toHaveAttribute('href', '/');
  });

  it('non mostra azioni account nell’header', () => {
    renderHome();
    expect(screen.queryByText('Impostazioni')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Esci' })).not.toBeInTheDocument();
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

  it('porta alla pagina Nuova analisi', () => {
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: 'Nuova analisi' }));
    expect(screen.getByText('PAGINA NUOVA ANALISI')).toBeInTheDocument();
  });

  it('apre lo storico direttamente sulla Home dal CTA', async () => {
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: 'Le mie analisi' }));
    await waitFor(() => {
      expect(screen.getByRole('complementary', { name: 'Menu' })).toBeInTheDocument();
    });
    expect(screen.getByText('Analisi BTC')).toBeInTheDocument();
    expect(mockListChats).toHaveBeenCalledOnce();
  });

  it('apre lo stesso menu dall’hamburger', async () => {
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: 'Apri menu' }));
    await waitFor(() => {
      expect(screen.getByRole('complementary', { name: 'Menu' })).toBeInTheDocument();
    });
    expect(mockListChats).toHaveBeenCalledOnce();
  });

  it('raggiunge Impostazioni soltanto dal menu', async () => {
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: 'Apri menu' }));
    const link = await screen.findByRole('link', { name: /Impostazioni/i });
    fireEvent.click(link);
    expect(screen.getByText('PAGINA IMPOSTAZIONI')).toBeInTheDocument();
  });

  it('esegue il logout soltanto dal menu', async () => {
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: 'Apri menu' }));
    fireEvent.click(await screen.findByRole('button', { name: /Esci/i }));
    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it('forza il tema scuro anche senza .dark globale', () => {
    const { container } = renderHome();
    expect(container.querySelector('.dark')).not.toBeNull();
  });

  it('con prefers-reduced-motion rende statico lo sfondo', () => {
    const { container } = renderHome();
    expect(container.querySelector('[data-motion]')).toHaveAttribute('data-motion', 'static');
  });
});
