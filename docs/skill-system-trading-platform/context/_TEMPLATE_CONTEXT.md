# {{NOME_ZONA}} — file di contesto

> Mappa di dettaglio di una grande zona del progetto. L'agente la apre **solo** quando il task
> tocca questa zona (instradato dalla Bussola). Qui stanno i dettagli che NON devono ingombrare
> la bussola: componenti, invarianti, gotcha, breakpoint, decisioni consolidate.

> **Trigger di routing:** {{parola di vocabolario o frase}} → questo file.

---

## 1. Cos'è questa zona

{{1-2 frasi: cosa fa questa parte del progetto, dal punto di vista dell'utente finale.}}

## 2. File coinvolti

| File | Ruolo |
|------|-------|
| {{path}} | {{cosa fa}} |

## 3. Invarianti / LOCK locali

```
LOCK  {{file}} — {{perché non toccarlo}}
RULE  {{regola che vale dentro questa zona}}
```

## 4. Dettagli di implementazione (le «Nota:»)

> Qui vanno i dettagli granulari. Ogni nota appartiene a **una sola** zona — se un dettaglio
> riguarda due zone, decidi quale è la sua casa e nell'altra metti solo un rimando.

- **{{titolo dettaglio}} ({{GG-MM-AA}}):** {{spiegazione del comportamento/decisione, file
  coinvolti, cosa non rompere}}.

## 5. Come estendere senza rompere

{{Indicazioni per aggiungere funzionalità a questa zona rispettando gli invarianti.}}

## 6. Report di sessione collegati

- {{path al report che ha toccato questa zona}}
