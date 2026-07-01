# Autenticazione e isolamento utente — contesto operativo

> Aggiornato: 2026-07-02. Zona deep: Auth, JWT, RLS, profilo e segreti.
> Decisioni prodotto: `docs/CONTESTO_PRODOTTO.md` L2/L11/L15–L17.
> Schema e policy: `../aree/DB_SUPABASE_SKILL.md`.

## 1. Flusso reale

- Login email+password in `client/src/pages/Login.jsx`.
- Nessuna UI di registrazione; gli account demo vengono creati manualmente.
- `AuthProvider.jsx` inizializza la sessione con `getSession`, ascolta `onAuthStateChange`, carica
  `profiles` in un effetto separato e applica il tema.
- `ProtectedRoute.jsx` protegge Home, Chat, Impostazioni e ogni nuova pagina autenticata.
- Login riuscito → `/` (Home); logout dalla Sidebar → sessione chiusa → `/login`.
- La sessione è persistita/rinnovata da `supabase-js`.
- Client: URL + anon/publishable key. Service role e chiave Gemini restano server-side.

## 2. Decisioni attive

| Tema | Stato voluto |
|------|--------------|
| Login | email + password |
| Account | creati a mano; niente registrazione aperta |
| Conferma email | disattivata nella demo |
| Profilo | `profiles`: nome, tema, modello admin-only |
| Sessione | persistente fino a «Esci» |
| Recupero password | manuale admin; self-service dopo intervista |
| Cambio password | Impostazioni, con riverifica della password attuale |

## 3. File reali

| File | Ruolo |
|------|-------|
| `client/src/lib/supabaseClient.js` | singleton browser con `VITE_SUPABASE_*` |
| `client/src/auth/AuthProvider.jsx` | sessione, profilo, tema, logout/reload |
| `client/src/auth/ProtectedRoute.jsx` | redirect non autenticati |
| `client/src/pages/Login.jsx` | accesso |
| `client/src/App.jsx` | rotte pubbliche/protette |
| `server/src/lib/supabaseAdmin.js` | service role per admin/test, non per route utente |
| `server/src/routes/agent.js` | client per-richiesta vincolato al JWT |
| `server/test/auth-rls.test.js` | isolamento live `profiles` |

## 4. LOCK

```
LOCK  service_role e GOOGLE_API_KEY solo server; mai client, log o file tracciati.
LOCK  dati owner-only tramite RLS; non fidarsi di filtri applicativi come unica barriera.
RULE  la anon/publishable key è pubblica per design; la sicurezza è RLS + privilegi.
RULE  niente service_role nelle route utente.
RULE  niente registrazione aperta nella demo.
RULE  query profilo fuori dal callback onAuthStateChange.
RULE  errore profilo non invalida una sessione valida; applica tema default e mostra stato gestito.
RULE  disclaimer visibile in ogni schermata.
```

## 5. Schema/provisioning noto

`profiles.id` riferisce `auth.users(id) on delete cascade`. Il trigger `handle_new_user` crea la
riga profilo usando il `display_name` del metadata soltanto come dato visuale, mai per autorizzare.
RLS limita SELECT/UPDATE all'id dell'utente; i privilegi di colonna impediscono al client di
scrivere `ai_model`.

Il SQL non è ancora versionato nella repository: per modifiche usare il workflow/baseline di
`DB_SUPABASE_SKILL.md`, non copiare vecchi snippet dai report.

## 6. Gap correnti (audit 2026-07-02)

- **Disclaimer:** `Login.jsx` e `Settings.jsx` non lo rendono, in violazione del LOCK globale.
- **Bootstrap auth:** reject o hang di `getSession()` non impostano uno stato errore; LoginRoute e
  ProtectedRoute possono restare vuote senza retry.
- **Invite-only non verificabile dal repo:** l'assenza della UI signup non prova che
  `supabase.auth.signUp()` sia disabilitato sul progetto remoto. Manca config versionata/test negativo.
- **Modello admin-only:** il privilegio è documentato ma manca un test RLS live che provi il rifiuto.
- **Test remoto:** usa email fisse e non ha un guard sul project ref; non eseguirlo senza conferma
  dell'ambiente.

## 7. Verifica minima

- login corretto/errato/rete;
- sessione persistente e logout;
- redirect di ogni rotta protetta;
- errore/hang bootstrap con UI di riprova;
- due utenti leggono soltanto il proprio profilo;
- signup pubblico rifiutato;
- utente non può aggiornare `ai_model`;
- disclaimer presente su Login e su tutte le pagine.

Per test RLS remoti seguire `../aree/TESTING_SKILL.md`.
