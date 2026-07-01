# Evoluzione skill system — stato operativo

> Aggiornato: 2026-07-02. Questo file governa l'evoluzione del sistema, non il codice dell'app.
> Le idee non diventano regole senza decisione dell'utente.

## 1. Principio: Markdown ≠ enforcement

- Una regola Markdown orienta l'agente ma non garantisce l'esecuzione.
- Un hook/config/test può fermare davvero un'azione.
- In questa repository gli hook sotto `hooks/` sono **template non installati**.
- Non dichiarare attivi controlli automatici finché non esistono config installata, path adattati
  e un test positivo/negativo del comportamento.

Per i coding agent l'enforcement reale oggi è:

- Git e worktree per delimitare le modifiche;
- ESLint/Vitest/build;
- RLS sul DB remoto;
- policy di autorizzazione della piattaforma Codex;
- LOCK sempre caricati da `AGENTS.md` + `$freedom-trading-workflow`.

## 2. Compiti del Meta senior

1. Confrontare codice, lockfile, test e documenti vivi.
2. Separare stato reale, decisioni prodotto, proposte e storia.
3. Correggere drift documentali senza trasformare bug in comportamento voluto.
4. Tenere Bussola <250 righe e ogni context raggiungibile dal routing.
5. Verificare che template/segnaposto non sembrino regole attive.
6. Misurare attrito solo con dati reali; niente autopagelle.
7. Distinguere una lacuna di governance da una lacuna che richiede codice/hook/test.

## 3. Roadmap attuale

| Milestone sistema | Stato | Prossimo criterio |
|-------------------|-------|-------------------|
| Routing e profili | attivo | ogni area reale raggiungibile; sub-task compositi sequenziali |
| Context allineati al codice | in consolidamento | nessun «da costruire» su feature esistenti |
| Chiusura a due segnali | attivo | «lavoro ok» ≠ «report finale» |
| Hook fine-sessione/guard PROD | non installati | adattare template e provarli prima di abilitarli |
| Metriche sessione | non attive | definire solo se servono decisioni concrete |
| Sottosistema didattico | non attivo | nessun coding agent dà lezioni |

## 4. Risultato audit 2026-07-02

Correzioni sistemiche emerse:

- l'allineamento context↔codice va completato nello stesso task, non rimandato al comando di chiusura;
- i task compositi usano profili in sequenza (Verifica → Meta), non un profilo ibrido;
- `npm run validate` non è un gate innocuo: include test RLS remoti;
- i file hook generici devono avere suffisso `.template`;
- i conteggi test copiati nei context diventano presto falsi: eseguire e riportare l'esito reale;
- il DB remoto senza migrazioni versionate è un punto cieco che il Markdown non può compensare.

Pattern e cause sono in `ERRORI_PROCESSO.md`.

## 5. Metriche

Nessun registro numerico è attivo. Se l'utente decide di introdurlo, raccogliere soltanto dati
oggettivi utili a una decisione:

- prompt sostanziali;
- correzioni richieste;
- finding sfuggiti ai test;
- task rialzati di modalità;
- drift context rilevati;
- esiti delle voci Liv.2.

Il voto sintetico, se richiesto, è del Meta che confronta più fonti; non dell'esecutore.

## 6. Log idee

- 02-07-26 · aggiungere un check documentale CI per marcatori `</content>`/`</invoke>`, path mancanti
  e parole «da costruire» nei context di feature esistenti.
- 02-07-26 · separare script `test:unit` e `test:rls`, con guard esplicito sul project ref di test.
- 02-07-26 · valutare hook PROD solo dopo baseline Supabase versionato e ambienti distinti.
