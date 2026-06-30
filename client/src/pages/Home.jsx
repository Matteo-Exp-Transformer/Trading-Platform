// Guscio autenticato minimo (M1): profilo + «Esci». La Chat arriva con M2.
import { useAuth } from '../auth/AuthProvider.jsx';

const DISCLAIMER =
  "Strumento di supporto all'analisi tecnica. Non è consulenza finanziaria.";

export default function Home() {
  const { profile, session, logout } = useAuth();

  return (
    <div className="min-h-screen bg-freedom-bg text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <span className="font-bold text-freedom-accent">FREEDOM TRADING SYSTEM</span>
        <button
          onClick={logout}
          className="text-sm text-white/70 hover:text-white"
        >
          Esci
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-2">
        <p className="text-white/90 font-medium">
          {profile?.display_name ?? session?.user?.email}
        </p>
        <p className="text-white/50 text-sm">{session?.user?.email}</p>
        <p className="text-white/40 text-xs mt-6">La chat di analisi arriva con M2.</p>
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
