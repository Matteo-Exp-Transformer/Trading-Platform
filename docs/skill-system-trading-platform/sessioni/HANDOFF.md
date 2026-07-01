# HANDOFF — testimone Senior → Senior

> Solo Prepara/Senior. Snapshot vivo, non cronologia.
> Aggiornato: 2026-07-02 dopo audit completo della baseline tracciata.

## 1. Stato

- M0–M7-bis completate: monorepo, Auth/RLS, Chat/storico, agente Gemini vision, trascrizione JSON,
  streaming, Impostazioni, tema e Home.
- M8 è **in corso**: limite 5 follow-up e guardrail base (recinto, classificatore, canary) esistono,
  ma l'audit ha dimostrato che non sono una blindatura completa.
- Test audit baseline: lint verde; 199 client verdi; 106 server non-RLS verdi; build riuscita con
  warning chunk. RLS remoto non rieseguito senza conferma ambiente.
- Schema Supabase operativo sul remoto ma non versionato in `supabase/migrations`: criticità aperta.
- Gemini 2.5 Flash/Pro hanno shutdown annunciato per 2026-10-16.

## 2. Prossimo blocco consigliato

Preparare un ciclo **M8 hardening** ordinato per rischio:

1. ripristino disclaimer Login/Impostazioni;
2. race chat/stream, composer durante load/error e retry vision;
3. race upload + posizione incompleta;
4. limite server idempotente e persistenza assistant server-authoritative;
5. timeout/abort/rate limit/body validation e gestione reject/finishReason;
6. filtro uscita/canary coerente e drift del kit;
7. baseline Supabase versionato + test Auth/RLS negativi;
8. correzione stato Tokyo, accessibilità drawer e QA browser;
9. upgrade toolchain dev, code splitting e deploy;
10. migrazione modello con nuovo TEST VISTA.

Non accorpare tutto in una singola esecuzione: sono più WP deep con review indipendenti.

## 3. Decisioni attive

- Prima analisi + massimo 5 follow-up per chat (CONTESTO_PRODOTTO L20).
- Screenshot soltanto nel primo turno; non vengono conservati.
- Modello account admin-only; default attuale Flash.
- Home sempre scura; Chat/Impostazioni seguono il tema.
- Sicurezza conversazionale come `context/SICUREZZA_CONTEXT.md`, con gap dichiarati.
- Nessuna scrittura Supabase remota senza ambiente verificato; produzione richiede conferma.

## 4. Lavoro concorrente da non inglobare

Il worktree contiene un'implementazione **Journal** non tracciata/modificata da un altro agente
(`client/src/components/journal/`, `Journal.jsx`, test, `JOURNAL_CONTEXT.md` e file collegati).
Questo audit non l'ha revisionata né modificata. Prima di considerarla parte della baseline:

- attendere la chiusura del relativo agente;
- revisionare diff, flusso dati, RLS e test;
- allineare routing, piano e context senza sovrascrivere quel lavoro.

Anche `sessioni/FOLLOW_UP.md` è modificato da quel lavoro e resta intoccabile in questa sessione.

## 5. Fonti

| Tema | Fonte |
|------|-------|
| Decisioni prodotto | `docs/CONTESTO_PRODOTTO.md` |
| Milestone e finding M8 | `docs/PIANO_LAVORO.md` |
| Routing/LOCK | `00_BUSSOLA_SKILL.md` |
| Motore e sicurezza | `aree/AGENTE_AI_SKILL.md`, `context/SICUREZZA_CONTEXT.md` |
| DB/RLS | `aree/DB_SUPABASE_SKILL.md` |
| Chat/UI | `context/CHAT_ANALISI_CONTEXT.md` |
| Test sicuri/remoti | `aree/TESTING_SKILL.md` |
| Debiti differiti | `sessioni/FOLLOW_UP.md` (dopo chiusura lavoro concorrente) |
