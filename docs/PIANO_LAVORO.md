# PIANO DI LAVORO — FREEDOM TRADING SYSTEM (demo)

> Piano a **milestone**. È lo **scheletro vivo**: le milestone esistono, ma il dettaglio di ogni
> schermata (flusso utente + flusso dati) si **riempie via intervista** prima di eseguire, dentro i
> file `context/` dello skill system. Regola: **nessun codice di una zona prima che esista il suo
> `context/`**. Vedi `CONTESTO_PRODOTTO.md` §Schema di lavoro.
>
> Aggiornato: 2026-06-30 · Legenda stato: ⬜ da fare · 🟡 in corso · ✅ fatto · 🔒 bloccato da dipendenza.

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

## M2 — Chat base (senza AI)  ⬜
**Obiettivo:** invio messaggio, salvataggio chat/messaggi, storico in sidebar, isolamento verificato.
**Deliverable:** schema DB (chat, messaggi), pagina Chat, Sidebar+Storico, «nuova chat».
**Context:** `CHAT_ANALISI_CONTEXT.md` ✅ · `SIDEBAR_STORICO_CONTEXT.md` ✅ (creato 2026-06-30, intervista slice 2c) · `DB_SUPABASE_SKILL.md` ✅.
**Fatto quando:** creo una chat, scrivo, ricarico e la ritrovo nello storico.

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

## M4 — Upload screenshot  ⬜
**Obiettivo:** allegati immagine robusti. **Deliverable:** upload + base64, storage Supabase, validazione
formato/dimensione, resize lato client, max N screenshot per analisi (limite per la **finestra di contesto**,
non per i costi — nessun freno costi in demo, vedi CONTESTO L12). **Fatto quando:** allego più immagini,
si vedono in chat, sono isolate per utente.

## M5 — Streaming  ⬜
**Obiettivo:** risposta a pezzi mostrata man mano, senza crash su interruzioni.
**Deliverable:** streaming server→client, indicatore di elaborazione, gestione errori a vista.
**Fatto quando:** la risposta scorre progressiva; un'interruzione mostra errore chiaro + riprova.

## M6 — Impostazioni  ⬜
**Obiettivo:** tema chiaro/scuro (persistito per utente) · cambio password · **selettore modello** (lista curata 2–3 Gemini).
**Context da creare prima:** `IMPOSTAZIONI_CONTEXT.md`. **Fatto quando:** cambio tema/modello/password e persistono.

## M7 — Estetica beta (rifinitura additiva)  ⬜
**Obiettivo:** ricostruire lo stile ricco (sfondo animato, palette verde-scuro, font) senza intaccare la
blindatura del cuore. **Context da creare prima:** `ESTETICA_CONTEXT.md`. **Fatto quando:** look coerente, zero regressioni sui test.

## M8 — Blindatura demo & deploy  ⬜  *(deep)*
**Obiettivo:** demo «blindata» per il cliente. **Deliverable:** gestione errori a vista ovunque,
piano B per l'intervista, QA end-to-end, **deploy**. *(Nessun freno costi — CONTESTO L12; resta solo
`MAX_SCREENSHOT_PER_ANALISI` per la finestra di contesto, non per i costi.)*
**Aperto:** target di deploy — la demo si prova all'intervista in modo controllato (il cliente non riceve
accesso), quindi può bastare locale o URL privato. **Fatto quando:** percorso utente completo testato e stabile.

---

## Note di pianificazione

- **TEST VISTA (rischio #1):** si può cominciare con UI grezza già dopo M3. Se Gemini legge male i grafici,
  si rivaluta il modello prima di proseguire.
- Ogni milestone, prima dell'esecuzione, passa per: intervista → `context/` della zona → `PREPARA_PROMPT_SKILL.md` → esecutore → verifica.
- Le stime temporali e l'assegnazione agli agenti si aggiungono quando le milestone vengono dettagliate.
