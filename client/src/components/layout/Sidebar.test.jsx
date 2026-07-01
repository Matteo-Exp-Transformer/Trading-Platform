import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar.jsx';

const chats = [
  { id: 'c1', title: 'BTC/USD - swing', updated_at: '2026-06-30T10:00:00Z' },
  { id: 'c2', title: 'Oro intraday', updated_at: '2026-06-29T10:00:00Z' },
];

describe('Sidebar', () => {
  it('non renderizza nulla quando chiusa', () => {
    render(<Sidebar open={false} chats={chats} onClose={vi.fn()} onSelectChat={vi.fn()} onRenameChat={vi.fn()} onNuovaChat={vi.fn()} />);
    expect(screen.queryByText('Storico chat')).not.toBeInTheDocument();
  });

  it('mostra le chat ordinate ricevute, con titolo e data', () => {
    render(<Sidebar open chats={chats} onClose={vi.fn()} onSelectChat={vi.fn()} onRenameChat={vi.fn()} onNuovaChat={vi.fn()} />);
    expect(screen.getByText('BTC/USD - swing')).toBeInTheDocument();
    expect(screen.getByText('Oro intraday')).toBeInTheDocument();
    expect(screen.getByText('30/06/2026')).toBeInTheDocument();
  });

  it('mostra il messaggio di lista vuota', () => {
    render(<Sidebar open chats={[]} onClose={vi.fn()} onSelectChat={vi.fn()} onRenameChat={vi.fn()} onNuovaChat={vi.fn()} />);
    expect(screen.getByText('Nessuna chat ancora.')).toBeInTheDocument();
  });

  it('chiama onSelectChat al click su una riga', () => {
    const onSelectChat = vi.fn();
    render(<Sidebar open chats={chats} onClose={vi.fn()} onSelectChat={onSelectChat} onRenameChat={vi.fn()} onNuovaChat={vi.fn()} />);
    fireEvent.click(screen.getByText('BTC/USD - swing'));
    expect(onSelectChat).toHaveBeenCalledWith('c1');
  });

  it('chiama onNuovaChat al click sul bottone nuova chat', () => {
    const onNuovaChat = vi.fn();
    render(<Sidebar open chats={chats} onClose={vi.fn()} onSelectChat={vi.fn()} onRenameChat={vi.fn()} onNuovaChat={onNuovaChat} />);
    fireEvent.click(screen.getByText('+ Nuova chat'));
    expect(onNuovaChat).toHaveBeenCalled();
  });

  it('chiama onClose al click sul backdrop', () => {
    const onClose = vi.fn();
    const { container } = render(<Sidebar open chats={chats} onClose={onClose} onSelectChat={vi.fn()} onRenameChat={vi.fn()} onNuovaChat={vi.fn()} />);
    fireEvent.click(container.querySelector('[aria-hidden="true"]'));
    expect(onClose).toHaveBeenCalled();
  });

  it('rinomina una chat: icona matita apre editing, invio salva', () => {
    const onRenameChat = vi.fn();
    render(<Sidebar open chats={chats} onClose={vi.fn()} onSelectChat={vi.fn()} onRenameChat={onRenameChat} onNuovaChat={vi.fn()} />);
    fireEvent.click(screen.getAllByLabelText('Rinomina chat')[0]);
    const input = screen.getByDisplayValue('BTC/USD - swing');
    fireEvent.change(input, { target: { value: 'Nuovo titolo' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRenameChat).toHaveBeenCalledWith('c1', 'Nuovo titolo');
  });

  it('mostra il banner di errore rinomina quando renameError è valorizzato', () => {
    render(<Sidebar open chats={chats} renameError="Rinomina non riuscita. Riprova." onClose={vi.fn()} onSelectChat={vi.fn()} onRenameChat={vi.fn()} onNuovaChat={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Rinomina non riuscita. Riprova.');
  });

  it('non chiama onRenameChat se il titolo non cambia', () => {
    const onRenameChat = vi.fn();
    render(<Sidebar open chats={chats} onClose={vi.fn()} onSelectChat={vi.fn()} onRenameChat={onRenameChat} onNuovaChat={vi.fn()} />);
    fireEvent.click(screen.getAllByLabelText('Rinomina chat')[0]);
    const input = screen.getByDisplayValue('BTC/USD - swing');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRenameChat).not.toHaveBeenCalled();
  });
});
