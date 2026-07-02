import { ActiveSessionCard } from '../components/home/ActiveSessionCard.jsx';
import { AnimatedTradingBackground } from '../components/home/AnimatedTradingBackground.jsx';
import { FeatureCards } from '../components/home/FeatureCards.jsx';
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
// pagine autenticate: l'hamburger apre lo stesso drawer condiviso anche qui sulla Home.
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

      <main className="relative z-10 flex flex-1 flex-col items-center gap-14 py-16">
        <Hero />

        {/* Sotto l'hero: prima l'azione reale (riprendi sessione, se esiste), poi la
            panoramica descrittiva dell'app. Card sessione = dati interni; feature = statiche. */}
        <div className="flex w-full max-w-5xl flex-col gap-8 px-6">
          <ActiveSessionCard onReprendi={storico.selectChat} />
          <FeatureCards />
        </div>
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
        deleteError={storico.deleteError}
        onSelectChat={storico.selectChat}
        onNuovaAnalisi={storico.nuovaAnalisi}
        onRenameChat={storico.renameChat}
        onDeleteChat={storico.deleteChat}
      />
    </div>
  );
}
