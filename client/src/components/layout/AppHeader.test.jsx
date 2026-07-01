import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppHeader } from './AppHeader.jsx';

function renderHeader(onOpenSidebar = vi.fn()) {
  render(
    <MemoryRouter>
      <AppHeader onOpenSidebar={onOpenSidebar} />
    </MemoryRouter>,
  );
  return onOpenSidebar;
}

describe('AppHeader', () => {
  it('apre il menu dall’hamburger', () => {
    const onOpenSidebar = renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Apri menu' }));
    expect(onOpenSidebar).toHaveBeenCalledOnce();
  });

  it('rende il nome prodotto un collegamento alla Home senza azioni account', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: 'FREEDOM TRADING SYSTEM' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.queryByText('Impostazioni')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Esci' })).not.toBeInTheDocument();
  });

  it('senza slot destro non mostra contenuti extra', () => {
    renderHeader();
    expect(screen.queryByTestId('header-right')).not.toBeInTheDocument();
  });

  it('rende lo slot destro quando fornito (es. stato mercati in Home)', () => {
    render(
      <MemoryRouter>
        <AppHeader onOpenSidebar={vi.fn()} right={<span data-testid="header-right">STATO</span>} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('header-right')).toBeInTheDocument();
  });
});
