# AGENTS.md — ingresso Codex (FREEDOM TRADING SYSTEM)

> Questo file è la porta d'ingresso sempre caricata da Codex. Il metodo operativo resta nella sua
> unica fonte di verità: `docs/skill-system-trading-platform/`. Per ogni lavoro nella repository usa
> la skill repo-scoped `$freedom-trading-workflow`.

## Avvio obbligatorio

1. Usa `$freedom-trading-workflow` prima di esplorare o modificare la repository.
2. Scegli il profilo dal risultato richiesto:
   - **Prepara/Senior**: prepara prompt, intervista o piano; non apre né modifica codice.
   - **Esecuzione**: implementa feature o fix richiesti.
   - **Verifica**: diagnostica, revisiona e testa; non aggiunge feature.
   - **Meta**: lavora sullo skill system; non modifica il codice dell'app.
3. Classifica la sessione `light`, `standard` o `deep`. È `deep` se tocca DB/Supabase/RLS,
   autenticazione, segreti, un LOCK, più view o un nuovo comportamento.
4. Carica soltanto i documenti instradati dalla Bussola. Se il context richiesto manca o più aree
   confliggono, fermati e chiedi: non inventare la mappa.

## Fonti e precedenza

- Orientamento e LOCK: `docs/skill-system-trading-platform/00_BUSSOLA_SKILL.md`.
- Decisioni di prodotto: `docs/CONTESTO_PRODOTTO.md`.
- Stato milestone: `docs/PIANO_LAVORO.md`.
- Routing e procedure: `docs/skill-system-trading-platform/`.
- Implementazione, valori e dipendenze effettive: codice e `package-lock.json`.
- Per sessioni Senior, leggere per primo
  `docs/skill-system-trading-platform/sessioni/HANDOFF.md`, se presente.

I file `_TEMPLATE_*`, `*.template`, `ESEMPIO_*` e i segnaposto `{{...}}` sono materiale di modello,
non regole attive. Se documentazione e codice divergono, non correggere silenziosamente: segnala il
drift e applica la fonte competente sopra.

## LOCK permanenti

- `kit/`: metodo Aware Trader, solo lato server; mai esporlo al client.
- Catena agente prevista `skillLoader → promptBuilder → providerClient → orchestrator`: preservarla;
  l'adattamento provider riguarda soltanto `providerClient`.
- `.env.local`, chiavi AI e Supabase `service_role`: mai leggere, stampare, committare o portare nel
  client. La chiave anon/publishable Supabase è pubblica per design; la sicurezza dipende dalla RLS.
- Isolamento utente: ogni dato di prodotto deve restare owner-only tramite RLS e test espliciti.
- Disclaimer: «Strumento di supporto all'analisi tecnica. Non è consulenza finanziaria.»

Per un file o comportamento LOCK: leggi prima tutti i file collegati, misura l'impatto e non procedere
se la richiesta viola un invariante senza una decisione esplicita dell'utente.

## Regole di lavoro

- Prima di editare, leggi per intero il file interessato e i collegati; cerca implementazioni esistenti
  prima di creare helper o componenti.
- Non scrivere codice di una zona priva del relativo `context/`.
- Non modificare né includere nel lavoro file cambiati da altri agenti. Controlla `git status` e limita
  patch, test e staging ai file del task.
- Non aprire `_private/` né `.env.local`. I report in `_sessioni-lavoro/` si leggono solo quando la
  procedura di sessione lo richiede.
- Tutto in italiano: UI, documentazione e comunicazione. Con l'utente parla per effetti e flussi,
  breve e senza gergo non richiesto.
- Una funzione nuova o modificata richiede almeno un test pertinente. Nessun merge con test rossi.
- Non fare commit o push senza richiesta esplicita.
- Non delegare o avviare sub-agent se l'utente non lo chiede esplicitamente.

## Comandi verificati

```bash
npm run dev
npm run build
npm test
npm run lint
npm run validate
node --check <file.js>
```

`npm run validate` esegue lint e test. I test RLS usano Supabase remoto e variabili locali: prima di
eseguirli verifica l'ambiente; non effettuare mai scritture su produzione senza conferma esplicita.

## Chiusura

La chiusura scatta solo sui comandi approvati descritti in
`docs/skill-system-trading-platform/comunicazione/VOCABOLARIO.md` e
`docs/skill-system-trading-platform/comunicazione/CHIUSURA_SESSIONE.md`. «Lavoro ok» scrive il
report ma non pubblica; «report finale» prepara
commit/push e richiede comunque conferma. Non trasformare una normale risposta finale in burocrazia
di chiusura se l'utente non ha dato il relativo segnale.
