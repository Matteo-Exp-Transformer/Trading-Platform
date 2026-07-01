import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';

const { mockLogout } = vi.hoisted(() => ({ mockLogout: vi.fn() }));

vi.mock('../../auth/AuthProvider.jsx', () => ({
  useAuth: () => ({ logout: mockLogout }),
}));

const chats = [
  { id: 'c1', title: 'BTC/USD - swing', updated_at: '2026-06-30T10:00:00Z' },
  { id: 'c2', title: 'Oro intraday', updated_at: '2026-06-29T10:00:00Z' },
];

function renderSidebar(props, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Sidebar
        onClose={vi.fn()}
        onSelectChat={vi.fn()}
        onRenameChat={vi.fn()}
        onNuovaAnalisi={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Sidebar', () => {
  it('non renderizza nulla quando è chiusa', () => {
    renderSidebar({ open: false, chats });
    expect(screen.queryByText('Menu')).not.toBeInTheDocument();
  });

  it('mostra lo storico ricevuto con titolo e data', () => {
    renderSidebar({ open: true, chats });
    expect(screen.getByText('BTC/USD - swing')).toBeInTheDocument();
    expect(screen.getByText('Oro intraday')).toBeInTheDocument();
    expect(screen.getByText('30/06/2026')).toBeInTheDocument();
  });

  it('usa un pannello opaco e distinto dal contenuto sottostante', () => {
    renderSidebar({ open: true, chats });
    expect(screen.getByRole('complementary', { name: 'Menu' })).toHaveClass(
      'sidebar-panel',
      'bg-surface',
    );
  });

  it('mostra lo stato vuoto', () => {
    renderSidebar({ open: true, chats: [] });
    expect(screen.getByText('Nessuna chat ancora.')).toBeInTheDocument();
  });

  it('apre una chat selezionata', () => {
    const onSelectChat = vi.fn();
    renderSidebar({ open: true, chats, onSelectChat });
    fireEvent.click(screen.getByText('BTC/USD - swing'));
    expect(onSelectChat).toHaveBeenCalledWith('c1');
  });

  it('avvia una nuova analisi dalla navigazione principale', () => {
    const onNuovaAnalisi = vi.fn();
    renderSidebar({ open: true, chats, onNuovaAnalisi });
    fireEvent.click(screen.getByRole('button', { name: /Nuova analisi/i }));
    expect(onNuovaAnalisi).toHaveBeenCalledOnce();
  });

  it('chiude il menu dal backdrop', () => {
    const onClose = vi.fn();
    const { container } = renderSidebar({ open: true, chats, onClose });
    fireEvent.click(container.querySelector('.bg-black\\/50'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('mostra Home e Impostazioni con le destinazioni corrette', () => {
    renderSidebar({ open: true, chats });
    expect(screen.getByRole('link', { name: /Home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Impostazioni/i })).toHaveAttribute(
      'href',
      '/impostazioni',
    );
  });

  it('evidenzia la destinazione corrente', () => {
    renderSidebar({ open: true, chats }, ['/impostazioni']);
    expect(screen.getByRole('link', { name: /Impostazioni/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('chiude il menu e riusa il logout esistente', () => {
    const onClose = vi.fn();
    renderSidebar({ open: true, chats, onClose });
    fireEvent.click(screen.getByRole('button', { name: /Esci/i }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it('rinomina una chat: la matita apre l’editing e Invio salva', () => {
    const onRenameChat = vi.fn();
    renderSidebar({ open: true, chats, onRenameChat });
    fireEvent.click(screen.getAllByLabelText('Rinomina chat')[0]);
    const input = screen.getByDisplayValue('BTC/USD - swing');
    fireEvent.change(input, { target: { value: 'Nuovo titolo' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRenameChat).toHaveBeenCalledWith('c1', 'Nuovo titolo');
  });

  it('mostra l’errore di rinomina', () => {
    renderSidebar({ open: true, chats, renameError: 'Rinomina non riuscita. Riprova.' });
    expect(screen.getByRole('alert')).toHaveTextContent('Rinomina non riuscita. Riprova.');
  });

  it('non salva se il titolo non cambia', () => {
    const onRenameChat = vi.fn();
    renderSidebar({ open: true, chats, onRenameChat });
    fireEvent.click(screen.getAllByLabelText('Rinomina chat')[0]);
    const input = screen.getByDisplayValue('BTC/USD - swing');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRenameChat).not.toHaveBeenCalled();
  });
});
