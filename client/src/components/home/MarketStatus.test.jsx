import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MarketStatus } from './MarketStatus.jsx';

describe('MarketStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mostra le tre piazze come gruppo accessibile', () => {
    // Mercoledì, 15:00Z: Londra e New York aperte, Tokyo chiusa.
    vi.setSystemTime(new Date('2026-01-14T15:00:00Z'));
    render(<MarketStatus />);

    const group = screen.getByRole('group', { name: 'Stato mercati' });
    expect(within(group).getByText('Londra')).toBeInTheDocument();
    expect(within(group).getByText('New York')).toBeInTheDocument();
    expect(within(group).getByText('Tokyo')).toBeInTheDocument();
  });

  it('dice a parole quali mercati sono aperti/chiusi', () => {
    vi.setSystemTime(new Date('2026-01-14T15:00:00Z'));
    render(<MarketStatus />);

    expect(screen.getAllByText('aperto')).toHaveLength(2); // Londra + New York
    expect(screen.getAllByText('chiuso')).toHaveLength(1); // Tokyo
  });
});
