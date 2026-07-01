import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Hero } from './Hero.jsx';

// Hero monta HomeCta (usa useNavigate): serve un Router.
function renderHero() {
  return render(
    <MemoryRouter>
      <Hero />
    </MemoryRouter>,
  );
}

describe('Hero', () => {
  it('mostra il badge del workspace', () => {
    renderHero();
    expect(screen.getByText(/Trading Intelligence Workspace/i)).toBeInTheDocument();
  });

  it('presenta il prodotto come agente di analisi tecnica', () => {
    renderHero();
    expect(
      screen.getByRole('heading', { name: 'Il tuo agente di analisi tecnica' }),
    ).toBeInTheDocument();
    const productName = screen.getByText('FREEDOM TRADING SYSTEM');
    expect(productName.parentElement).toHaveTextContent(
      'Studia i mercati con FREEDOM TRADING SYSTEM.',
    );
    expect(productName).toHaveClass('text-freedom-accent');
  });

  it('rende il decoro a candele (decorativo, aria-hidden)', () => {
    const { container } = renderHero();
    expect(container.querySelector('svg.home-candle')).not.toBeNull();
  });

  it('mostra soltanto il CTA Nuova analisi', () => {
    renderHero();
    expect(screen.getByRole('button', { name: 'Nuova analisi' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Le mie analisi' })).toBeNull();
  });
});
