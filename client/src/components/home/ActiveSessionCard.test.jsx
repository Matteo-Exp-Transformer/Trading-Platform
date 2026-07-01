import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActiveSessionCard } from './ActiveSessionCard.jsx';

// La card usa `useActiveSession`, che a sua volta chiama `listChats()`: mockiamo la sorgente
// dati così il test esercita anche l'hook senza toccare Supabase.
vi.mock('../../lib/chatData.js', () => ({ listChats: vi.fn() }));
import { listChats } from '../../lib/chatData.js';

describe('ActiveSessionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
