# HANDOFF — testimone Senior → Senior

> **Solo per l'agente Senior** (prepara-prompt / consulto a monte). Snapshot **vivo** dello stato di
> lavoro, per ripartire da una chat Senior all'altra senza rileggere tutto. Lo si **sovrascrive** a
> ogni fine sessione Senior — **non è cronologia** (quella sta in `SESSION_LOG.md`) né elenco debiti
> (quelli in `FOLLOW_UP.md`): qui sta solo *dove siamo adesso* e *qual è il prossimo passo*.
> Punta agli altri documenti, **non li duplica** (anti-god-object: vedi `REGOLE_ORGANIZZATIVE.md`).
>
> Gli agenti Esecuzione/Verifica **non** leggono né scrivono questo file: ricevono il loro contesto dal
> prompt preparato. È il baton del Senior.
>
> **Ultimo aggiornamento:** 2026-07-01 — **M3·M4·M5·M6·M7 COMPLETI e COMMITTATI**. M6 verificato live
> dall'utente (tema/password/Flash OK) e committato. **M7 — Estetica ✅**: replica di `Esempio/` (dark
> slate + accento ciano al posto del verde) su tutta l'app, riscrivendo i **valori** dei token M6 (nessun
> hardcoded nuovo); revisione dedicata passata, `validate` verde (137+78). Aggiunte due skill: `aree/
> TESTING_SKILL.md` e project skill `.claude/skills/avvia-app/`. **Aperto:** FU-017 (verifica visiva M7 in
> browser, la fa l'utente) e la **decisione su `Esempio/`** legata a una nuova **pagina Home** richiesta
> dall'utente (sfondo animato stile app vecchia — vedi §4). Prossimo: **M8 — blindatura + deploy** (o la
> Home come mini-milestone prima, se l'utente la conferma).

---

## 0. Come usarlo (Senior)

- **In apertura:** leggi questo file **per primo** per sapere dove siamo, poi carica Bussola +
  `CONTESTO_PRODOTTO.md` + `PIANO_LAVORO.md` come da `PREPARA_PROMPT_SKILL.md §0`.
- **In chiusura:** **prima di commit e push** aggiorna le sezioni 1-4 (è un passo obbligatorio dello
  schema di lavoro — vedi `PREPARA_PROMPT_SKILL.md §5` e `CHIUSURA_SESSIONE.md` Parte B).

## 0-bis. STATO GIT — allineato a M7

M3·M4·M5·**M6·M7 committati e pushati**. M6: `fcbf0a6`/`088b2e8`/`e29b19c`. Poi doc M6/M7 (`58070ae`,
`7d0ebca`) e la chiusura M7 (estetica + skill) in cima. `npm run validate` **verde: 137 client + 78 server**
(incluse le RLS live), build OK. Working tree pulito **tranne `Esempio/`** (untracked, non gitignorata):
è la fonte di riferimento visiva, **decisione in sospeso** (§4) — non committata, non cancellata.

## 0-ter. ✅ L'estratto può essere cancellato

`C:\Users\previ\OneDrive\Desktop\EXPORT_CATENA_AGENTE` è stato **portato e adattato interamente nel repo
e verificato** (catena + kit). Non serve più: l'utente può cancellarlo quando vuole. (Il kit reale viene
dal monolite del repo, non dai placeholder dell'estratto — vedi §1-bis.)

## 1. Dove siamo adesso

- **M3 — "accendere il cervello": ✅ COMPLETO.** Catena `skillLoader→promptBuilder→providerClient→
  orchestrator` portata e adattata a **Gemini 2.5 Pro + Supabase**. Dalla chat parte un'**analisi
  reale**: form (con upload screenshot **etichettati per timeframe** + compressione client) → Gemini
  **legge i grafici** (vision) → risposta in prosa kit → salvata e mostrata; follow-up testuali con
  contesto; errori gestiti (mai crash). Report M3:
  `_sessioni-lavoro/2026-06-30/Report-M3-catena-agente-cervello.md`.
- **TEST VISTA (FU-011) ✅ passato (2026-07-01):** analisi su grafici reali verificata dall'utente,
  lettura corretta in stile Aware Trader. **Rischio #1 rientrato** — il prodotto sta in piedi.
- **FU-012 ✅ chiusa (2026-07-01):** slot screenshot per-timeframe + compressione immagini client
  (`_sessioni-lavoro/2026-07-01/Report-FU-011-FU-012-testvista-upload.md`).
- **M4 ✅ COMPLETO e verificato live (2026-07-01):** **trascrizione JSON** dell'analisi al posto dello
  Storage immagini. Gemini emette la scheda nella stessa chiamata (istruzione in coda al turno immagini,
  kit intatto → caching preservato); il server separa prosa/scheda; la scheda va in `messages.attachments`
  come `[{type:'transcript',data:…}]`. Le immagini restano solo in volo, poi scartate → **niente Storage**
  (FU-005 superata). Report: `_sessioni-lavoro/2026-07-01/Report-M4-trascrizione-json.md`.
- **FU-015 ✅ (2026-07-01):** l'agente **segnala gli screenshot non validi** (foto al posto del grafico) a
  inizio risposta + avvisa che l'analisi può essere incompleta; campo `avvisi` nella scheda. Verificato live.
- **M5 ✅ COMPLETO e verificato live (2026-07-01):** **streaming** della risposta. `providerClient.streamGeminiText`
  (SSE) · `transcript.createProseStreamer` (nasconde marcatore/scheda anche se spezzato) · `orchestrator.runAnalysisStream`
  (eventi delta/done) · route `POST /api/agent/analyze/stream` (NDJSON, `/analyze` resta fallback) · client
  progressivo con interruzione=parziale+avviso. Persistenza M4 intatta. Report:
  `_sessioni-lavoro/2026-07-01/Report-M5-streaming.md`.
- **DB verificato (2026-07-01):** analisi in streaming → `messages.attachments` con scheda completa + `avvisi`;
  follow-up → `attachments []`; prosa sempre pulita (marcatore mai a vista).
- **M6 ✅ COMPLETO (2026-07-01):** pagina **Impostazioni** (`/impostazioni`, ingresso dal drawer).
  (a) **Tema** chiaro/scuro persistito su `profiles.theme`, applicato all'avvio (`AuthProvider` + default
  in `main.jsx`) e ad ogni cambio; ora attivo su **tutta** l'app via **palette semantica** centralizzata
  (`index.css` variabili chiaro/scuro + token in `tailwind.config.js`), `color-scheme` dinamico.
  (b) **Cambio password** con riverifica (`signInWithPassword` vecchia → `updateUser` nuova), errori chiari.
  (c) **Modello AI per-account**: `profiles.ai_model` (lista curata `models.js` + `resolveUserModel`), letto in
  `routes/agent.js` e passato `orchestrator → providerClient` (**providerClient invariato**, kit/caching intatti);
  `null`/fuori-lista → default `.env` (fallback mai-crash). **Blindato**: `ai_model` non scrivibile dall'utente
  (privilegi di colonna DB; solo `service_role`). Report: `_sessioni-lavoro/2026-07-01/Report-M6-impostazioni.md`.
- **M2** resta interamente chiuso (chat base, sidebar/storico, RLS).

## 1-bis. Decisioni importanti prese in M3 (per memoria)

1. **Kit reale, non placeholder.** I 7 file kit dell'estratto erano **placeholder in inglese** che
   contraddicevano lo stile-LOCK. Il metodo vero stava nel monolite `Trade_Analysis_Agent_Kit_v3_1_.md`:
   i 7 file `kit/01..09` sono stati popolati col **contenuto reale del monolite**, e il monolite cancellato.
2. **Persistenza lato client.** La route è solo "cervello" (legge la storia da Supabase col token utente,
   chiama Gemini, ritorna il testo). Utente e assistant li **salva il client** via `chatData.addMessage(role)`
   generalizzato (path RLS già testato). Coerente con `AGENTE_AI_SKILL §4.6`.
3. **Isolamento route.** `POST /api/agent/analyze` usa un client Supabase **vincolato al token** (RLS attiva):
   legge solo le chat dell'utente. Nessun service_role nel percorso agente.
4. **Thinking budget.** Gemini 2.5 Pro ragiona e i token di thinking condividono `maxOutputTokens`: tetto
   `thinkingBudget=4096` + `maxOutputTokens=8192` per non avere risposte vuote (`MAX_TOKENS`).
5. **Naming env.** Mantenuti `GOOGLE_API_KEY` + `AI_MODEL` (già reali in `.env.local`), non `GEMINI_API_KEY`.

## 2. Prossimo passo concreto

1. **Decisione Home + `Esempio/` [PROSSIMO — con l'utente]:** l'utente vuole una **pagina Home** (oggi
   all'avvio si entra diretti in «nuova analisi») con **sfondo animato** in stile app vecchia (oggetti/righe
   in movimento, elementi moderni). Ha chiesto: quello sfondo/quella Home sono dentro `Esempio/`? **Verificato:
   NON ci sono** (Esempio ha solo Dashboard/Workspace/Journal statiche, `index.css` minimale, nessun componente
   di animazione). Quindi: o si recupera l'animazione da un'altra fonte, o si costruisce nuova. Da qui dipende
   se `Esempio/` si tiene o si cancella. **Non toccare `Esempio/` finché l'utente non decide.**
2. **FU-017 — verifica visiva M7:** l'utente apre l'app e controlla a occhio tema chiaro/scuro su
   Login/Chat/Sidebar/Impostazioni (desktop+mobile), niente flash, disclaimer leggibile.
3. **M8 (blindatura + deploy)** secondo `PIANO_LAVORO.md`.
4. **FU-016 — console super-admin:** quando servirà, UI admin per assegnare `ai_model` (oggi a mano dal DB) +
   statistiche per-utente. Modello è già blindato lato DB (solo `service_role` scrive `ai_model`).

## 3. Decisioni d'intervista prese e già nei doc

- Tutte le decisioni M3 (modello, attesa, form_context jsonb, no screenshot follow-up, storia, caching,
  thinking budget) sono in `AGENTE_AI_SKILL.md §4` (stato «fatto») e `CHAT_ANALISI_CONTEXT §5/§6`.
- Pulizia minore nota: `CHAT_ANALISI_CONTEXT §6` "Titolo chat" risolto da `buildTitle()` — non bloccante.

## 4. Questioni aperte da portare all'utente

- **Follow-up post-intervista cliente (FU-002/FU-003):** recupero password self-service + validazione email
  reale (richiedono SMTP). In demo: reset a mano dell'admin, email finte ammesse.
- **FU-004 (bassa priorità):** attivare «leaked password protection» nel pannello Supabase Auth prima del prodotto.
- **FU-013 (leva futura):** caching esplicito gestito del blocco kit quando i volumi cresceranno (ora automatico).
- **FU-016 (nuova area admin):** console super-admin per assegnare il modello (oggi a mano dal DB) + statistiche
  per-utente. Sostituirà la gestione manuale introdotta in M6. Definire scope e sicurezza (accesso solo admin).
- **M6 — modello per-account:** la lista curata è `gemini-2.5-flash` / `gemini-2.5-pro` (default). Aggiungerne uno
  = una riga in `server/src/agent/models.js` (nessuna migrazione: `ai_model` senza CHECK di proposito).
- **Home + sfondo animato (nuova richiesta 2026-07-01):** l'utente vuole una Home d'ingresso con sfondo
  animato stile app vecchia. **Non è in `Esempio/`** (verificato). Decidere: fonte dell'animazione (altra
  cartella dell'app vecchia? da ricostruire?), scope, e se sarà una mini-milestone prima di M8. Da questa
  decisione dipende il destino di `Esempio/` (tenere/cancellare).
- Più avanti: deploy target (M8) — `CONTESTO_PRODOTTO.md §11`.
- ~~FU-005 (Storage)~~ **superata** (M4). ~~FU-011~~, ~~FU-014~~, ~~FU-015~~ **risolte**. ~~M7 estetica~~ **fatta** (2026-07-01).

## 5. Puntatori (la verità vive lì, non qui)

| Cosa | Dove |
|------|------|
| Stato milestone / dipendenze | `docs/PIANO_LAVORO.md` |
| Decisioni LOCKED + questioni aperte | `docs/CONTESTO_PRODOTTO.md §2, §11` |
| Interni dell'AI (catena, kit, adattamenti) | `aree/AGENTE_AI_SKILL.md` |
| UI/flusso chat | `context/CHAT_ANALISI_CONTEXT.md` |
| Impostazioni (tema, password, modello per-account) | `context/IMPOSTAZIONI_CONTEXT.md` |
| Debiti tecnici aperti | `sessioni/FOLLOW_UP.md` (aperti: FU-002, FU-003, FU-004, FU-013, FU-016) |
| Storia cronologica sessioni | `sessioni/SESSION_LOG.md` |
| Dettaglio ultima sessione | `_sessioni-lavoro/2026-07-01/Report-M6-impostazioni.md` (gitignored) |
