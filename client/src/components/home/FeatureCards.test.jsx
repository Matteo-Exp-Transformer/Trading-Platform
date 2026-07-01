import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { FeatureCards } from './FeatureCards.jsx';

describe('FeatureCards', () => {
  it('mostra le 4 card della panoramica app', () => {
    render(<FeatureCards />);
    const section = screen.getByRole('region', { name: /Panoramica dell'app/i });
    expect(within(section).getByRole('heading', { name: 'Analisi assistita' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Memoria sessioni' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Journal' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Monitoraggio mercati' })).toBeInTheDocument();
  });

  it('sono descrittive: nessun link/bottone di navigazione', () => {
    render(<FeatureCards />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
