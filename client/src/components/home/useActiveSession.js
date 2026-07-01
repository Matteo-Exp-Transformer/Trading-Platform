import { useEffect, useState } from 'react';
import { listChats, loadMessages } from '../../lib/chatData.js';
import { followUpLimitReached } from '../../lib/followUp.js';

// Carica la sessione PIÙ RECENTE dell'utente per la card "Riprendi sessione" della Home (FU-022).
// `listChats()` ritorna già le chat ordinate per `updated_at desc` e isolate per utente (RLS):
// prendiamo la prima. In caso di errore o nessuna chat → `session=null`, così la card
// semplicemente non compare (decisione 2026-07-01) senza mai rompere la Home.
//
// `limitReached`: la sessione ha esaurito i follow-up (lib/followUp.js). Serve alla card per
// cambiare titolo in "Apri ultima sessione" (non più riprendibile con nuovi approfondimenti).
// Se i messaggi non si leggono → `false` (default "Riprendi"): mai bloccare la Home.
export function useActiveSession() {
  const [session, setSession] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const chats = await listChats();
        const latest = chats?.[0] ?? null;
        if (!alive) return;
        setSession(latest);
        if (latest) {
          try {
            const messages = await loadMessages(latest.id);
            if (alive) setLimitReached(followUpLimitReached(messages));
          } catch {
            if (alive) setLimitReached(false);
          }
        }
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

  return { session, limitReached, loading };
}
