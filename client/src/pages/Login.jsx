import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrore('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrore('Email o password non validi. Riprova.');
      }
      // Se ok: onAuthStateChange aggiorna la sessione → LoginRoute in App.jsx redireziona a /
    } catch {
      setErrore('Rete non raggiungibile. Riprova tra poco.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-app text-content flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <h1 className="text-2xl font-bold text-freedom-accent text-center">
            FREEDOM TRADING SYSTEM
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm text-muted">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-surface-strong border border-line rounded-xl px-3 py-2 text-content placeholder:text-faint focus:outline-none focus:border-freedom-accent"
                placeholder="email@esempio.com"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm text-muted">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-surface-strong border border-line rounded-xl px-3 py-2 text-content placeholder:text-faint focus:outline-none focus:border-freedom-accent"
                placeholder="••••••••"
              />
            </div>

            {errore && (
              <p role="alert" className="text-red-600 dark:text-red-400 text-sm">
                {errore}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-freedom-accent text-slate-950 font-semibold py-2 rounded-2xl hover:bg-freedom-accentHover disabled:opacity-50 transition-colors"
            >
              {loading ? 'Accesso in corso…' : 'Accedi'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
