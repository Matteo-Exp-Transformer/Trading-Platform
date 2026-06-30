# Autenticazione & isolamento utente — file di contesto

> Mappa di dettaglio della zona **identità**: login, sessione, profilo utente e — soprattutto —
> l'**isolamento dei dati per utente (RLS)**. È la zona di **M1**. Zona **deep**: auth + RLS + segreti.
> Fonte di verità prodotto: `docs/CONTESTO_PRODOTTO.md` (L2, L11) · piano: `docs/PIANO_LAVORO.md` (M1).
>
> **Trigger di routing:** «login», «auth», «account», «password», «sessione», «profilo utente»,
> «isolamento», «RLS» → questo file.
> Aggiornato: 2026-06-30 (intervista M1, 2 giri). Codice da costruire: i path sono **previsti**.

---

## 1. Cos'è questa zona

La **porta d'ingresso** e il muro che tiene separati gli utenti. L'utente fa login con email +
password; resta loggato finché non preme «Esci». Ogni utente vede **solo** i propri dati. Niente
registrazione aperta: gli account si creano **a mano** (demo controllata). Il valore qui non è
visibile (è infrastruttura), ma è un **LOCK**: una falla nell'isolamento è il rischio #4 del prodotto.

## 2. Decisioni d'intervista (2026-06-30)

| Tema | Deciso | Note |
|------|--------|------|
| Metodo di login | **Email + password** | Niente magic link → nessun SMTP in demo |
| Creazione account | **A mano dal pannello Supabase** | Nessuna pagina di registrazione (meno superficie). Coerente con L11 |
| Conferma email | **Disattivata** (auto-confirm) | Email **finte/interne** ammesse (es. `matteo@demo.local`) |
| Profilo utente | **Email + nome visualizzato** | Serve tabella `profiles` (1 riga/utente) → primo banco di prova RLS |
| Sessione | **Resta loggato fino a «Esci»** | supabase-js persiste e rinnova il token; pulsante logout |
| Recupero password | **A mano** (lo reimposta l'admin) | Self-service = **FU-002**, dopo intervista cliente |
| Validazione email reale | **No in demo** | = **FU-003**, dopo intervista cliente |

## 3. File coinvolti (previsti — M1)

| File | Ruolo |
|------|-------|
| `client/src/lib/supabaseClient.js` | Singleton `@supabase/supabase-js` (chiave **anon/publishable**) |
| `client/src/auth/AuthProvider.jsx` | Stato sessione utente (`onAuthStateChange`), espone user/profilo/logout |
| `client/src/auth/ProtectedRoute.jsx` | Se non loggato → redirige a `/login` |
| `client/src/pages/Login.jsx` | Form email+password + disclaimer fisso |
| `client/src/App.jsx` · `main.jsx` | Router (`react-router-dom`) + rotte pubbliche/protette |
| `server/src/lib/supabaseAdmin.js` | Client **service_role** (SOLO server): admin + test |
| `server/test/auth-rls.test.js` | Test d'isolamento (il «fatto quando» di M1) |
| _migrazione DB_ | `profiles` + RLS + trigger (via MCP Supabase `apply_migration`) |

> **Progetto Supabase:** `eezybdmdtlehcvwobhgc` (confermato in intervista, vuoto). Le migrazioni di
> M1 vanno **solo** qui: in sessione risultano collegati anche altri 2 server Supabase non nostri.

## 4. Invarianti / LOCK locali

```
LOCK  service_role key + chiave Gemini = SOLO server (.env, gitignored). Mai nel client/bundle.
LOCK  isolamento per utente via RLS = muro di sicurezza. Verificato da test (server/test/auth-rls.test.js).
RULE  La chiave anon/publishable PUÒ stare nel client (è pubblica per design): è la coppia
      RLS + anon-key il modello di sicurezza, NON il nascondere la anon-key.
RULE  Mai usare la service_role nei percorsi di richiesta dell'app per saltare la RLS.
      Bypass consentito solo in operazioni admin/test esplicite (es. creare utenti di test).
RULE  Niente registrazione aperta: nessun percorso crea account dall'app (demo).
RULE  Disclaimer sempre visibile anche in login (RULE globale di prodotto).
RULE  Test per ogni funzione; `node --check` dopo modifiche JS; niente merge senza test verdi.
```

## 5. Schema DB e provisioning (autorità per l'esecutore M1)

Tabella minima per il profilo, con RLS «solo il proprietario» e creazione automatica della riga
alla nascita dell'utente (così il profilo esiste anche se l'account è creato a mano dal pannello).

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profili: leggi solo il tuo"
  on public.profiles for select using ( auth.uid() = id );

create policy "profili: aggiorna solo il tuo"
  on public.profiles for update using ( auth.uid() = id ) with check ( auth.uid() = id );

-- Provisioning automatico: alla creazione di un utente, crea la sua riga profilo.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();
```

> **Niente policy di insert/delete per il client:** l'utente non crea né cancella profili; la riga
> nasce solo dal trigger (`security definer`). Il `display_name` lo imposto nel metadato utente al
> momento della creazione a mano; modificarlo dall'app = **M6 (Impostazioni)**.

## 6. Modello di sicurezza e segreti (env)

- **Client:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (esposte al bundle — è corretto: la anon
  key è pubblica). Login e lettura del proprio profilo passano da qui; la RLS fa da muro.
- **Server:** `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (mai nel client). Per ora serve solo ad
  admin/test; da M3 il server verificherà il **JWT** dell'utente e agirà **per suo conto** (RLS attiva),
  senza usare la service_role nei percorsi di richiesta.
- Il file dei segreti reali è **`.env.local`** (root, gitignored), modellato da `.env.example`
  (`SUPABASE_URL/ANON/SERVICE` + `VITE_*`). I test lo caricano via `server/test/setup-env.js`
  (`process.loadEnvFile`). LOCK segreti: mai in un file tracciato.
- **Account di test** (login UI manuale / per agenti che provano l'app): `test@t.com`, password in
  `.env.local` (`TEST_USER_EMAIL` / `TEST_USER_PASSWORD`). Creato a mano dal pannello con Auto Confirm —
  niente registrazione aperta. Login UI verificato funzionante (2026-06-30).

## 7. Sessione, rotte e disclaimer

- **Sessione persistente:** comportamento default di supabase-js (token in `localStorage`, refresh
  automatico). «Esci» = `signOut()`.
- **Rotte:** `react-router-dom`. `/login` pubblica; tutto il resto **protetto** → senza sessione
  redirige a `/login`. Dopo il login → `/` (per M1 un guscio autenticato minimo: nome+email del
  profilo + «Esci», a prova che auth/profilo/RLS funzionano). La Chat vera è **M2**.
- **Disclaimer:** visibile sulla pagina di login + footer fisso già presente (M0).

## 8. Come si verifica M1 (il «fatto quando»)

Test `server/test/auth-rls.test.js` (Vitest, lato server):
1. Con la **service_role** crea due utenti di test A e B (`email_confirm: true`).
2. Per ciascuno: client anon → `signInWithPassword` → sessione.
3. Asserisci: il client di A legge da `profiles` **solo** la riga di A; B **solo** la sua; A non
   vede la riga di B. → due utenti non vedono i dati l'uno dell'altro.
4. Pulizia: la service_role cancella gli utenti di test.

## 9. Come estendere senza rompere

- Nuove tabelle utente (chat, messaggi in **M2**) → **stesso schema**: `enable row level security`
  + policy `auth.uid() = user_id`. Mai una tabella utente senza RLS.
- Recupero password (**FU-002**) e validazione email reale (**FU-003**): si attivano dopo
  l'intervista cliente → richiederanno configurare l'invio email (SMTP) e indirizzi veri.
- Cambio password / nome da loggato = **M6 (Impostazioni)**, non qui.
- Modifiche a RLS / trigger = **deep**: rileggi questo file e i LOCK §4 prima di toccare.

## 10. Report di sessione collegati

- `_sessioni-lavoro/2026-06-30/Report-M1-auth-rls.md` — esecuzione M1 completa (2026-06-30):
  DB migrato, Login + AuthProvider + ProtectedRoute + Home, test RLS verde, `npm run validate` 19/19.
- **Revisione + hardening (2026-06-30):** advisor Supabase ridotti da 5 a 1. Migrazione
  `m1_hardening_revoke_rpc_and_rls_initplan`: `revoke execute` su `handle_new_user()` da
  `public/anon/authenticated` (resta chiamabile solo come trigger; service_role intatto) e policy RLS
  con `(select auth.uid())`. Resta aperto solo «leaked password protection» (interruttore pannello,
  bassa priorità in demo) → vedi FOLLOW_UP.
