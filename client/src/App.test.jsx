// Test d'esempio del client: l'app mostra il titolo e il disclaimer obbligatorio.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.jsx';

describe('<App />', () => {
  it('mostra il titolo del prodotto', () => {
    render(<App />);
    expect(screen.getByText('FREEDOM TRADING SYSTEM')).toBeInTheDocument();
  });

  it('mostra sempre il disclaimer (non è consulenza finanziaria)', () => {
    render(<App />);
    expect(screen.getByText(/non è consulenza finanziaria/i)).toBeInTheDocument();
  });
});
