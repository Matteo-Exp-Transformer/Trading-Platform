import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatPanel } from './ChatPanel.jsx';

const baseProps = {
  messages: [],
  onSendMessage: vi.fn(),
  loading: false,
  error: null,
};

describe('ChatPanel — stato di attesa', () => {
  it('mostra l’indicatore "sta analizzando" quando analyzing', () => {
    render(<ChatPanel {...baseProps} analyzing analysisError={null} />);
    expect(screen.getByText(/sta analizzando/i)).toBeInTheDocument();
  });

  it('disabilita l’input mentre analizza', () => {
    render(<ChatPanel {...baseProps} analyzing analysisError={null} />);
    expect(screen.getByPlaceholderText(/sta analizzando/i)).toBeDisabled();
  });

  it('mostra il messaggio di errore di analisi (mai crash a vista)', () => {
    render(
      <ChatPanel {...baseProps} analyzing={false} analysisError="L'agente non è raggiungibile." />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/non è raggiungibile/i);
  });

  it('input attivo quando non sta analizzando', () => {
    render(<ChatPanel {...baseProps} analyzing={false} analysisError={null} />);
    expect(screen.getByPlaceholderText(/scrivi un messaggio/i)).not.toBeDisabled();
  });
});

describe('ChatPanel — limite follow-up', () => {
  it('blocca la scrittura e avvisa quando il limite è raggiunto', () => {
    render(<ChatPanel {...baseProps} analyzing={false} analysisError={null} limitReached />);
    expect(screen.getByPlaceholderText(/limite di approfondimenti raggiunto/i)).toBeDisabled();
    expect(screen.getByText(/hai raggiunto il limite di approfondimenti/i)).toBeInTheDocument();
  });

  it('non mostra l’avviso quando il limite non è raggiunto', () => {
    render(<ChatPanel {...baseProps} analyzing={false} analysisError={null} />);
    expect(screen.queryByText(/hai raggiunto il limite di approfondimenti/i)).not.toBeInTheDocument();
  });
});

describe('ChatPanel — streaming (M5)', () => {
  it('mostra la prosa in arrivo e nasconde "sta analizzando" appena c’è testo', () => {
    render(
      <ChatPanel {...baseProps} analyzing analysisError={null} streamingText="Analisi in corso" />,
    );
    expect(screen.getByText(/Analisi in corso/)).toBeInTheDocument();
    expect(screen.queryByText(/sta analizzando/i)).not.toBeInTheDocument();
  });

  it('con streamingText vuoto mostra ancora "sta analizzando"', () => {
    render(<ChatPanel {...baseProps} analyzing analysisError={null} streamingText="" />);
    expect(screen.getByText(/sta analizzando/i)).toBeInTheDocument();
  });

  it('mostra il testo parziale + avviso su interruzione (non sta più analizzando)', () => {
    render(
      <ChatPanel
        {...baseProps}
        analyzing={false}
        analysisError="Risposta interrotta. Riprova."
        streamingText="Prima parte del testo"
      />,
    );
    expect(screen.getByText(/Prima parte del testo/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/interrotta/i);
  });
});
