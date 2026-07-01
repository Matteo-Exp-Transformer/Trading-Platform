// theme.js — applica e persiste il tema UI (M6). Il tema vive sul profilo (colonna profiles.theme),
// così segue l'utente su OGNI dispositivo. Qui due responsabilità:
//  - applicare la classe `dark` su <html> (Tailwind darkMode:'class');
//  - salvare la scelta sulla PROPRIA riga profilo (RLS: solo la sua) e riapplicarla subito.
// La palette ricca (verde-scuro, sfondo animato) è M7: qui c'è solo lo switch, funzionante e persistito.

import { supabase } from './supabaseClient.js';

export const THEMES = ['dark', 'light'];
export const DEFAULT_THEME = 'dark';

// Normalizza un valore di tema (dal profilo, che può essere null o errato) a un tema valido.
export function normalizeTheme(theme) {
  return THEMES.includes(theme) ? theme : DEFAULT_THEME;
}

// Applica il tema al documento: aggiunge/toglie la classe `dark` su <html>. Idempotente.
// Robusto se `document` non è disponibile (test/SSR): non lancia mai. Ritorna il tema applicato.
export function applyTheme(theme) {
  const t = normalizeTheme(theme);
  const root = typeof document !== 'undefined' ? document.documentElement : null;
  if (root) {
    if (t === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }
  return t;
}

// Salva il tema sulla riga profilo dell'utente (RLS) e lo applica subito. Ritorna il tema salvato.
// Lancia con messaggio chiaro se l'update fallisce: il chiamante lo mostra a video (mai crash a vista).
export async function saveTheme(userId, theme) {
  const t = normalizeTheme(theme);
  const { error } = await supabase.from('profiles').update({ theme: t }).eq('id', userId);
  if (error) throw new Error('Impossibile salvare il tema. Riprova.');
  applyTheme(t);
  return t;
}
