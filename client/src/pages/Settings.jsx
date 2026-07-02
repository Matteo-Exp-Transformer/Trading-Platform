import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { applyTheme, saveTheme, normalizeTheme } from '../lib/theme.js';
import { AppHeader } from '../components/layout/AppHeader.jsx';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { useStorico } from '../components/layout/useStorico.js';

// Lunghezza minima password (allineata al default Supabase). Controllo lato client per un
// messaggio immediato; il server resta l'autorità (l'errore server è comunque gestito).
const MIN_PASSWORD = 6;

export default function Settings() {
  const { session, profile, reloadProfile } = useAuth();
  const storico = useStorico();

  // --- Tema -------------------------------------------------------------------------------
  const [theme, setTheme] = useState(normalizeTheme(profile?.theme));
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeError, setThemeError] = useState(null);

  // Sincronizza il segmented col profilo quando arriva/cambia (es. dopo reload).
  useEffect(() => {
    setTheme(normalizeTheme(profile?.theme));
  }, [profile?.theme]);

  async function handleThemeChange(next) {
    if (next === theme || themeSaving) return;
    const previous = theme;
    setThemeError(null);
    setTheme(next); // ottimistico: il segmented si aggiorna subito
    applyTheme(next); // feedback visivo immediato
    setThemeSaving(true);
    try {
      await saveTheme(session.user.id, next);
      await reloadProfile();
    } catch (e) {
      // Rollback visivo: torna al tema precedente, mostra l'errore (mai crash a vista).
      setTheme(previous);
      applyTheme(previous);
      setThemeError(e?.message || 'Impossibile salvare il tema. Riprova.');
    } finally {
      setThemeSaving(false);
    }
  }

  // --- Cambio password --------------------------------------------------------------------
  const [attuale, setAttuale] = useState('');
  const [nuova, setNuova] = useState('');
  const [conferma, setConferma] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwOk, setPwOk] = useState(null);

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwError(null);
    setPwOk(null);

    if (nuova.length < MIN_PASSWORD) {
      setPwError(`La nuova password è troppo corta (almeno ${MIN_PASSWORD} caratteri).`);
      return;
    }
    if (nuova !== conferma) {
      setPwError('La nuova password e la conferma non coincidono.');
      return;
    }

    const email = session?.user?.email;
    if (!email) {
      setPwError('Sessione non valida. Esci e rientra.');
      return;
    }

    setPwLoading(true);
    try {
      // 1) Riverifica l'identità con la password ATTUALE prima di cambiarla.
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password: attuale,
      });
      if (signErr) {
        setPwError('Password attuale errata.');
        return;
      }
      // 2) Solo se la vecchia è corretta, aggiorna alla nuova.
      const { error: updErr } = await supabase.auth.updateUser({ password: nuova });
      if (updErr) {
        const m = (updErr.message || '').toLowerCase();
        if (m.includes('weak') || m.includes('short') || m.includes('password') || m.includes('char')) {
          setPwError('La nuova password non è abbastanza robusta. Scegline una più lunga.');
        } else if (m.includes('network') || m.includes('fetch')) {
          setPwError('Rete non raggiungibile. Riprova tra poco.');
        } else {
          setPwError('Impossibile cambiare la password ora. Riprova.');
        }
        return;
      }
      setPwOk('Password aggiornata. Al prossimo accesso usa quella nuova.');
      setAttuale('');
      setNuova('');
      setConferma('');
    } catch {
      setPwError('Rete non raggiungibile. Riprova tra poco.');
    } finally {
      setPwLoading(false);
    }
  }

  const segBtn = (active) =>
    `flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
      active
        ? 'bg-freedom-accent text-slate-950'
        : 'text-muted hover:text-content'
    }`;

  const inputCls =
    'bg-surface-strong border border-line rounded-xl px-3 py-2 ' +
    'text-content placeholder:text-faint ' +
    'focus:outline-none focus:border-freedom-accent';

  return (
    <div className="min-h-screen flex flex-col bg-app text-content">
      <AppHeader onOpenSidebar={storico.openSidebar} className="border-b border-line shrink-0" />

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="w-full max-w-md mx-auto flex flex-col gap-10">
          <h1 className="text-2xl font-semibold">Impostazioni</h1>

          {/* Tema */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Tema</h2>
            <p className="text-sm text-muted">
              Scegli l'aspetto dell'app. La preferenza ti segue su ogni dispositivo.
            </p>
            <div
              role="group"
              aria-label="Tema"
              className="flex gap-1 p-1 rounded-lg bg-surface"
            >
              <button
                type="button"
                aria-pressed={theme === 'light'}
                onClick={() => handleThemeChange('light')}
                className={segBtn(theme === 'light')}
              >
                Chiaro
              </button>
              <button
                type="button"
                aria-pressed={theme === 'dark'}
                onClick={() => handleThemeChange('dark')}
                className={segBtn(theme === 'dark')}
              >
                Scuro
              </button>
            </div>
            {themeError && (
              <p role="alert" className="text-red-600 dark:text-red-400 text-sm">
                {themeError}
              </p>
            )}
          </section>

          {/* Cambio password */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Cambia password</h2>
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="attuale" className="text-sm text-muted">
                  Password attuale
                </label>
                <input
                  id="attuale"
                  type="password"
                  value={attuale}
                  onChange={(e) => setAttuale(e.target.value)}
                  required
                  autoComplete="current-password"
                  className={inputCls}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="nuova" className="text-sm text-muted">
                  Nuova password
                </label>
                <input
                  id="nuova"
                  type="password"
                  value={nuova}
                  onChange={(e) => setNuova(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={inputCls}
                  placeholder="almeno 6 caratteri"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="conferma" className="text-sm text-muted">
                  Conferma nuova password
                </label>
                <input
                  id="conferma"
                  type="password"
                  value={conferma}
                  onChange={(e) => setConferma(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={inputCls}
                  placeholder="••••••••"
                />
              </div>

              {pwError && (
                <p role="alert" className="text-red-600 dark:text-red-400 text-sm">
                  {pwError}
                </p>
              )}
              {pwOk && (
                <p role="status" className="text-freedom-accent text-sm">
                  {pwOk}
                </p>
              )}

              <button
                type="submit"
                disabled={pwLoading}
                className="bg-freedom-accent text-slate-950 font-semibold py-2 rounded-2xl hover:bg-freedom-accentHover disabled:opacity-50 transition-colors"
              >
                {pwLoading ? 'Aggiornamento…' : 'Aggiorna password'}
              </button>
            </form>
          </section>
        </div>
      </main>

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
