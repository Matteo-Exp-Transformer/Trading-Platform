import { AnimatedTradingBackground } from '../components/home/AnimatedTradingBackground.jsx';
import { Hero } from '../components/home/Hero.jsx';
import { MarketStatus } from '../components/home/MarketStatus.jsx';
import { AppHeader } from '../components/layout/AppHeader.jsx';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { useStorico } from '../components/layout/useStorico.js';

const DISCLAIMER =
  "Strumento di supporto all'analisi tecnica. Non è consulenza finanziaria.";

// Home = landing dopo il login (rotta «/»). È SEMPRE scura e immersiva: il wrapper forza la
// classe `dark` — così i token slate+ciano valgono qui a prescindere dal toggle globale (M6),
// senza toccare il toggle dell'app. Header e Sidebar sono gli stessi condivisi con le altre
// pagine autenticate: l'hamburger e il CTA «Le mie analisi» aprono lo stesso drawer, qui sulla Home.
export default function Home() {
  const storico = useStorico();

  return (
    <div className="dark relative isolate flex min-h-screen flex-col overflow-x-hidden bg-app text-content">
      <AnimatedTradingBackground />

      <AppHeader
        onOpenSidebar={storico.openSidebar}
        className="relative z-10"
        right={<MarketStatus />}
      />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center py-16">
        <Hero onOpenStorico={storico.openSidebar} />
      </main>

      <footer
        role="contentinfo"
        className="relative z-10 border-t border-line/60 px-6 py-3 text-center text-xs text-muted"
      >
        {DISCLAIMER}
      </footer>

      <Sidebar
        open={storico.open}
        onClose={storico.closeSidebar}
        chats={storico.chats}
        loading={storico.loading}
        error={storico.error}
        renameError={storico.renameError}
        onSelectChat={storico.selectChat}
        onNuovaAnalisi={storico.nuovaAnalisi}
        onRenameChat={storico.renameChat}
      />
    </div>
  );
}
