import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { applyTheme } from '../lib/theme.js';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = caricamento in corso
  const [profile, setProfile] = useState(null);

  const loadProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setProfile(data);
      // M6: applica il tema salvato dell'utente (null/errato → default dark). Segue l'utente ovunque.
      applyTheme(data?.theme);
    } catch {
      // Il profilo arricchisce la UI, ma un errore di rete non deve bloccare la sessione.
      setProfile(null);
      applyTheme();
    }
  }, []);

  // Ricarica il profilo dell'utente corrente (usato dopo un cambio tema in Impostazioni).
  async function reloadProfile() {
    if (session?.user) await loadProfile(session.user.id);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /*
    Le query Supabase non vanno eseguite dentro onAuthStateChange: possono bloccare le chiamate
    successive del client. Questo effetto parte solo dopo che il callback auth è terminato.
  */
  useEffect(() => {
    if (session === undefined) return;
    if (session?.user) {
      loadProfile(session.user.id);
    } else {
      setProfile(null);
      applyTheme();
    }
  }, [session, loadProfile]);

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ session, profile, logout, reloadProfile, loading: session === undefined }}
    >
      {children}
    </AuthContext.Provider>
  );
}
