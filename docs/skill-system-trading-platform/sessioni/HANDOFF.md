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
> **Ultimo aggiornamento:** 2026-07-01 — **M3 COMPLETO** (cervello + FU-011 test vista + FU-012 upload) e
> **M4 COMPLETO e verificato live**: trascrizione JSON dell'analisi al posto dello Storage immagini (svolta
> d'intervista — niente Storage, FU-005 superata). Prossimo: **M5 — Streaming**.

---

## 0. Come usarlo (Senior)

- **In apertura:** leggi questo file **per primo** per sapere dove siamo, poi carica Bussola +
  `CONTESTO_PRODOTTO.md` + `PIANO_LAVORO.md` come da `PREPARA_PROMPT_SKILL.md §0`.
- **In chiusura:** **prima di commit e push** aggiorna le sezioni 1-4 (è un passo obbligatorio dello
  schema di lavoro — vedi `PREPARA_PROMPT_SKILL.md §5` e `CHIUSURA_SESSIONE.md` Parte B).

## 0-bis. ✅ STATO GIT — allineato

M2 slice 2c e l'intero M3 sono **committati** (`05b5891` docs, `474b39f` 2c+client, `09d046e` catena,
`ab2f0d1` kit). FU-012 (slot screenshot per-timeframe + compressione immagini) chiusa e committata sopra.
`npm run validate` **verde**: **100 test client + 37 test server** (incluse le RLS live).

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
  (FU-005 superata). Verificato su DB: analisi reale BTCUSD → scheda completa salvata. Report:
  `_sessioni-lavoro/2026-07-01/Report-M4-trascrizione-json.md`.
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

1. **M5 — Streaming [PROSSIMO]:** oggi la risposta arriva tutta insieme dopo l'attesa «sta analizzando…».
   M5 la fa scorrere a pezzi (server→client), con indicatore di elaborazione e gestione errori a vista
   (interruzione → messaggio chiaro + riprova). Tocca `providerClient` (streaming Gemini) + route + client.
   ⚠️ Attenzione con M4: la **scheda JSON** arriva in coda alla risposta — in streaming va bufferizzata e
   il marcatore `===SCHEDA_JSON===` **non deve comparire a schermo** (tagliare prima di mostrare). Prima
   dell'esecuzione: intervista → aggiornare `CHAT_ANALISI_CONTEXT`/`AGENTE_AI_SKILL` → prompt esecutore.
2. **Poi M6/M7/M8** secondo `PIANO_LAVORO.md`.

## 3. Decisioni d'intervista prese e già nei doc

- Tutte le decisioni M3 (modello, attesa, form_context jsonb, no screenshot follow-up, storia, caching,
  thinking budget) sono in `AGENTE_AI_SKILL.md §4` (stato «fatto») e `CHAT_ANALISI_CONTEXT §5/§6`.
- Pulizia minore nota: `CHAT_ANALISI_CONTEXT §6` "Titolo chat" risolto da `buildTitle()` — non bloccante.

## 4. Questioni aperte da portare all'utente

- ~~Esito test vista (FU-011)~~ **risolto (2026-07-01):** lettura corretta su grafici reali, rischio #1 rientrato.
- ~~`GOOGLE_API_KEY` formato inusuale (FU-014)~~ **risolto (2026-07-01):** `AQ.Ab8...` è il nuovo
  formato ufficiale delle Google API key. Chiave valida e stabile, nessuna azione.
- **Policy Storage allegati (FU-005):** da scrivere a M4, prima di spostare gli screenshot su Storage.
- Più avanti: deploy target · modelli nello switcher · estetica beta — `CONTESTO_PRODOTTO.md §11`.

## 5. Puntatori (la verità vive lì, non qui)

| Cosa | Dove |
|------|------|
| Stato milestone / dipendenze | `docs/PIANO_LAVORO.md` |
| Decisioni LOCKED + questioni aperte | `docs/CONTESTO_PRODOTTO.md §2, §11` |
| Interni dell'AI (catena, kit, adattamenti) | `aree/AGENTE_AI_SKILL.md` |
| UI/flusso chat | `context/CHAT_ANALISI_CONTEXT.md` |
| Debiti tecnici aperti | `sessioni/FOLLOW_UP.md` (aperti: FU-002, FU-003, FU-004, FU-005, FU-011, FU-012, FU-013, FU-014) |
| Storia cronologica sessioni | `sessioni/SESSION_LOG.md` |
| Dettaglio ultima sessione | `_sessioni-lavoro/2026-06-30/Report-M3-catena-agente-cervello.md` (gitignored) |
