import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Hero } from './Hero.jsx';

// Hero monta HomeCta (usa useNavigate): serve un Router.
function renderHero(onOpenStorico = vi.fn()) {
  const view = render(
    <MemoryRouter>
      <Hero onOpenStorico={onOpenStorico} />
    </MemoryRouter>,
  );
  return { ...view, onOpenStorico };
}

describe('Hero', () => {
  it('mostra il badge del workspace', () => {
    renderHero();
    expect(screen.getByText(/Trading Intelligence Workspace/i)).toBeInTheDocument();
  });

  it('mostra il titolo grande', () => {
    renderHero();
    expect(screen.getByRole('heading', { name: /Analizza i mercati/i })).toBeInTheDocument();
  });

  it('rende il decoro a candele (decorativo, aria-hidden)', () => {
    const { container } = renderHero();
    expect(container.querySelector('svg.home-candle')).not.toBeNull();
  });

  it('mostra i CTA reali', () => {
    renderHero();
    expect(screen.getByRole('button', { name: 'Nuova analisi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Le mie analisi' })).toBeInTheDocument();
  });

  it('inoltra l’apertura dello storico al CTA', () => {
    const { onOpenStorico } = renderHero();
    fireEvent.click(screen.getByRole('button', { name: 'Le mie analisi' }));
    expect(onOpenStorico).toHaveBeenCalledOnce();
  });
});
