# PIANO DI LAVORO — FREEDOM TRADING SYSTEM (demo)

> Piano a **milestone**. È lo **scheletro vivo**: le milestone esistono, ma il dettaglio di ogni
> schermata (flusso utente + flusso dati) si **riempie via intervista** prima di eseguire, dentro i
> file `context/` dello skill system. Regola: **nessun codice di una zona prima che esista il suo
> `context/`**. Vedi `CONTESTO_PRODOTTO.md` §Schema di lavoro.
>
> Aggiornato: 2026-07-02 · Legenda stato: ⬜ da fare · 🟡 in corso · ✅ fatto · 🔒 bloccato da dipendenza.

---

## Ordine e dipendenze (vista d'insieme)

```
M0 Fondamenta ─► M1 Auth+RLS ─► M2 Chat base (no AI) ─► M3 Cervello+TEST VISTA ─► M4 Upload ─► M5 Streaming ─► M6 Impostazioni ─► M7 Estetica ─► M8 Blindatura+Deploy
                                                  └► (TEST VISTA, rischio #1, si avvia già dopo M3)
```

---

## M0 — Fondamenta repo & tooling  ✅ *(2026-06-30)*
**Obiettivo:** repo pulita e costruibile. **Deliverable:** scaffold `client/` (React+Vite+Tailwind+Zustand)
+ `server/` (Node+Express), riporto `kit/` dall'estratto, lint + test runner + `npm run validate`, progetto
Supabase creato, `.env` reale (non committato). **Pre-esecuzione (intervista):** stack di test, comandi.
**Fatto quando:** `npm run dev` parte, un test d'esempio passa, `validate` verde.

> **Esito M0 (2026-06-30):** monorepo **npm workspaces** (`client/` + `server/`), linguaggio **JS+JSX**,
> test runner **Vitest** (stessa toolchain del client), lint **ESLint 9 flat config**. Comandi confermati:
> `npm install` · `npm run dev` (Vite 5173 + server 3001 via `concurrently`) · `npm test` · `npm run validate` (lint+test).
> Test d'esempio: `client/src/App.test.jsx` (titolo + disclaimer), `server/test/health.test.js` (`/api/health`).
> **Node** installato (LTS 24) via winget. **Supabase + `.env` reale: spostati a M1** (decisione di intervista —
> M0 resta scaffold puro buildabile; Supabase serve davvero con auth/RLS).

## M1 — Auth & isolamento per utente  ✅  *(deep — auth + RLS — 2026-06-30)*
**Obiettivo:** login funzionante con account leggeri, ogni utente vede solo i propri dati.
**Deliverable:** Supabase Auth, pagina Login, tabella `profiles` + policy RLS, trigger di provisioning,
guscio autenticato minimo (profilo + «Esci»), routing protetto, disclaimer in login, test d'isolamento.
**Context:** `context/AUTH_CONTEXT.md` ✅ creato (intervista 2026-06-30, 2 giri). **Progetto Supabase:** `eezybdmdtlehcvwobhgc` (vuoto).
**Deciso (intervista):** email+password · account a mano (no registrazione) · conferma email off · email finte ok ·
sessione persistente · recupero password + validazione email = **FU-002/FU-003** (dopo intervista cliente).
**Fatto quando:** due utenti di test non vedono i dati l'uno dell'altro (verificato con `server/test/auth-rls.test.js`).

## M2 — Chat base (senza AI)  ✅ *(2026-06-30)*
**Obiettivo:** invio messaggio, salvataggio chat/messaggi, storico in sidebar, isolamento verificato.
**Deliverable:** schema DB (chat, messaggi), pagina Chat, Sidebar+Storico, «nuova chat».
**Context:** `CHAT_ANALISI_CONTEXT.md` ✅ · `SIDEBAR_STORICO_CONTEXT.md` ✅ (creato 2026-06-30, intervista slice 2c) · `DB_SUPABASE_SKILL.md` ✅.
**Esito:** chat/messaggi, storico, rinomina e nuova analisi implementati; isolamento coperto dai
test RLS live originari. Lo schema remoto non è ancora versionato nella repository (debito M8).

## M3 — Innesto del cervello + TEST VISTA  ✅ *(catena + TEST VISTA passato — 2026-07-01)*  *(deep — LOCK kit/catena agente)*
**Obiettivo:** collego la catena agente + kit + Gemini; risposta reale (prima anche non-streaming).
E **subito** il test vista su grafici reali (decide se il prodotto sta in piedi — rischio #1).
**Deliverable:** ✅ adapter Gemini in `providerClient` (modello da `.env`), catena adattata
(`skillLoader/promptBuilder/orchestrator`), route `server/src/routes/agent.js` (isolata per utente),
client con attesa «sta analizzando…», migrazione `form_context`, prima analisi end-to-end (vision verificata
live). **Fatto (2026-06-30):** `aree/AGENTE_AI_SKILL.md` ✅; kit splittato in `kit/01,02,04,06,07,08,09`
**col contenuto reale del monolite** (placeholder dell'estratto scartati), monolite rimosso. Validate verde.
**TEST VISTA (FU-011) — ✅ passato (2026-07-01):** analisi su grafici reali verificata dall'utente,
lettura corretta e in stile Aware Trader. **Rischio #1 rientrato.** Rifinitura upload (FU-012: slot
per-timeframe + compressione client) anch'essa chiusa (2026-07-01). **M3 completo.**

## M4 — Persistenza analisi: scheda JSON (niente Storage immagini)  ✅ *(verificato live 2026-07-01 — deep, LOCK catena agente)*
**Svolta d'intervista (2026-07-01):** invece di conservare le immagini (Storage + policy), si salva una
**scheda JSON strutturata** dell'analisi; gli screenshot restano solo in volo e poi si scartano →
**niente Supabase Storage** (FU-005 superata). **Deliverable:** modulo `server/src/agent/transcript.js`
(marcatore + `buildTranscriptInstruction` + `splitTranscript`, testati); `orchestrator` chiede la scheda a
Gemini **nella stessa chiamata** (solo col turno immagini), separa prosa/scheda, ritorna `{text, transcript}`;
route ritorna `transcript`; client `chatData.addMessage(attachments)` + `Chat.jsx` salva la scheda in
`messages.attachments` (jsonb, già predisposto). Resize/compressione lato client + slot per-TF già fatti (FU-012).
Dettaglio: `aree/AGENTE_AI_SKILL.md §4-bis` · `context/CHAT_ANALISI_CONTEXT.md §5-bis`.
**Fatto quando:** dopo un'analisi la scheda JSON è salvata sul messaggio assistant, isolata per utente,
e la prosa si rivede riaprendo la chat; validate verde. **NB:** kit intatto, caching Gemini preservato.
**✅ Verificato live (2026-07-01):** analisi reale su BTCUSD → `messages.attachments` popolato con scheda
completa (asset/timeframe/livelli/struttura/indicatori/bias) come `[{type:'transcript',data:…}]`; prosa pulita.

## M5 — Streaming  ✅ *(verificato live 2026-07-01 — deep, LOCK catena agente)*
**Obiettivo:** risposta a pezzi mostrata man mano, senza crash su interruzioni.
**Decisioni d'intervista (2026-07-01):** trasporto = streaming Gemini (`streamGenerateContent`, SSE) →
server → client via risposta a flusso (NDJSON, serve l'header auth). **Persistenza invariata (M4):** la
prosa scorre a schermo ma si **salva a fine risposta** con la scheda JSON già estratta (nessun salvataggio
a metà). **Scheda mai a vista:** il server bufferizza la coda, il marcatore `===SCHEDA_JSON===`/JSON non
compaiono mai (prose-streamer). **Interruzione:** testo parziale resta visibile + avviso «risposta
interrotta, riprova»; il parziale **non** si salva. **Niente pulsante «ferma»** (anti-scope; poss. follow-up).
**Deliverable:** `providerClient.streamGeminiText` (SSE) · `transcript.createProseStreamer` (nasconde
scheda) · `orchestrator.runAnalysisStream` · route `POST /api/agent/analyze/stream` (NDJSON, helper auth
condiviso con `/analyze`) · client (display progressivo, salva a fine, interruzione=parziale+avviso).
**Fatto quando:** la risposta scorre progressiva; un'interruzione mostra il parziale + avviso + riprova;
la scheda JSON continua a salvarsi (M4) e non compare mai; validate verde.
**✅ Verificato live (2026-07-01):** streaming progressivo OK, scheda mai a vista, persistenza M4 intatta
(DB: analisi in streaming → `attachments` con scheda completa + campo `avvisi`; follow-up → `attachments []`).

## M6 — Impostazioni  ✅ *(verificato live 2026-07-01 — deep — tocca `profiles`/RLS + catena agente: modello per-utente)*
**Obiettivo:** tema chiaro/scuro (persistito per utente) · cambio password · **modello AI per-account**.
**Context:** `context/IMPOSTAZIONI_CONTEXT.md` ✅ (creato 2026-07-01, intervista Senior).
**Decisioni d'intervista (2026-07-01):**
- **Modello = attributo dell'account, deciso dall'admin** (non una tendina utente): serve a differenziare
  i tier (Flash base / Pro «pro»). Colonna `profiles.ai_model` (nullable → default `.env`), impostata
  **a mano dal DB** per ora. Lista curata: `gemini-2.5-flash` (default) · `gemini-2.5-pro`. Valore
  fuori lista/`null` → fallback al default (mai rompere). Innesto: route → orchestrator → providerClient
  (già accetta `model`); **kit e caching intatti**. UI di gestione = **FU-016** (console super-admin, fuori M6).
  **Decisione live (2026-07-01):** Flash ha completato l'analisi su grafici rispettando i requisiti
  già soddisfatti da Pro; diventa il default per ridurre il costo, mentre Pro resta assegnabile per-account.
- **Impostazioni utente (UI) = solo tema + cambio password.** Il modello non compare qui.
- **Tema** per-utente su DB (`profiles.theme`, default `dark`); Tailwind `darkMode:'class'`.
- **Cambio password** richiede la password attuale (riverifica `signInWithPassword` → `updateUser`).

**Fatto quando:** cambio tema/password e persistono (tema letto dal profilo, indipendente per utente);
un account con `ai_model='gemini-2.5-pro'` usa Pro, `null`/errato usa il default Flash; validate verde.
**✅ Verificato live (2026-07-01):** tema, cambio password e modello per-account provati a mano, tutto OK.

## M7 — Estetica (rifinitura additiva)  ✅ *(revisione passata, validate verde 137+78 — 2026-07-01)*  *(deep — tocca più di una view; solo client, nessun LOCK del cuore)*
**Svolta d'intervista (2026-07-01):** l'estetica definitiva deriva dalla vecchia app:
**dark su slate + accento ciano**, sobrio, **statico**, font di sistema — *non* più
"verde-scuro + sfondo animato" (CONTESTO L19). Il tema chiaro/scuro di M6 resta.
**Context:** `context/ESTETICA_CONTEXT.md` ✅ (creato 2026-07-01, intervista Senior).
**Obiettivo:** dare alla base sobria di M6 il linguaggio visivo concordato **riscrivendo i valori dei token**
(`index.css`) + l'accento verde→ciano (`tailwind.config.js`), senza toccare struttura, catena, DB o auth.
**Deliverable:** token slate chiaro/scuro (§5 del context), accento ciano ovunque, rifinitura forme
(raggi/bordi/shadow) verso Esempio usando i token, tema chiaro derivato e leggibile.
**Fatto quando:** tema scuro slate/ciano, tema chiaro coerente e leggibile, toggle e persistenza
M6 intatti, disclaimer visibile in entrambi i temi, **zero regressioni** (`npm run validate` verde, build OK).
**✅ Fatto (2026-07-01):** token slate chiaro/scuro + accento ciano su tutta l'app, bolle chat allineate a
linguaggio concordato, forme rifinite. La cartella di riferimento è stata rimossa a lavoro concluso.
Revisione dedicata passata (nessun blocco). Verifica visiva live in browser =
**FU-017** (la fa l'utente). **Aperto collegato:** pagina **Home** con sfondo animato (nuova richiesta) —
decisa separatamente.

## M7-bis — Home (landing dopo login)  ✅ *(revisione passata, validate 156+78 + build verdi — 2026-07-01)*  *(deep — nuovo componente + nuova rotta; solo client)*
**Richiesta d'intervista (2026-07-01):** una **Home immersiva** come pagina d'arrivo dopo il login (oggi
si entra dritti in Chat). Nasce da un prompt descrittivo dell'app vecchia (codice non più disponibile).
**Decisioni:** palette **slate+ciano dell'app** (non il verde-smeraldo del prompt) · Home **sempre scura**
(ignora il toggle M6) · font di sistema · Home su `/`, Chat su rotta propria (`/nuova-analisi`).
**Scope ORA (solo estetica + pagina):** rotta+landing ricablati, **`AnimatedTradingBackground`** (particelle
ciano, linee, griglia, gradienti, vignettatura, `prefers-reduced-motion`→statico, meno particelle su mobile),
header minimale, **hero** (badge/titolo/descrizione/disclaimer) con il solo CTA **Nuova analisi**;
lo storico resta nel drawer condiviso. Sotto la hero, la sezione **«Cosa puoi fare»** introduce le
quattro card descrittive. Decoro a candele CSS/SVG e micro-interazioni. **Context:** `context/HOME_CONTEXT.md` ✅.
**Estensioni poi completate:** stato indicativo Londra/New York/Tokyo, card ultima sessione e quattro
FeatureCards descrittive; hero semplificata con un solo CTA «Nuova analisi». Restano fuori dal baseline
calendario, quotazioni live, Trading Live e font custom. Lo stato Tokyo ha un bug noto sugli orari (M8).
**Fatto quando:** dopo il login si arriva in Home; i CTA aprono Chat/storico; flussi esistenti intatti; Home
scura+immersiva anche con toggle chiaro; sfondo animato fluido e non bloccante (statico con reduced-motion);
responsive senza overflow; disclaimer visibile; `npm run validate` verde e build OK.

## M8 — Blindatura demo & deploy  🟡  *(deep)*
**Obiettivo:** demo «blindata» per il cliente. **Deliverable:** gestione errori a vista ovunque,
piano B per l'intervista, QA end-to-end, **deploy**.

**Già implementato:** massimo 5 follow-up per chat (client+server), recinto nel kit, classificatore
d'ingresso e canary (Strati sicurezza 1/2/4). Sono una base, non blindatura completa.

**Finding aperti dell'audit 2026-07-02:**

- disclaimer assente da Login e Impostazioni;
- race cambio-chat/stream e race upload/timeframe; retry vision incompleto;
- limite follow-up aggirabile, storia/ruolo assistant client-authored, niente idempotenza;
- canary streaming non ritira testo già inviato; niente filtro uscita semantico;
- niente timeout/abort/rate limit e body da 25 MB prima dell'auth;
- gestione incompleta di `finishReason`/safety e reject pre-stream;
- stato mercati Tokyo errato e festività non gestite;
- schema Supabase non versionato, invite-only e privilegi non coperti da test sufficienti;
- toolchain dev con vulnerabilità Vite/Vitest; bundle iniziale oltre la soglia Vite;
- QA browser 375/834/1280, temi e flusso completo ancora da eseguire.

**Scadenza modello:** Gemini 2.5 Flash/Pro verranno disattivati il **2026-10-16**; scegliere e
validare il successore con TEST VISTA prima del deploy.

**Aperto:** target di deploy — la demo si prova all'intervista in modo controllato (il cliente non riceve
accesso), quindi può bastare locale o URL privato. **Fatto quando:** percorso utente completo testato e stabile.

**Verifica audit locale (2026-07-01/02, prima del lavoro Journal concorrente):** lint verde, 199 test
client verdi, 106 test server non-RLS verdi, build riuscita con warning chunk. Le suite RLS remote
non sono state rieseguite perché l'ambiente non era confermato come test.

---

## Note di pianificazione

- **TEST VISTA (rischio #1):** si può cominciare con UI grezza già dopo M3. Se Gemini legge male i grafici,
  si rivaluta il modello prima di proseguire.
- Ogni milestone, prima dell'esecuzione, passa per: intervista → `context/` della zona → `PREPARA_PROMPT_SKILL.md` → esecutore → verifica.
- Le stime temporali e l'assegnazione agli agenti si aggiungono quando le milestone vengono dettagliate.
