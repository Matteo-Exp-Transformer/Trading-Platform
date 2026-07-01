import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';

const chats = [
  { id: 'c1', title: 'BTC/USD - swing', updated_at: '2026-06-30T10:00:00Z' },
  { id: 'c2', title: 'Oro intraday', updated_at: '2026-06-29T10:00:00Z' },
];

// La Sidebar contiene un <Link> (ingresso Impostazioni): serve un Router nei test.
function renderSidebar(props) {
  return render(
    <MemoryRouter>
      <Sidebar
        onClose={vi.fn()}
        onSelectChat={vi.fn()}
        onRenameChat={vi.fn()}
        onNuovaChat={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('Sidebar', () => {
  it('non renderizza nulla quando chiusa', () => {
    renderSidebar({ open: false, chats });
    expect(screen.queryByText('Storico chat')).not.toBeInTheDocument();
  });

  it('mostra le chat ordinate ricevute, con titolo e data', () => {
    renderSidebar({ open: true, chats });
    expect(screen.getByText('BTC/USD - swing')).toBeInTheDocument();
    expect(screen.getByText('Oro intraday')).toBeInTheDocument();
    expect(screen.getByText('30/06/2026')).toBeInTheDocument();
  });

  it('usa un pannello opaco e distinto dal contenuto sottostante', () => {
    renderSidebar({ open: true, chats });
    expect(screen.getByRole('complementary', { name: 'Storico chat' })).toHaveClass(
      'sidebar-panel',
      'bg-surface',
    );
  });

  it('mostra il messaggio di lista vuota', () => {
    renderSidebar({ open: true, chats: [] });
    expect(screen.getByText('Nessuna chat ancora.')).toBeInTheDocument();
  });

  it('chiama onSelectChat al click su una riga', () => {
    const onSelectChat = vi.fn();
    renderSidebar({ open: true, chats, onSelectChat });
    fireEvent.click(screen.getByText('BTC/USD - swing'));
    expect(onSelectChat).toHaveBeenCalledWith('c1');
  });

  it('chiama onNuovaChat al click sul bottone nuova chat', () => {
    const onNuovaChat = vi.fn();
    renderSidebar({ open: true, chats, onNuovaChat });
    fireEvent.click(screen.getByText('+ Nuova chat'));
    expect(onNuovaChat).toHaveBeenCalled();
  });

  it('chiama onClose al click sul backdrop', () => {
    const onClose = vi.fn();
    const { container } = renderSidebar({ open: true, chats, onClose });
    fireEvent.click(container.querySelector('[aria-hidden="true"]'));
    expect(onClose).toHaveBeenCalled();
  });

  it('mostra l’ingresso Impostazioni che punta a /impostazioni', () => {
    renderSidebar({ open: true, chats });
    const link = screen.getByRole('link', { name: /Impostazioni/i });
    expect(link).toHaveAttribute('href', '/impostazioni');
  });

  it('rinomina una chat: icona matita apre editing, invio salva', () => {
    const onRenameChat = vi.fn();
    renderSidebar({ open: true, chats, onRenameChat });
    fireEvent.click(screen.getAllByLabelText('Rinomina chat')[0]);
    const input = screen.getByDisplayValue('BTC/USD - swing');
    fireEvent.change(input, { target: { value: 'Nuovo titolo' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRenameChat).toHaveBeenCalledWith('c1', 'Nuovo titolo');
  });

  it('mostra il banner di errore rinomina quando renameError è valorizzato', () => {
    renderSidebar({ open: true, chats, renameError: 'Rinomina non riuscita. Riprova.' });
    expect(screen.getByRole('alert')).toHaveTextContent('Rinomina non riuscita. Riprova.');
  });

  it('non chiama onRenameChat se il titolo non cambia', () => {
    const onRenameChat = vi.fn();
    renderSidebar({ open: true, chats, onRenameChat });
    fireEvent.click(screen.getAllByLabelText('Rinomina chat')[0]);
    const input = screen.getByDisplayValue('BTC/USD - swing');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRenameChat).not.toHaveBeenCalled();
  });
});
