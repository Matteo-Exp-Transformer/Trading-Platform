import { useEffect, useState } from 'react';
import { listChats } from '../../lib/chatData.js';

// Carica la sessione PIÙ RECENTE dell'utente per la card "Riprendi sessione" della Home (FU-022).
// `listChats()` ritorna già le chat ordinate per `updated_at desc` e isolate per utente (RLS):
// prendiamo la prima. In caso di errore o nessuna chat → `session=null`, così la card
// semplicemente non compare (decisione 2026-07-01) senza mai rompere la Home.
export function useActiveSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const chats = await listChats();
        if (alive) setSession(chats?.[0] ?? null);
      } catch {
        if (alive) setSession(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { session, loading };
}
