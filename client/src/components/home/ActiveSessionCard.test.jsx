import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActiveSessionCard } from './ActiveSessionCard.jsx';

// La card usa `useActiveSession`, che chiama `listChats()` e `loadMessages()`: mockiamo la sorgente
// dati così il test esercita anche l'hook senza toccare Supabase.
vi.mock('../../lib/chatData.js', () => ({ listChats: vi.fn(), loadMessages: vi.fn() }));
import { listChats, loadMessages } from '../../lib/chatData.js';

describe('ActiveSessionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: sessione con soli 2 messaggi (analisi + 1 risposta) → limite non raggiunto.
    loadMessages.mockResolvedValue([
      { role: 'user', content: 'analisi' },
      { role: 'assistant', content: 'r' },
    ]);
  });

  it('mostra la sessione più recente e la riapre al click', async () => {
    listChats.mockResolvedValue([
      {
        id: 'chat-1',
        title: 'Oro XAU/USD · Analisi completa',
        updated_at: new Date().toISOString(),
        form_context: { asset: 'Oro XAU/USD' },
      },
    ]);
    const onReprendi = vi.fn();
    render(<ActiveSessionCard onReprendi={onReprendi} />);

    const button = await screen.findByRole('button', { name: /Riprendi sessione/i });
    expect(button).toHaveTextContent('Oro XAU/USD · Analisi completa');
    expect(button).toHaveTextContent('Oro XAU/USD');
    expect(button).toHaveTextContent(/aggiornata oggi/i);

    fireEvent.click(button);
    expect(onReprendi).toHaveBeenCalledWith('chat-1');
  });

  it('mostra "Apri ultima sessione" quando l’ultima sessione ha esaurito i follow-up', async () => {
    listChats.mockResolvedValue([
      {
        id: 'chat-1',
        title: 'Oro XAU/USD · Analisi completa',
        updated_at: new Date().toISOString(),
        form_context: { asset: 'Oro XAU/USD' },
      },
    ]);
    // 1 analisi + 5 follow-up = 6 messaggi utente → limite raggiunto.
    loadMessages.mockResolvedValue([
      { role: 'user', content: 'analisi' },
      { role: 'user', content: 'fu1' },
      { role: 'user', content: 'fu2' },
      { role: 'user', content: 'fu3' },
      { role: 'user', content: 'fu4' },
      { role: 'user', content: 'fu5' },
    ]);
    const onReprendi = vi.fn();
    render(<ActiveSessionCard onReprendi={onReprendi} />);

    const button = await screen.findByRole('button', { name: /Apri ultima sessione/i });
    expect(button).toHaveTextContent('Oro XAU/USD · Analisi completa');
    fireEvent.click(button);
    expect(onReprendi).toHaveBeenCalledWith('chat-1');
  });

  it('resta "Riprendi sessione" se la lettura dei messaggi fallisce (mai blocca)', async () => {
    listChats.mockResolvedValue([
      { id: 'chat-1', title: 'Sessione', updated_at: new Date().toISOString(), form_context: {} },
    ]);
    loadMessages.mockRejectedValue(new Error('boom'));
    render(<ActiveSessionCard onReprendi={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /Riprendi sessione/i })).toBeInTheDocument();
  });

  it('non compare se non ci sono sessioni', async () => {
    listChats.mockResolvedValue([]);
    render(<ActiveSessionCard onReprendi={vi.fn()} />);

    await waitFor(() => expect(listChats).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /Riprendi sessione/i })).toBeNull();
  });

  it('non compare (né rompe) se il caricamento fallisce', async () => {
    listChats.mockRejectedValue(new Error('boom'));
    render(<ActiveSessionCard onReprendi={vi.fn()} />);

    await waitFor(() => expect(listChats).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /Riprendi sessione/i })).toBeNull();
  });
});
