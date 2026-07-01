# Impostazioni — file di contesto (M6)

> Mappa di dettaglio della zona **Impostazioni**: cosa l'utente può cambiare del proprio account
> (**tema** chiaro/scuro e **password**) e come l'admin assegna il **modello AI per-utente**. È la
> zona di **M6**. Zona **deep**: tocca `profiles` (DB/RLS) e la catena agente (il modello per-utente
> passa in orchestrator → providerClient — LOCK). Fonte prodotto: `docs/CONTESTO_PRODOTTO.md` ·
> piano: `docs/PIANO_LAVORO.md` (M6).
>
> **Trigger di routing:** «impostazioni», «tema», «chiaro/scuro», «dark mode», «cambio password»,
> «selettore modello», «modello per utente», «preferenze» → questo file.
> Aggiornato: 2026-07-01 (intervista M6, Senior). I path segnati *(nuovo)* sono da creare in esecuzione.

---

## 1. Cos'è questa zona

Il posto dove l'utente regola **due cose sue**: il **tema** (chiaro/scuro, persistito sul suo
profilo così lo ritrova su ogni dispositivo) e la **password**. Nient'altro è self-service.

Il **modello AI** invece **non** è una scelta dell'utente: è un **attributo dell'account deciso
dall'admin** (tu), per differenziare i tier — es. Flash per gli account base, Pro per i clienti
«pro». Per ora si imposta **a mano dal DB**; a regime lo gestirà una **console super-admin**
(→ **FU-016**, fuori scope M6). Obiettivo immediato collegato: poter **testare Gemini 2.5 Flash**
su un account e confrontarne la qualità con 2.5 Pro per decidere il default.

## 2. Decisioni d'intervista (2026-07-01)

| Tema | Deciso | Note |
|------|--------|------|
| **Modello — scope** | **Per-account, deciso dall'admin.** NON è una tendina per l'utente finale. | Serve a differenziare i tier (Flash base / Pro «pro»). |
| **Modello — dove** | **Colonna `ai_model` su `profiles`**, impostata **a mano dal DB** per ora. | UI di gestione = **FU-016** (console super-admin), fuori M6. |
| **Modello — lista curata** | **`gemini-2.5-pro`** (default) · **`gemini-2.5-flash`**. Niente Flash-Lite per ora. | Valore fuori lista o `null` → **fallback** al default `.env` (`AI_MODEL`). Mai rompere l'analisi. |
| **Modello — default** | `gemini-2.5-pro` (via fallback a `.env` `AI_MODEL`, già così). | `ai_model` nullable: `null` = «usa il default globale». |
| **Impostazioni utente (UI)** | **Solo tema + cambio password.** Il modello non compare qui. | Meno superficie, coerente coi tier decisi dall'admin. |
| **Tema — dove** | **Per-utente su DB** (colonna `theme` su `profiles`). | Segue l'utente su ogni dispositivo. Auth/RLS già pronti (M1). |
| **Tema — default** | **`dark`** (l'estetica beta è verde-scuro; M7 la rifinisce). | Valori ammessi: `dark` · `light`. |
| **Cambio password** | **Richiede la password attuale** prima del cambio. | Riverifica identità: `signInWithPassword` con la vecchia, poi `updateUser`. |

## 3. File coinvolti

| File | Ruolo | Stato |
|------|-------|-------|
| _migrazione DB_ | `profiles.ai_model text` (nullable) + `profiles.theme text default 'dark'`. Additiva; RLS update-only-owner **già** presente su `profiles` (M1). | *(nuovo — via MCP `apply_migration`)* |
| `client/src/pages/Settings.jsx` | Pagina Impostazioni: tema + cambio password. | *(nuovo)* |
| `client/src/App.jsx` | Aggiungere rotta **protetta** `/impostazioni`. | esiste (solo `/login`, `/`) |
| `client/src/components/layout/Sidebar.jsx` | Voce/ingresso «Impostazioni». | esiste |
| `client/src/auth/AuthProvider.jsx` | Già carica `profiles.*` (`select('*')`) → espone `profile.theme`/`profile.ai_model`. Aggiungere un modo per **ricaricare** il profilo dopo un cambio tema. | esiste |
| `client/src/lib/theme.js` | Applica il tema (classe `dark` su `<html>`) + salva su `profiles`. | *(nuovo)* |
| `client/tailwind.config.js` | Aggiungere `darkMode: 'class'` (oggi assente). | esiste |
| `server/src/routes/agent.js` | In `authorizeAnalyze`: leggere `profiles.ai_model` dell'utente (RLS: la sua riga) e passarlo giù. | esiste |
| `server/src/agent/orchestrator.js` | `runAnalysis`/`runAnalysisStream` accettano `model` e lo passano a `requestCompletion`/`streamGeminiText`. | esiste |
| `server/src/agent/providerClient.js` | **Nessuna modifica**: accetta già `model` (fallback `.env` → `DEFAULT_MODEL`). | esiste |

## 4. Invarianti / LOCK locali

```
LOCK  catena agente — il modello per-utente si innesta SOLO passando `model` giù
      (route → orchestrator → providerClient). providerClient resta lo switcher, il KIT NON si tocca,
      il caching resta intatto (il modello cambia l'endpoint, non il blocco system). Adattamento
      esplicito e circoscritto (coerente AGENTE_AI_SKILL §3 "modello da config, mai hardcoded").
LOCK  isolamento per utente (RLS) — `ai_model`/`theme` si leggono/scrivono SOLO sulla riga
      dell'utente. Nessuna lettura cross-utente. La route usa il client vincolato al token (RLS attiva).
LOCK  segreti — chiave Gemini solo lato server. Il modello NON è un segreto, ma l'endpoint lo compone
      il server: il client non chiama mai Gemini direttamente.
RULE  Fallback mai-crash: `ai_model` nullo o fuori lista → default `.env`. Un valore errato nel DB
      non deve rompere l'analisi.
RULE  Cambio password: riverifica con la password attuale prima di `updateUser`. Errori chiari
      (vecchia errata / nuova troppo debole) a video, mai eccezioni nude.
RULE  Test per ogni funzione; `node --check` dopo modifiche JS; niente merge senza test verdi.
RULE  Disclaimer sempre visibile (RULE globale di prodotto) — anche nella pagina Impostazioni.
```

## 5. Schema DB (autorità per l'esecutore M6)

Migrazione **additiva** su `profiles` (già esiste, con RLS update-only-owner — vedi `AUTH_CONTEXT §5`).
Nessuna nuova tabella, nessuna nuova policy: l'utente aggiorna **solo la sua** riga (policy M1).

```sql
alter table public.profiles
  add column if not exists ai_model text,                       -- null = usa default .env (AI_MODEL)
  add column if not exists theme    text not null default 'dark'; -- 'dark' | 'light'

-- Vincolo soft sui valori del tema (il modello NON si vincola: lista curata gestita nel codice,
-- così aggiungere un modello non richiede una migrazione).
alter table public.profiles
  add constraint profiles_theme_chk check (theme in ('dark','light'));
```

> **`ai_model` senza CHECK di proposito:** la lista curata (`gemini-2.5-pro`/`gemini-2.5-flash`) vive
> nel codice con **fallback**; così puoi scrivere a mano un modello nuovo senza migrazione, e un
> valore errato degrada al default invece di far fallire la scrittura.

> **✅ APPLICATO — migrazione `m6_profiles_settings` (2026-07-01)** con in più il **blindaggio del modello**
> (richiesto dall'utente): `ai_model` è admin-only **anche a livello DB**, non solo per assenza di UI. La
> migrazione revoca l'`UPDATE` di tabella al ruolo `authenticated` e lo riconcede **solo** su
> `display_name, theme` (privilegi di **colonna** Postgres):
> ```sql
> revoke update on public.profiles from authenticated;
> revoke update on public.profiles from anon;
> grant  update (display_name, theme) on public.profiles to authenticated;
> ```
> Effetto (verificato con `has_column_privilege`): l'utente può scrivere `theme` ma **non** `ai_model`
> (lo scrive solo `service_role` = server). La RLS per-riga (M1) resta il muro per-riga; questo è il muro
> per-colonna. Nemmeno una richiesta costruita a mano può auto-assegnare un modello.

## 6. Modello AI per-utente (come si innesta nella catena)

Flusso: **route → orchestrator → providerClient**. Il pezzo variabile è solo *quale endpoint modello*.

1. **Route** (`agent.js`, in `authorizeAnalyze` o subito dopo): con il client utente (RLS)
   `select('ai_model').from('profiles').eq('id', <uid>).maybeSingle()`. L'uid dal token
   (`supabase.auth.getUser()`), oppure `select` filtrata dalla RLS. Ricava `model` = valore se in
   lista curata, altrimenti `undefined` (→ fallback .env).
2. **Orchestrator**: `runAnalysis({ ..., model })` e `runAnalysisStream({ ..., model })` passano
   `model` a `requestCompletion`/`streamGeminiText`.
3. **providerClient**: **già pronto** — `resolvedModel = model || process.env.AI_MODEL || DEFAULT_MODEL`.

> Helper consigliato (server): `resolveUserModel(rawValue)` puro e testato — ritorna il modello se ∈
> lista curata, altrimenti `undefined`. La lista curata sta in un solo posto (es.
> `server/src/agent/models.js`) riusabile.

**Come testare Flash adesso** (obiettivo dell'utente): impostare `ai_model = 'gemini-2.5-flash'` sulla
riga del proprio account (SQL/pannello), rifare un'analisi già fatta con Pro e confrontare la qualità.

## 7. Tema chiaro/scuro — ✅ IMPLEMENTATO (M6, 2026-07-01), attivo su TUTTA l'app

- **Tailwind:** `darkMode: 'class'` in `tailwind.config.js`. Le classi `dark:` / i token semantici si
  attivano quando `<html>` ha la classe `dark`.
- **Applicazione:** `client/src/lib/theme.js` — `applyTheme(theme)` (aggiunge/toglie `dark` su
  `document.documentElement`, robusto senza `document`) + `saveTheme(userId,theme)` (persiste + applica).
  Chiamato **all'avvio** (default in `main.jsx`/`index.html class="dark"` → no flash; poi il tema salvato
  in `AuthProvider.loadProfile`) e **ad ogni cambio** (Settings, con refresh via `reloadProfile`).
- **Auth senza blocchi:** `AuthProvider` carica il profilo in un effetto successivo all'evento auth,
  mai dentro `onAuthStateChange`; se il profilo non è raggiungibile mantiene la sessione e usa il tema default.
- **Persistenza:** al cambio, `update profiles set theme=…` (RLS) + `applyTheme` subito + `reloadProfile`.
- **Palette semantica (un solo punto-verità):** i colori NON sono più hardcoded per-componente. In
  `src/index.css` vivono variabili CSS come terne `R G B` per tema **chiaro** (`:root`) e **scuro**
  (`.dark`): token `app · surface(/strong/stronger) · content · muted · faint · line`, mappati in
  `tailwind.config.js` con `rgb(var(--…) / <alpha-value>)`. Tutte le superfici utente (Chat, ChatPanel,
  Sidebar, MessageBubble, NewAnalysisForm, Login, Settings) usano questi token → il tema cambia **ovunque**,
  subito, in entrambi i temi leggibile. `freedom-accent` (verde) resta identico nei due temi.
- **`color-scheme` dinamico:** impostato in `index.css` (`:root` = light, `.dark` = dark) → scrollbar e
  menu di sistema seguono il tema. (Chiude la nota "color-scheme fisso" dell'esecutore.)
- **NB M7:** la palette **ricca** (verde-scuro raffinato, sfondo animato, font custom, ridisegno layout) è
  **M7**. In M6 c'è la **base sobria e leggibile** su tutta l'app, non il restyle.
- **Legacy:** `pages/Home.jsx` (vecchia shell M1) **non è instradata** in `App.jsx` (sostituita da `Chat`
  in M2): resta con colori hardcoded, è codice non in uso.

## 8. Cambio password

- Form: **password attuale** + **nuova** (+ conferma). L'email dell'utente è nota (`session.user.email`).
- Riverifica: `supabase.auth.signInWithPassword({ email, password: attuale })`; se fallisce →
  «Password attuale errata». Se ok → `supabase.auth.updateUser({ password: nuova })`.
- Errori chiari a video: vecchia errata · nuova troppo debole (Supabase min length) · rete. Mai crash.
- **Nota FU-004:** «leaked password protection» resta un interruttore di pannello (bassa priorità demo).

## 9. UI / routing / accesso

- Rotta **protetta** `/impostazioni` in `App.jsx` (dentro `ProtectedRoute`), come `/`.
- Ingresso dalla **Sidebar** (drawer esistente): voce «Impostazioni» + «Esci» lì vicino.
- Stile sobrio (M7 rifinisce): tema come toggle/segmented, password come form. Disclaimer visibile.

## 10. Come si verifica M6 (il «fatto quando»)

- **Tema:** cambio tema → l'UI cambia subito, **ricarico** la pagina → resta (letto dal profilo);
  con un secondo account il tema è indipendente. Test: `applyTheme`/util tema (client).
- **Password:** cambio con vecchia corretta → funziona e posso rifare login con la nuova; vecchia
  errata → messaggio chiaro, nessun cambio. Test: helper di validazione/flow.
- **Modello per-utente:** con `ai_model='gemini-2.5-flash'` sul mio account, un'analisi usa Flash
  (verificabile a video/log); `null`/valore errato → usa il default Pro (fallback). Test server:
  `resolveUserModel` (lista curata + fallback) e che orchestrator inoltri `model`.
- `npm run validate` verde (client + server).

## 11. Come estendere senza rompere / follow-up collegati

- **FU-016 (console super-admin):** UI riservata all'admin per gestire utenti, assegnare il modello e
  vedere statistiche per-utente. Sostituirà la gestione «a mano dal DB» del modello. Fuori M6.
- Nuove preferenze utente → **stessa riga `profiles`** (colonna additiva), mai una tabella senza RLS.
- Aggiungere un modello alla lista curata = **una riga** in `server/src/agent/models.js` (nessuna
  migrazione, grazie all'assenza di CHECK su `ai_model`).
- Selettore modello self-service per l'utente (se un giorno servisse) → si aggiunge alla pagina
  riusando `resolveUserModel`; oggi **escluso di proposito** (tier decisi dall'admin).
- Modifiche a RLS/trigger o alla catena agente = **deep**: rileggi questo file, `AUTH_CONTEXT §4-5` e
  `AGENTE_AI_SKILL §3-5` prima di toccare.
