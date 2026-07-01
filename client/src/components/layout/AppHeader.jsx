import { Link } from 'react-router-dom';

// Header condiviso delle pagine autenticate (Home · Nuova analisi · Impostazioni).
// A sinistra: hamburger che apre la Sidebar + nome prodotto cliccabile che riporta sempre
// alla Home («/»). Nessuna icona decorativa; nessun bottone Impostazioni/Esci a destra:
// quelle azioni vivono solo nella Sidebar. `className` permette alle pagine di adattare
// bordo/contesto (es. header immersivo della Home) senza duplicare il markup.
// `right` è uno slot opzionale: la Home ci mette lo stato mercati (FU-018). Su desktop sta a
// destra sulla stessa riga; su mobile va SOPRA il nome prodotto (header impilato) per sfruttare
// lo spazio orizzontale. Le altre pagine non lo passano e l'header resta a riga singola.
export function AppHeader({ onOpenSidebar, className = '', right = null }) {
  return (
    <header className={`flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:gap-3 ${className}`}>
      <div className="flex items-center gap-3 order-2 sm:order-1">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Apri menu"
          className="rounded text-muted transition-colors hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-freedom-accent"
        >
          ☰
        </button>
        <Link
          to="/"
          className="whitespace-nowrap rounded text-sm font-bold tracking-tight text-freedom-accent transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-freedom-accent sm:text-base"
        >
          FREEDOM TRADING SYSTEM
        </Link>
      </div>
      {right && <div className="order-1 sm:order-2 sm:ml-auto">{right}</div>}
    </header>
  );
}
