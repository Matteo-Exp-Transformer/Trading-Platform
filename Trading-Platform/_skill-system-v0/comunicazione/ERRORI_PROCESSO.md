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
| P1 | {{descrizione pattern}} | {{causa}} | {{n}} | {{come si è evitato}} | {{aperto/risolto}} |

> Quando un pattern si ripete, l'agente Meta valuta se serve una nuova regola nella Bussola o una
> voce di vocabolario per prevenirlo.

---

## Log (cronologia append dai report)

- 15-06-26 — **Apostrofi italiani in stringhe a singola virgoletta**: costanti esportate con `l'ora` / `un'altra` dentro `'...'` generano 26 errori TypeScript (unterminated string). Correzione: usare `"..."` o template literal per testo italiano con apostrofi. Causa: errore agente.
- 15-06-26 — **`not.toContain` su classi CSS vs contenuto body**: asserzione `expect(html).not.toContain('info-box')` fallisce perché la classe compare nel `<style>` di `BASE_STYLE` oltre che nel body. Correzione: scegliere token specifici del blocco che si vuole assente (es. `summary-block` invece di `info-box`). Causa: errore agente.
