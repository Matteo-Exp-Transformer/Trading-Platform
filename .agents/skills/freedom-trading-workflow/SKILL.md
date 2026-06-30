---
name: freedom-trading-workflow
description: >-
  Avvia e governa qualsiasi sessione Codex nella repository FREEDOM TRADING SYSTEM secondo il
  metodo documentale del progetto. Usare per preparare prompt, intervistare, pianificare,
  implementare, correggere, diagnosticare, revisionare, testare o affinare lo skill system;
  instrada al profilo e al context corretti, applica LOCK, modalità light/standard/deep e
  protocollo di chiusura. Non usare come metodo di analisi trading dell'app: quello vive nel kit
  runtime.
---

# Freedom Trading Workflow

Operare come adattatore Codex del sistema canonico in
`docs/skill-system-trading-platform/`. Non duplicare né reinterpretare quel sistema.

## 1. Mettere in sicurezza la sessione

1. Eseguire `git status --short` prima di qualsiasi scrittura.
2. Considerare intoccabili le modifiche e i file non tracciati preesistenti di altri agenti.
3. Non aprire `.env.local` o `_private/`. Non mostrare segreti.
4. Leggere interamente:
   - `docs/skill-system-trading-platform/00_BUSSOLA_SKILL.md`;
   - `docs/skill-system-trading-platform/comunicazione/COMUNICAZIONE_SKILL.md`;
   - `docs/skill-system-trading-platform/comunicazione/VOCABOLARIO.md`.
5. Interpretare come attive soltanto le voci compilate e approvate. Ignorare esempi, commenti,
   file template e segnaposto `{{...}}`.

Mostrare la checklist di apertura prevista da `COMUNICAZIONE_SKILL.md` quando occorre applicare il
vocabolario o chiedere decisioni prima di lavorare.

## 2. Scegliere un solo profilo

Scegliere dal deliverable, non da una parola isolata.

### Prepara / Senior

Usare quando l'utente dice «prepara», chiede un prompt, un'intervista o l'orchestrazione del ciclo.

1. Leggere per primo `docs/skill-system-trading-platform/sessioni/HANDOFF.md`, se esiste.
2. Leggere `PREPARA_PROMPT_SKILL.md`, `docs/CONTESTO_PRODOTTO.md`,
   `docs/PIANO_LAVORO.md` e `sessioni/FOLLOW_UP.md`.
3. Non aprire né modificare codice.
4. Consegnare il prompt completo e delimitato secondo la skill Prepara Prompt.

### Esecuzione

Usare per feature, fix o modifiche richieste.

1. Applicare la tabella di routing della Bussola a ogni sub-task.
2. Leggere interamente il context/skill d'area instradato e i file di codice collegati.
3. Se il context è marcato «da creare» o manca, non scrivere codice: richiedere prima la mappatura.
4. Implementare soltanto gli output richiesti, con test proporzionati.

### Verifica

Usare per diagnosi, review, debug e test.

1. Caricare il context dell'area e la guida testing attiva, se presente.
2. Confrontare richiesta, diff reale, flusso utente e flusso dati.
3. Cercare attivamente regressioni, limiti e rotture, non limitarsi a confermare i test esistenti.
4. Diagnosticare e riferire. Correggere solo se l'utente ha chiesto anche il fix.
5. Non dichiarare QA responsive se non è stato realmente eseguito.

### Meta

Usare per affinare comunicazione o skill system.

1. Leggere soltanto i documenti `comunicazione/` instradati dalla Bussola e le regole organizzative.
2. Non modificare codice applicativo.
3. Separare dati grezzi, proposte e regole approvate. Non promuovere una regola senza decisione
   esplicita dell'utente.

## 3. Assegnare la modalità

- `light`: modifica piccola, una zona, nessun LOCK o trigger deep.
- `standard`: feature/fix normale in una zona.
- `deep`: DB, migrazioni, Supabase, RLS, produzione, auth/account, segreti, LOCK, più view, nuovo
  componente o nuovo comportamento.

Nel dubbio scegliere il livello superiore. Durante il lavoro si può soltanto alzarlo.

## 4. Stabilire le fonti corrette

Applicare questa precedenza:

1. `docs/CONTESTO_PRODOTTO.md` per decisioni e perimetro.
2. `docs/PIANO_LAVORO.md` e, per il Senior, `sessioni/HANDOFF.md` per lo stato.
3. Bussola, skill d'area e context per procedura e invarianti.
4. Codice, configurazioni e lockfile per comportamento e valori effettivi.

Quando le fonti divergono, segnalare il drift. Non aggiornare documenti o codice fuori dagli output
autorizzati. Non considerare esistenti path descritti come previsti.

## 5. Applicare i cancelli prima di scrivere

- Preservare tutti i LOCK definiti in `AGENTS.md` e nella Bussola.
- Leggere per intero ogni file da modificare e i diretti collegati.
- Cercare prima di creare: niente helper, componenti o regole duplicate.
- Non creare output collaterali, refactor o asset non richiesti.
- Per DB/Supabase verificare progetto e ambiente prima di ogni mutazione; produzione richiede conferma.
- Per UI verificare anche stati di caricamento, errore, vuoto e comportamento responsive pertinente.
- Per JavaScript eseguire `node --check` sui file applicabili e il test più vicino; prima della
  consegna eseguire `npm run validate` quando il rischio e l'ambiente lo consentono.

## 6. Comunicare e chiudere

Comunicare in italiano, in modo breve e concreto. Dire cosa cambia per l'utente, chi deve agire e cosa
resta fuori scope.

Eseguire il protocollo di `comunicazione/CHIUSURA_SESSIONE.md` soltanto quando il relativo grilletto
è stato dato:

- `light`: aggiornamento minimo previsto dal protocollo;
- `standard/deep`: report e allineamenti previsti;
- «lavoro ok»: report, nessun commit;
- «report finale»: verifica finale e proposta di commit/push, sempre su conferma.

Non avviare sub-agent o controverifiche automaticamente: farlo solo se l'utente lo chiede
esplicitamente e la sessione lo consente.
