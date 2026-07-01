---
name: db-supabase
description: >-
  Skill per qualsiasi lavoro su schema dati, migrazioni e RLS in FREEDOM TRADING SYSTEM (Supabase
  Postgres). Caricala quando il task riguarda «schema», «tabella», «migrazione», «RLS», «policy»,
  «isolamento dati». Copre le tabelle di prodotto (profiles, chats, messages) e le regole di accesso.
---

# DB / SUPABASE — Skill di area (entry point)

> **Strato d'area** del pattern a 3 strati. Qui sta il **senso** dello strato dati + gli invarianti
> di sicurezza (RLS). I valori reali (colonne, tipi) vivono nel **DB remoto** e nelle migrazioni; i
> `.md` li specchiano. Progetto Supabase: `eezybdmdtlehcvwobhgc`.
>
> Stack: Supabase (Postgres + Auth + Storage). Migrazioni applicate via MCP `apply_migration`
> (naming `mN_descrizione`); **nessuna cartella `supabase/` locale** finora — la verità è il remoto.
> Aggiornato: 2026-06-30 (creato a M2, mini-intervista DB). Codice da costruire.

---

## 0. Quando caricare questo skill (vs altri)

| Il task riguarda… | Skill da usare |
|-------------------|----------------|
| Schema, tabelle, migrazioni, RLS/policy, indici, trigger DB | **questo** |
| Flusso/UI della chat (form, bolle, composer, streaming) | `../context/CHAT_ANALISI_CONTEXT.md` |
| Login / sessione / provisioning utente | `../context/AUTH_CONTEXT.md` |
| Storico chat in sidebar (lista, rinomina, nuova chat) | `../context/SIDEBAR_STORICO_CONTEXT.md` *(da creare)* |
| Catena agente / kit (lato server, runtime) | `AGENTE_AI_SKILL.md` *(da creare)* |

## 1. A che serve lo strato dati (il senso)

È dove vivono **gli account e tutto ciò che ogni utente produce**: le sue chat di analisi e i
messaggi dentro ciascuna chat. Il valore non negoziabile è uno: **ogni utente vede SOLO i propri
dati**. Non è una feature, è un requisito di fiducia — la demo crolla se un trader vede le chat di un
altro. Per questo ogni tabella di prodotto nasce con **RLS attiva e verificata da test**, sul modello
già collaudato di `profiles` (M1).

## 2. Chi fa cosa (attori)

- **Utente finale (trader):** legge/scrive **solo** le proprie `chats` e `messages`. Mai accesso ad
  altri utenti — garantito da RLS, non dal codice applicativo.
- **Server (service_role):** bypassa la RLS (chiave solo lato server, mai nel client). Usato per
  provisioning e, in futuro, scritture dell'agente. La sicurezza dipende dal tenere la service key
  fuori dal bundle (LOCK segreti, Bussola §2).
- **Admin (a mano):** crea account e fa reset password dal pannello Supabase (no registrazione aperta).

## 2-bis. Il flusso completo (percorso utente + flusso dati)

| Passo utente | Cosa succede nei dati |
|--------------|------------------------|
| Apre l'app loggato | sessione Supabase Auth → `auth.uid()` identifica l'utente in ogni query |
| Crea una nuova chat | `insert` in `chats` (user_id = auth.uid(), title default); RLS consente solo la propria |
| Scrive un messaggio | `insert` in `messages` (chat_id, user_id, role='user', content, attachments); trigger aggiorna `chats.updated_at` |
| Riapre lo storico | `select` su `chats` ordinate per `updated_at desc` → RLS filtra alle sole proprie |
| Rinomina una chat | `update chats.title` dove user_id = auth.uid() |
| (M3) l'AI risponde | il server inserisce `messages` con role='assistant' |
| (M4) allega screenshot | i riferimenti finiscono in `messages.attachments` (jsonb), file su Storage |

## 3. Schema di prodotto (deciso a M2)

> Schema **scale-ready**: scelte che non inchiodano (FK con cascade, RLS, denormalizzazione mirata),
> senza costruire funzioni di scala premature. Predisposto per AI (M3) e allegati (M4) senza
> migrazioni distruttive successive.

**`chats`**
- `id uuid pk` (default `gen_random_uuid()`)
- `user_id uuid not null` → `auth.users(id) on delete cascade`
- `title text not null default 'Nuova analisi'` — **modificabile a mano** dall'utente (decisione M2)
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()` — usato per ordinare lo storico (sidebar)
- `form_context jsonb not null default '{}'::jsonb` — **M3 (FU-010)**: contesto del form (asset/stile/
  obiettivo/posizione/TF) valido per tutta la chat. RLS ereditata dalla chat (nessuna policy nuova)

**`messages`**
- `id uuid pk` (default `gen_random_uuid()`)
- `chat_id uuid not null` → `chats(id) on delete cascade`
- `user_id uuid not null` → `auth.users(id) on delete cascade` — **denormalizzato** apposta: rende le
  policy RLS dirette e veloci (no subquery/join sulla chat ad ogni riga)
- `role text not null check (role in ('user','assistant'))` — predisposto per l'AI (M3); a M2 si usa 'user'
- `content text not null default ''`
- `attachments jsonb not null default '[]'::jsonb` — **predisposto per gli screenshot M4** (array di
  riferimenti file/metadati); vuoto a M2
- `created_at timestamptz not null default now()`

**Indici:** `messages(chat_id, created_at)` · `chats(user_id, updated_at desc)`.
**Trigger:** al nuovo `messages.insert` → aggiorna `chats.updated_at = now()` (ordinamento storico).

## 4. Questioni aperte (decise, da implementare)

| Questione | Decisione presa | Stato |
|-----------|-----------------|-------|
| Scope prima slice M2 | Solo fondamenta DB (tabelle + RLS + test isolamento); Chat UI e Sidebar dopo | **fatto** (2026-06-30) — 3 migrazioni applicate, test verde |
| Titolo chat | Colonna `title` modificabile a mano dall'utente (UI rinomina = slice Sidebar) | da implementare (slice Sidebar) |
| Allegati screenshot | `messages.attachments jsonb` predisposto ora; popolato a M4 | predisposto (policy Storage da definire a M4 — FU-005) |
| Ruoli messaggio | `'user' \| 'assistant'`; 'assistant' inizia a M3 (catena agente) | predisposto |
| Storia inviata al modello | default in `CHAT_ANALISI_CONTEXT.md §6`, da confermare a M3 col test vista | rinviato (M3) |

### Migrazioni applicate a M2 (2026-06-30)

| Migrazione | Contenuto |
|------------|-----------|
| `m2_chat_messages_rls` | Tabelle `chats` e `messages` + indici + trigger `update_chat_updated_at` (SECURITY DEFINER) + RLS ON + policy separate per operazione (select/insert/update/delete) con `(select auth.uid())` |
| `m2_hardening_revoke_trigger_fn` | `revoke execute on function public.update_chat_updated_at() from public, anon, authenticated` — la funzione è trigger-only, non RPC |
| `m2_hardening_messages_insert_policy` | Riscrittura policy `messages_insert_own` con doppio check: `user_id = (select auth.uid()) AND (select user_id from chats where id = chat_id) = (select auth.uid())` — blocca l'inserimento in chat altrui |
| `m2_hardening_messages_update_parent_check` | Riscrittura policy `messages_update_own` con lo stesso doppio check nel `WITH CHECK` — blocca lo **spostamento** di un proprio messaggio in una chat altrui (simmetria con INSERT). Aggiunta in revisione M2 |
| `m3_chats_form_context` (2026-06-30) | Colonna `chats.form_context jsonb not null default '{}'` (FU-010). Additiva, RLS già coperta dalla chat: nessuna policy nuova. Advisor security: nessun nuovo rilievo |

## 5. LOCK di area (invarianti locali)

```
LOCK  Isolamento per utente (RLS)  — ogni tabella di prodotto nasce con RLS ON + policy
                                     user_id = (select auth.uid()). Mai una tabella di dati utente
                                     senza policy. Verificato con test d'isolamento. (Bussola §2)
LOCK  Segreti (service key)        — service_role solo lato server, mai nel client/bundle. (Bussola §2)
RULE  Policy performanti: usa (select auth.uid()) nelle policy (evita l'advisor auth_rls_initplan,
      come fatto nell'hardening M1). Policy separate per operazione (select/insert/update/delete).
RULE  Naming migrazioni: mN_descrizione (es. m2_chat_messages_rls), applicate via MCP apply_migration.
RULE  Ogni nuova tabella di dati utente → un test d'isolamento sul modello di server/test/auth-rls.test.js.
RULE  FK verso auth.users e chats con ON DELETE CASCADE (cancellare un utente/chat pulisce a valle).
RULE  Policy INSERT **e UPDATE** su tabelle figlie: verificare ANCHE l'ownership della tabella padre, non solo user_id.
      Esempio: messages → chats: WITH CHECK (user_id = (select auth.uid()) AND (select user_id from chats where id = chat_id) = (select auth.uid())).
      Scoperto in M2: senza il check sul padre, un utente può inserire (INSERT) o spostare (UPDATE chat_id) un messaggio in una chat altrui.
```

> I LOCK battono il profilo: valgono anche in un fix «piccolo». Testo pieno dei LOCK trasversali: Bussola §4.

## 6. Mappa: tocchi X → apri il file Y

| Se il task tocca… | Apri (intero) |
|-------------------|---------------|
| Schema/RLS di chat e messaggi | **questo file** + verifica lo schema reale via MCP `list_tables` |
| UI/flusso della chat | `../context/CHAT_ANALISI_CONTEXT.md` |
| Storico/rinomina in sidebar | `../context/SIDEBAR_STORICO_CONTEXT.md` *(da creare, slice successiva)* |
| Auth/provisioning | `../context/AUTH_CONTEXT.md` |

## 7. Principio di lettura (vale per tutta l'area)

Prima di una migrazione, **leggi lo schema reale** (`list_tables` verbose) e le migrazioni esistenti
(`list_migrations`): il DB remoto è la verità, i `.md` lo specchiano. Dopo una modifica, controlla gli
advisor di sicurezza (`get_advisors`) e aggiorna questo file se lo schema cambia.
