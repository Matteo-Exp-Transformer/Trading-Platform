// Guscio dell'app (M0). È solo lo scheletro buildabile: le schermate reali
// (Login, Chat, Sidebar, Impostazioni) arrivano dai milestone M1–M7.
// Il disclaimer è sempre visibile (RULE di prodotto — vedi Bussola §RULE globali).

const DISCLAIMER =
  'Strumento di supporto all’analisi tecnica. Non è consulenza finanziaria.';

export default function App() {
  return (
    <div className="min-h-screen bg-freedom-bg text-white flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-3xl font-bold text-freedom-accent">FREEDOM TRADING SYSTEM</h1>
        <p className="text-white/70 max-w-md">
          Fondamenta pronte. Le schermate (Login, Chat di analisi, Storico, Impostazioni)
          si costruiscono nei prossimi milestone.
        </p>
      </main>
      <footer
        role="contentinfo"
        className="border-t border-white/10 px-6 py-3 text-xs text-white/60 text-center"
      >
        {DISCLAIMER}
      </footer>
    </div>
  );
}
