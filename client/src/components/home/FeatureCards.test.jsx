import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FeatureCards } from './FeatureCards.jsx';

function renderCards() {
  return render(
    <MemoryRouter>
      <FeatureCards />
    </MemoryRouter>,
  );
}

describe('FeatureCards', () => {
  it('mostra le 4 card della panoramica app', () => {
    renderCards();
    const section = screen.getByRole('region', { name: 'Cosa puoi fare' });
    expect(
      within(section).getByRole('heading', { name: 'Cosa puoi fare' }),
    ).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Analisi assistita' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Memoria sessioni' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Journal' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Monitoraggio mercati' })).toBeInTheDocument();
  });

  it('la card Journal è un link verso /journal', () => {
    renderCards();
    const link = screen.getByRole('link', { name: /Journal/i });
    expect(link).toHaveAttribute('href', '/journal');
  });

  it('le altre card restano descrittive: un solo link (Journal)', () => {
    renderCards();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
