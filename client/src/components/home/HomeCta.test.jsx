import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HomeCta } from './HomeCta.jsx';

function RouteProbe() {
  const location = useLocation();
  return <div>DEST {location.state?.openStorico ? 'STORICO' : 'FRESH'}</div>;
}

function renderCta() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomeCta />} />
        <Route path="/nuova-analisi" element={<RouteProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HomeCta', () => {
  it('mostra i due CTA', () => {
    renderCta();
    expect(screen.getByRole('button', { name: 'Nuova analisi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Le mie analisi' })).toBeInTheDocument();
  });

  it('«Nuova analisi» va alla Chat senza aprire lo storico', () => {
    renderCta();
    fireEvent.click(screen.getByRole('button', { name: 'Nuova analisi' }));
    expect(screen.getByText('DEST FRESH')).toBeInTheDocument();
  });

  it('«Le mie analisi» va alla Chat con lo stato openStorico', () => {
    renderCta();
    fireEvent.click(screen.getByRole('button', { name: 'Le mie analisi' }));
    expect(screen.getByText('DEST STORICO')).toBeInTheDocument();
  });
});
