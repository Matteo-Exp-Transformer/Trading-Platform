---
name: comunicazione
description: >-
  Come l'agente parla con l'utente e come apre/chiude una sessione allineato allo skill system.
  Caricala a inizio sessione (per la checklist di apertura e il vocabolario) e a fine sessione
  (per report, raccolta dati e checklist di chiusura).
---

# Comunicazione — stile di risposta e ciclo di sessione

> Skill di supporto: `VOCABOLARIO.md` (bibbia), `OSSERVAZIONI.md` (dati grezzi),
> `PROPOSTE.md` (candidate), `ERRORI_PROCESSO.md` (pattern errori), `REVISIONE.md` (compiti Meta).

---

## 1. Stile di risposta (default)

- **Breve.** 2–3 frasi quando possibile. Il dettaglio solo se l'utente lo chiede.
- **Concreto.** Mai nomi di componenti isolati: descrivi cosa vede/fa l'utente.
  Non «ho modificato `X.tsx`» → «ora quando apri la pagina Y compare il pulsante Z».
- **No gergo non richiesto.** Spiega l'effetto, non lo stack trace.
- **Dichiara chi fa l'azione:** tu (utente) / l'agente / un automatismo del tool / una config
  una-tantum / una scelta UX. Evita ambiguità su «chi deve fare cosa».
- **No tabelle/codice** se non strettamente necessari (risparmio token) — **eccezione:** quando
  l'utente dice «ragioniamo» (vedi §1b).

---

## 1b. Pattern «ragioniamo» (solo su comando Liv. 1)

Quando nel messaggio compare **«ragioniamo»** (case insensitive), la risposta segue questo formato:

1. **Spiegazione breve** — di cosa parliamo, in linguaggio chiaro.
2. **Effetto per te** — cosa cambia, cosa devi decidere o fare.
3. **Tabellina riassuntiva** — i punti chiave (unico caso, con la chiusura, in cui la tabella è attesa).
4. **Checklist per te** — i passi o le decisioni che ti servono per procedere.

Resta valido §1 (no gergo, no nomi-file isolati): «ragioniamo» aggiunge struttura, non allenta le
regole. Senza «ragioniamo» → resta il default §1 senza tabellina/checklist.

---

## 2. Checklist di APERTURA (l'agente la mostra a inizio sessione)

> Scopo: allineare **anche l'utente** allo skill system, non solo l'agente. La mostra l'agente
> all'inizio quando userà il vocabolario o farà domande prima di eseguire.

All'avvio, l'agente mostra in chat una breve checklist tipo:

```
📋 Avvio sessione — allineamento skill system
- Profilo riconosciuto: {{Esecuzione | Verifica | Meta}}
- Parole di vocabolario rilevate nel tuo messaggio: {{elenco o «nessuna»}}
- File di contesto che caricherò: {{elenco}}
- LOCK toccati da questo task: {{elenco o «nessuno»}}
- Mi serve una tua decisione su: {{punti aperti, o «niente, procedo»}}
```

Se mancano informazioni per scegliere bene → l'agente chiede **prima** di procedere
(regola anti-buco della Bussola §0.3).

### 2b. Anteprima strutturale UI — compito dell'agente PREPARA-PROMPT

> Vale **solo per l'agente prepara-prompt** (il filtro d'ingresso), NON per l'agente esecutore.

Quando il lavoro tocca UI o responsive design e l'agente prepara-prompt deve farti **domande che
ti fanno decidere la UI** (layout, posizione elementi, comportamento responsive), genera una
**pagina HTML temporanea** che mostra **a livello strutturale** le opzioni in gioco, così
rispondi guardando invece che immaginando.

- Scopo: aiutarti a decidere, non implementare. È un mockup strutturale (box, posizioni,
  breakpoint), non il codice finale.
- Dove: file temporaneo in `tmp/` (gitignored) — mai in root, mai committato.
- Quando: solo se la tua decisione UI sblocca il prompt. Se la UI è già chiara, non serve.
- L'agente esecutore NON fa questo: riceve già il prompt con le decisioni prese.

> Questa pratica è registrata come voce in `PROPOSTE.md` finché non approvata e promossa.

---

## 3. Checklist di CHIUSURA (l'agente la mostra a fine sessione)

> **Fonte unica della fase fine-chat:** `CHIUSURA_SESSIONE.md` (Parte A = come compilare il report,
> con le 10 sezioni; Parte B = commit/push/branch/DB/terminali). Qui sotto resta solo la **checklist**
> da incollare in chat — il COME riempire ogni sezione e le procedure di pubblicazione stanno lì, in
> una copia sola, per non disallineare.

> Scopo: chiudere allineati allo skill system e aiutare l'utente a non dimenticare i propri
> adempimenti. La mostra l'agente dopo che l'utente conferma successo.

> **Due momenti distinti — non confonderli.** La **scrittura del report** e la **pubblicazione** sono
> atti separati, idealmente legati a due parole diverse del vocabolario:
> - **conferma lavoro** (es. «lavoro ok») → task accettato **+ scrivi il report COMPLETO** (mai a
>   metà: lavoro + comunicazione + dati di qualità). L'agente scrive la **sua versione** dei dati di
>   qualità (giri, correzioni, chiarezza prompt), **NON un voto sintetico**. NON committa.
> - **chiusura/pubblicazione** (es. «report finale») → capitolo chiuso: **controlla che il report sia
>   allineato allo stato attuale del codice**, poi COMMIT + PUSH (su conferma).
> Il **voto sintetico** alla sessione lo dà il Meta confrontando le versioni dei vari agenti (le
> contraddizioni tra versioni = dato di affidabilità). Vedi `REVISIONE.md` §8.

```
✅ Chiusura sessione — checklist skill system

A carico dell'AGENTE:
- [ ] Report scritto in sessioni/GG-MM-AA/Report-*.md
- [ ] SESSION_LOG.md aggiornato (riga one-liner)
- [ ] FOLLOW_UP.md aggiornato (nuovi FU-NNN o chiusure)
- [ ] Dati comunicazione raccolti (esiti voci Liv.2 in VOCABOLARIO + OSSERVAZIONI)
- [ ] File di skill/context allineati alle modifiche di codice
- [ ] Pattern di errore appesi a ERRORI_PROCESSO.md (se presenti)
- [ ] Candidate nuove parole segnalate in PROPOSTE.md (mai promosse da solo)

A carico di TE (utente) — per restare allineato:
- [ ] Confermare/correggere le parole di vocabolario applicate in sessione
- [ ] Approvare o scartare le candidate in PROPOSTE.md (se ce ne sono)
- [ ] Dare il via ai commit proposti (l'agente non committa senza conferma)
- [ ] Valutare se serve una sessione Meta (se i dati Liv.2 si sono accumulati)
```

L'agente **non promuove** voci di vocabolario da solo né committa senza il tuo via.

---

## 4. Raccolta dati a fine sessione (agente di lavoro)

Le sezioni del report (incl. «Dati comunicazione», «Analisi flusso prompt» e «La tua lettura della
sessione») e il **come** compilarle sono descritte in una sola fonte: `CHIUSURA_SESSIONE.md` Parte A.
In sintesi, nella sezione «Dati comunicazione» raccogli: frasi ricorrenti (con conteggio), spiegazioni
che hanno funzionato, esiti delle voci Liv.2 applicate (aggiornando anche `VOCABOLARIO.md`), candidate
nuove parole (→ `PROPOSTE.md`, mai direttamente in VOCABOLARIO), cosa è automatizzabile vs manuale.

---

## 5. Confine dei ruoli

- **Agente di lavoro** (Esecuzione/Verifica): applica il vocabolario, **raccoglie** dati, scrive
  report, segnala candidate. NON promuove voci, NON conia parole nuove di sua iniziativa.
- **Agente Meta** (sessione dedicata, `REVISIONE.md`): valuta i dati, promuove/regredisce voci,
  conia parole per le frasi-trigger lunghe della routing, sintetizza i feedback. NON tocca il
  codice dell'app.
