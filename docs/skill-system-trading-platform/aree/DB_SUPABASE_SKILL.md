---
name: db-supabase
description: >-
  Entry point per schema, migrazioni, privilegi, RLS e isolamento dati Supabase/Postgres.
  Area deep: ogni mutazione remota richiede ambiente verificato e conferma se produzione.
---

# DB / Supabase — stato reale e regole

> Aggiornato: 2026-07-02. Tabelle in uso: `profiles`, `chats`, `messages`.
> UI/flusso chat: `context/CHAT_ANALISI_CONTEXT.md`; auth: `context/AUTH_CONTEXT.md`;
> modello account: `context/IMPOSTAZIONI_CONTEXT.md`.

## 1. Stato reale

Il DB remoto contiene lo schema applicativo e le policy usate dalla demo. La repository però non
contiene ancora `supabase/config.toml` né `supabase/migrations/*.sql`: nomi e contenuti delle
migrazioni sono descritti soltanto nei documenti/test.

Questa è una **lacuna critica di riproducibilità**, non il workflow target. Da repository non è
possibile ricostruire o revisionare offline tabelle, trigger, grant e policy. Prima della prossima
modifica DB va creato un baseline versionato del remoto in un task dedicato e verificato; non
inventare SQL “equivalente” dai context.

## 2. Schema applicativo noto

### `profiles`

- `id uuid` PK/FK → `auth.users(id) on delete cascade`
- `display_name text`
- `created_at timestamptz`
- `ai_model text null` — admin-only tramite privilegi di colonna
- `theme text not null default 'dark'` con valori `dark|light`

La riga viene creata dal trigger `handle_new_user`. L'utente legge/aggiorna solo la propria riga;
può aggiornare `display_name` e `theme`, non `ai_model`.

### `chats`

- `id uuid` PK
- `user_id uuid not null` → `auth.users`
- `title text not null default 'Nuova analisi'`
- `created_at`, `updated_at`
- `form_context jsonb not null default '{}'`

Indice dichiarato: `(user_id, updated_at desc)`.

### `messages`

- `id uuid` PK
- `chat_id uuid not null` → `chats(id) on delete cascade`
- `user_id uuid not null` → `auth.users(id) on delete cascade`
- `role text` in `user|assistant`
- `content text not null default ''`
- `attachments jsonb not null default '[]'`
- `created_at timestamptz`

Indice dichiarato: `(chat_id, created_at)`. Un trigger aggiorna `chats.updated_at` all'insert.
`attachments` contiene la trascrizione JSON; non riferimenti Storage.

### `journal_entries` (FU-023, 2026-07-02)

- `id uuid` PK
- `user_id uuid not null` → `auth.users(id) on delete cascade` — base RLS
- `chat_id uuid` → `chats(id) **on delete set null**` — link **opzionale** all'analisi; la voce
  sopravvive alla cancellazione della chat (il link diventa null)
- `asset text not null default ''`, `timeframe text not null default ''`
- `traded_at date not null default current_date`
- `direction text default 'none'` in `long|short|none`; `outcome text` in `win|loss|breakeven|no_trade` (nullable)
- `entry_price|exit_price|stop_price|rr|pnl numeric` (nullable, inseriti dall'utente)
- `emotion text`, `tags text[] not null default '{}'`, `note text not null default ''`, `lesson text not null default ''`
- `created_at`, `updated_at`

Indice dichiarato: `(user_id, traded_at desc)`. Trigger BEFORE UPDATE `set_journal_updated_at`
(trigger-only, EXECUTE revocato, `search_path` fisso). Policy separate `journal_*_own`: INSERT/UPDATE
verificano l'owner della **chat padre** quando `chat_id` non è null (stessa regola di `messages`).

Da verificare sul remoto: indice dedicato `messages(user_id)` per FK/RLS e, prima di introdurla,
utilità di una FK/unique composita `(chat_id, user_id)` per rendere strutturale la coerenza col padre.

## 3. Modello di accesso

```
LOCK  RLS — ogni riga di prodotto è owner-only.
LOCK  service_role — soltanto admin/test server; mai nei percorsi utente o nel client.
RULE  Policy — `TO authenticated` + ownership con `(select auth.uid())`.
RULE  UPDATE — richiede SELECT, USING e WITH CHECK.
RULE  Figlie — INSERT/UPDATE verificano owner della riga e della chat padre.
RULE  Indici — indicizzare FK e colonne usate da RLS/query.
RULE  Privilegi — grant di tabella/colonna e Data API sono distinti dalla RLS; verificare entrambi.
RULE  SECURITY DEFINER — schema non esposto, search_path vuoto, auth check e EXECUTE revocato;
      le funzioni trigger-only pubbliche devono restare non invocabili dai ruoli client.
```

Le tabelle in schema esposto devono avere RLS attiva. Per tabelle nuove verificare anche le
impostazioni Data API e i `GRANT`: dal 2026-05-30 l'esposizione automatica non va presunta
(enforcement annunciato per i progetti esistenti dal 2026-10-30).

## 4. Migrazioni note ma non versionate

- M1: `profiles`, trigger provisioning, RLS e hardening funzione/policy.
- M2: `chats`, `messages`, indici, trigger `updated_at`, policy owner-only e hardening parent check.
- M3: `chats.form_context`.
- M6: `profiles.ai_model`, `profiles.theme`, check tema e privilegi di colonna su `ai_model`.
- M8 (2026-07-02): `journal_entries` (FU-023) — tabella + indice + trigger `set_journal_updated_at`,
  RLS ON e policy owner-only `journal_*_own` con parent-check su `chat_id`; hardening `search_path`
  della funzione trigger (`m8_hardening_journal_fn_search_path`). Advisor security puliti.

Questa lista orienta soltanto; non sostituisce SQL versionato né introspezione del remoto.

## 5. Workflow obbligatorio per il prossimo task DB

1. Non aprire `.env.local` e non usare il `service_role` per “vedere se funziona”.
2. Identificare esplicitamente progetto e ambiente (test/staging/prod). Produzione è read-only
   finché l'utente non conferma una mutazione precisa.
3. Leggere schema, policy, grant, funzioni, trigger, indici e cronologia migrazioni reali con
   strumenti in sola lettura.
4. Creare prima il baseline locale/versionato seguendo la CLI/documentazione Supabase corrente.
5. Per una modifica nuova: creare migrazione locale, testarla su ambiente non-prod, eseguire
   advisor e test RLS, poi proporre il deploy remoto.
6. Committare migrazione e test insieme; aggiornare questa skill/context nello stesso task.

Non usare più “remoto unica verità + `apply_migration` senza file locale” come procedura ordinaria.

## 6. Integrità non coperta dalla sola RLS

Le policy attuali garantiscono l'ownership, ma il client proprietario può scrivere messaggi con
`role='assistant'` e il server rimanda quella storia al modello. Può quindi falsificare risposte,
trascrizioni e contesto modello senza violare RLS.

Anche il limite follow-up conta righe create dal client e non usa un turn-id idempotente: replay,
concorrenza, cancellazioni proprie o payload immagini possono alterare il conteggio. Questi sono
finding M8 da risolvere con un design server-authoritative; non “correggere” le policy alla cieca.

## 7. Test

Le suite `server/test/*-rls.test.js` mutano il progetto remoto: prima di eseguirle serve conferma
dell'ambiente. I test correnti coprono isolamento profiles/chats/messages e parent ownership, ma
non coprono ancora:

- `ai_model` non scrivibile dall'utente;
- signup pubblico realmente disabilitato;
- privilegi/grant Data API;
- ruolo assistant e persistenza server-authoritative;
- idempotenza/concorrenza/limite follow-up;
- ricostruzione completa dello schema da migrazioni versionate.

I test negativi devono distinguere un vero rifiuto RLS da un errore generico: non basta asserire
`data ?? []` vuoto senza controllare il codice/messaggio d'errore atteso.

## 8. Routing

| Task | Carica anche |
|------|--------------|
| Login/provisioning/signup | `context/AUTH_CONTEXT.md` |
| Chat, attachments, follow-up | `context/CHAT_ANALISI_CONTEXT.md` |
| Modello account/tema | `context/IMPOSTAZIONI_CONTEXT.md` |
| Route/storia agente | `aree/AGENTE_AI_SKILL.md` |
| Test e ambiente remoto | `aree/TESTING_SKILL.md` |
