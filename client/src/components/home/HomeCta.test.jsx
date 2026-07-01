import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HomeCta } from './HomeCta.jsx';

function renderCta(onOpenStorico = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomeCta onOpenStorico={onOpenStorico} />} />
        <Route path="/nuova-analisi" element={<div>NUOVA ANALISI</div>} />
      </Routes>
    </MemoryRouter>,
  );
  return onOpenStorico;
}

describe('HomeCta', () => {
  it('mostra i due CTA', () => {
    renderCta();
    expect(screen.getByRole('button', { name: 'Nuova analisi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Le mie analisi' })).toBeInTheDocument();
  });

  it('porta alla pagina Nuova analisi', () => {
    renderCta();
    fireEvent.click(screen.getByRole('button', { name: 'Nuova analisi' }));
    expect(screen.getByText('NUOVA ANALISI')).toBeInTheDocument();
  });

  it('apre lo storico direttamente sulla Home', () => {
    const onOpenStorico = renderCta();
    fireEvent.click(screen.getByRole('button', { name: 'Le mie analisi' }));
    expect(onOpenStorico).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Nuova analisi' })).toBeInTheDocument();
  });
});
