# ERRORI_PROCESSO — pattern di errore ricorrenti

> Indice dei pattern di errore (non i singoli bug: quelli stanno nei report). Serve all'agente
> Meta per individuare cause sistemiche e proporre correzioni. Ogni report di sessione, nella
> sezione «Derivazione errori», appende qui i pattern che si ripetono.

---

## Tassonomia delle cause

Ogni errore/difficoltà va classificato in una di queste:

| Causa | Significato |
|-------|-------------|
| **bug preesistente** | C'era già nel codice prima del task (citare file). |
| **prompt ambiguo/incompleto** | La richiesta lasciava spazio a interpretazioni o conteneva intenti contraddittori. |
| **errore agente** | Interpretazione sbagliata, tentativo evitabile, scelta tecnica non ottimale. |
| **vincolo strutturale** | Un LOCK / comportamento / architettura preesistente ha bloccato un approccio. |

---

## Pattern ricorrenti

| # | Pattern | Causa tipica | × | Correzione adottata | Stato |
|---|---------|--------------|---|---------------------|-------|
| P1 | Codice completato, context rimasto a «da costruire» o milestone aperta | allineamento documentale rimandato alla chiusura, che non sempre scatta | ricorrente M1–M8 | context aggiornato nello stesso task applicativo, indipendente dal report | regola corretta 02-07-26 |
| P2 | Suite verde ma flussi concorrenti/errori reali non coperti | test centrati sul render/happy path | più aree | revisione cerca race, retry, loading/error e negative path oltre ai test esistenti | aperto |
| P3 | Schema Supabase descritto solo nei Markdown/remoto | migrazioni applicate senza file versionati | M1–M6 | baseline locale obbligatorio prima del prossimo task DB | aperto |
| P4 | File template scambiabili per regole attive | nomi senza suffisso `.template` e placeholder nei documenti vivi | hooks/comunicazione | template marcati esplicitamente e source operative separate | in correzione |

> Quando un pattern si ripete, l'agente Meta valuta se serve una nuova regola nella Bussola o una
> voce di vocabolario per prevenirlo.

---

## Log

- 02-07-26 — audit completo: P1–P4 derivati dal confronto fra cronologia Git, codice, test e skill system.
