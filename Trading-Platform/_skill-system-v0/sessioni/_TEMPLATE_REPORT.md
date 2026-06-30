# Report fine sessione — {{titolo}}

**Data:** {{GG-MM-AA}}
**Profilo agente:** {{Esecuzione | Verifica | Meta}}
**Modalità:** {{light | standard | deep}} {{(+ nota se alzata in corsa e perché)}}
**Test:** {{esito validate / N/A}}

> **light** → questo file non serve: basta 1 riga in `SESSION_LOG.md`. Compila il report solo per **standard**/**deep**.
> **Come compilare ogni sezione (fonte unica):** `comunicazione/CHIUSURA_SESSIONE.md` Parte A.

---

## In 3 righe (milestone M2 — sempre in cima)

- **Cosa è cambiato:** {{1 frase, effetto per l'utente finale}}
- **Cosa resta:** {{lavori aperti / follow-up, o «niente»}}
- **Serve una tua azione:** {{sì — cosa / no}}

---

## Sintesi per l'utente

{{2-4 frasi in linguaggio concreto: cosa è cambiato dal punto di vista dell'utente finale.}}

## Cosa è stato fatto (cronologico)

1. {{...}}

## File toccati e perché (linguaggio utente)

> Non «ho modificato X.tsx» → «ora quando l'utente apre Y vede Z».

- {{...}}

## Domande poste e risposte

| Domanda | Risposta |
|---------|----------|
| {{...}} | {{...}} |

## Test eseguiti

{{comando_validate}} → {{esito}}. {{QA manuale se profilo Verifica.}}

## File di skill aggiornati (obbligatorio — anche se «nessuno»)

> **Allineamento skill = implicito, NON una domanda all'utente.** Se il diff ha cambiato un
> layout/comportamento descritto in un file di skill/context, quel file va aggiornato **in questa
> chiusura** e la riga va qui. «nessuno» vale solo se nessun file skill copre la zona toccata (scrivi
> il motivo). Vietato rimandare l'allineamento a «al prossimo giro».

| File | Modifica (breve) | Perché |
|------|------------------|--------|
| {{...}} | {{...}} | {{...}} |

## Dati comunicazione (obbligatorio standard/deep)

- **Frasi ricorrenti (con conteggio):** {{...}}
- **Spiegazioni che hanno funzionato:** {{...}}
- **Prompt dell'utente (verbatim dove utile):** {{...}}
- **Esiti voci Liv.2 applicate:** {{voce · esito}}
- **Candidate nuove parole (→ PROPOSTE.md):** {{...}}
- **Automatizzabile vs manuale:** {{...}}

### Analisi flusso prompt, efficienza e statistiche (obbligatoria standard/deep)

- **N° prompt sostanziali:** {{N}} · **correzioni dopo la 1ª risposta:** {{N}} · **follow-up generati:**
  {{N}} · **modalità alzata in corsa:** {{sì/no}}.
- **Anatomia:** {{cosa ha reso i prompt efficaci o ambigui; cosa replicare/migliorare}}.

## La TUA lettura della sessione ⭐ (obbligatoria standard/deep)

> La tua **versione di agente** su com'è andato il lavoro CON lo skill system — come DATI, NON un voto
> sintetico (il voto lo dà il Meta confrontando le versioni: `REVISIONE.md` §8).

- **Impressioni:** {{cosa ha funzionato e cosa no lavorando col sistema}}
- **Difficoltà + come le hai risolte:** {{anche piccole}}
- **Migliorie che suggeriresti** (come dato, non da applicare da solo): {{...}}

## Lezione della chat (OPZIONALE — solo se didattico attivo E profilo Meta/senior)

> Vedi `comunicazione/CHIUSURA_SESSIONE.md` §8-bis. **Solo l'agente senior/Meta** la compila; gli agenti
> di lavoro normali la saltano. Chiesta all'utente **prima** del report: se ha rifiutato → scrivi solo
> «lezione saltata» e ferma qui.

- **Richiamo spaced-repetition (2-3 termini vecchi):** {{termine · esito}}
- **1. Lezione ricevuta:** {{termini/metodi emersi e cosa insegnano, ancorati alla chat}}
- **2. Deciso da sé:** {{(a) risposte guidate · (b) idee autonome — esempi dalla chat; (b) vale di più}}
- **3. Deciso bene/male:** {{onesto; nomina l'anti-pattern — es. scope creep}}
- **4. Cosa ho appreso:** {{in consolidamento}}
- **5. Da consolidare:** {{→ coda richiamo del GLOSSARIO_VIVO}}

## Derivazione errori (obbligatorio — anche se «nessuna difficoltà»)

| Causa | Cosa è successo | Da cosa derivava | Come si eviterà |
|-------|-----------------|------------------|-----------------|
| {{bug preesistente / prompt ambiguo / errore agente / vincolo strutturale}} | {{...}} | {{...}} | {{...}} |

> Pattern ricorrenti → appendere anche in `comunicazione/ERRORI_PROCESSO.md`.

## Cosa resta per la prossima sessione

- {{...}} (sincronizzare con `FOLLOW_UP.md`)

## Checklist di chiusura mostrata all'utente

> (vedi `comunicazione/COMUNICAZIONE_SKILL.md` §3 — incollala in chat alla chiusura)

## Commit proposti (su conferma utente)

```text
{{tipo(scope): soggetto}}

Review:
- {{path report}}
- {{riga SESSION_LOG}}
- {{eventuali FU}}
```
