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
> **Ultimo aggiornamento:** 2026-06-30 — fine slice 2b M2 (Chat UI base, no AI).

---

## 0. Come usarlo (Senior)

- **In apertura:** leggi questo file **per primo** per sapere dove siamo, poi carica Bussola +
  `CONTESTO_PRODOTTO.md` + `PIANO_LAVORO.md` come da `PREPARA_PROMPT_SKILL.md §0`.
- **In chiusura:** **prima di commit e push** aggiorna le sezioni 1-4 (è un passo obbligatorio dello
  schema di lavoro — vedi `PREPARA_PROMPT_SKILL.md §5` e `CHIUSURA_SESSIONE.md` Parte B).

## 1. Dove siamo adesso

- **Milestone corrente:** M2 — Chat base (senza AI).
- **Ultima slice chiusa:** 2b — **Chat UI base (no AI)**. Form guidato *leggero* (solo campi testuali,
  niente screenshot/AI) → crea una chat + primo messaggio = riepilogo leggibile (`buildSummary`);
  pagina Chat con bolle (`MessageBubble`/`ChatPanel`) + composer; persistenza su `chats`/`messages` via
  `supabase-js` (anon + sessione utente → RLS). Bug dropdown asset (testo bianco invisibile) **corretto
  in revisione**. **61 test verdi** (57 client + 4 server, inclusi i test RLS isolamento chat),
  `validate` verde. File: `client/src/pages/Chat.jsx`, `client/src/components/chat/*`,
  `client/src/lib/chatData.js`, `client/src/lib/formUtils.js`. Report:
  `_sessioni-lavoro/2026-06-30/Report-M2-chat-ui-base.md`.
- **Stato catena:** nessun prompt esecutore in attesa, nessuna intervista a metà. Pronti per la slice 2c.

## 2. Prossimo passo concreto

1. **Slice 2c — Sidebar/Storico + nuova chat + rinomina:** richiede **prima** di creare
   `context/SIDEBAR_STORICO_CONTEXT.md` (**intervista breve**: ordinamento storico per `updated_at desc`,
   come si seleziona una chat dalla lista, rinomina titolo, comportamento "nuova chat"). I pezzi sono già
   tracciati: **FU-008** (lista/apertura storico) e **FU-009** (rinomina). Modello esecutore: Sonnet/Haiku
   (UI meccanica, basso rischio LOCK).
2. **Poi M3 — Innesto cervello + TEST VISTA** *(deep — LOCK kit/catena agente)*: collega Gemini, prima
   analisi end-to-end, test vista su grafici reali (rischio #1). Qui rientrano FU-010 (contesto-form
   strutturato) e la conferma di "storia inviata al modello" (CHAT_ANALISI §6).

## 3. Decisioni d'intervista prese ma non ancora nei doc

- **Slice 2b (form leggero):** deciso con l'utente di rimandare a M3 il form completo (screenshot + prompt
  AI) e fare ora solo i campi testuali che creano la chat. Già riflesso nel codice e in
  `CHAT_ANALISI_CONTEXT §8`; il form §4 resta la specifica completa da realizzare a M3/M4.
- Nessun'altra pendente.

## 4. Questioni aperte da portare all'utente (intervista)

- **Slice 2c:** dettagli Sidebar/Storico (vedi §2) — da raccogliere quando la si avvia.
- **M3:** dove persistere il contesto-form strutturato per l'AI (FU-010) e quale storia inviare al modello
  (CHAT_ANALISI §6) — da confermare col test vista.
- Più avanti (non urgenti): deploy target · modelli nello switcher · elementi estetica beta —
  tracciate in `CONTESTO_PRODOTTO.md §11`.

## 5. Puntatori (la verità vive lì, non qui)

| Cosa | Dove |
|------|------|
| Stato milestone / dipendenze | `docs/PIANO_LAVORO.md` |
| Decisioni LOCKED + questioni aperte | `docs/CONTESTO_PRODOTTO.md §2, §11` |
| Debiti tecnici aperti | `sessioni/FOLLOW_UP.md` (aperti: FU-002, FU-003, FU-004, FU-005, FU-008, FU-009, FU-010) |
| Storia cronologica sessioni | `sessioni/SESSION_LOG.md` |
| Dettaglio dell'ultima sessione | `_sessioni-lavoro/AAAA-MM-GG/Report-*.md` (gitignored) |
