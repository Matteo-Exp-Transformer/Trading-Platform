import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HomeCta } from './HomeCta.jsx';

function renderCta() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomeCta />} />
        <Route path="/nuova-analisi" element={<div>NUOVA ANALISI</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HomeCta', () => {
  it('mostra soltanto Nuova analisi', () => {
    renderCta();
    expect(screen.getByRole('button', { name: 'Nuova analisi' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Le mie analisi' })).toBeNull();
  });

  it('porta alla pagina Nuova analisi', () => {
    renderCta();
    fireEvent.click(screen.getByRole('button', { name: 'Nuova analisi' }));
    expect(screen.getByText('NUOVA ANALISI')).toBeInTheDocument();
  });

});
