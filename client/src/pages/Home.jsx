import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
import { AnimatedTradingBackground } from '../components/home/AnimatedTradingBackground.jsx';
import { Hero } from '../components/home/Hero.jsx';

const DISCLAIMER =
  "Strumento di supporto all'analisi tecnica. Non è consulenza finanziaria.";

// Home = landing dopo il login (rotta «/»). È SEMPRE scura e immersiva: il wrapper forza la
// classe `dark` — così i token slate+ciano valgono qui a prescindere dal toggle globale (M6),
// senza toccare il toggle dell'app. È pura UI: nessun cambio ad auth, agente, DB o store.
export default function Home() {
  const { logout } = useAuth();

  return (
    <div className="dark relative isolate flex min-h-screen flex-col overflow-x-hidden bg-app text-content">
      <AnimatedTradingBackground />

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-freedom-accent/15"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-freedom-accent" fill="none">
              <line x1="8" y1="3" x2="8" y2="21" stroke="currentColor" strokeWidth="1.5" />
              <rect x="5" y="7" width="6" height="9" rx="1" fill="currentColor" />
              <line x1="16" y1="5" x2="16" y2="19" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              <rect x="13" y="9" width="6" height="7" rx="1" fill="currentColor" opacity="0.6" />
            </svg>
          </span>
          <span className="font-bold tracking-tight text-freedom-accent">FREEDOM TRADING SYSTEM</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            to="/impostazioni"
            className="rounded text-muted transition-colors hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-freedom-accent"
          >
            Impostazioni
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded text-muted transition-colors hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-freedom-accent"
          >
            Esci
          </button>
        </nav>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center py-16">
        <Hero />
      </main>

      <footer
        role="contentinfo"
        className="relative z-10 border-t border-line/60 px-6 py-3 text-center text-xs text-muted"
      >
        {DISCLAIMER}
      </footer>
    </div>
  );
}
