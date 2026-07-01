import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewAnalysisForm } from './NewAnalysisForm.jsx';

describe('NewAnalysisForm', () => {
  it('mostra il campo asset', () => {
    render(<NewAnalysisForm onSubmit={vi.fn()} loading={false} />);
    expect(screen.getByText(/quale asset/i)).toBeInTheDocument();
  });

  it('mostra le opzioni come operi', () => {
    render(<NewAnalysisForm onSubmit={vi.fn()} loading={false} />);
    expect(screen.getByText('Scalping')).toBeInTheDocument();
    expect(screen.getByText('Intraday')).toBeInTheDocument();
  });

  it('mostra le opzioni obiettivo', () => {
    render(<NewAnalysisForm onSubmit={vi.fn()} loading={false} />);
    expect(screen.getByText('Studiare')).toBeInTheDocument();
    expect(screen.getByText('Analisi completa')).toBeInTheDocument();
    expect(screen.getByText('Lettura operativa')).toBeInTheDocument();
  });

  it('mostra il bottone Avvia analisi', () => {
    render(<NewAnalysisForm onSubmit={vi.fn()} loading={false} />);
    expect(screen.getByRole('button', { name: /avvia analisi/i })).toBeInTheDocument();
  });

  it('mostra stato di caricamento', () => {
    render(<NewAnalysisForm onSubmit={vi.fn()} loading={true} />);
    expect(screen.getByText(/avvio in corso/i)).toBeInTheDocument();
  });

  it('mostra errori di validazione se submit senza campi obbligatori', () => {
    render(<NewAnalysisForm onSubmit={vi.fn()} loading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /avvia analisi/i }));
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  it('mostra i campi posizione quando Lettura operativa è selezionata', () => {
    render(<NewAnalysisForm onSubmit={vi.fn()} loading={false} />);
    fireEvent.click(screen.getByText('Lettura operativa'));
    fireEvent.click(screen.getByText('Sì'));
    expect(screen.getByText(/prezzo apertura/i)).toBeInTheDocument();
    expect(screen.getByText(/stop loss/i)).toBeInTheDocument();
  });

  it('non chiama onSubmit se validazione fallisce', () => {
    const onSubmit = vi.fn();
    render(<NewAnalysisForm onSubmit={onSubmit} loading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /avvia analisi/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
