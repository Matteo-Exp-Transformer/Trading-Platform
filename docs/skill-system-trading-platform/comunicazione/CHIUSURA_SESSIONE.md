# CHIUSURA SESSIONE — guida unica (report + procedure di fine chat)

> **Fonte unica per la FASE «fine chat».** Tutto ciò che serve quando una sessione si chiude sta qui:
> come compilare il report (Parte A) e le procedure operative di chiusura — commit, push, allineamento
> branch, ambienti DB, terminali (Parte B). Un eventuale hook `stop` (vedi `hooks/`) rimanda a questo
> file quando un report è incompleto. La **Bussola §5/§6** definisce il **QUANDO** (modalità light/
> standard/deep) e rimanda qui per il **COME**: una sola copia, niente disallineamenti.
>
> **Principio (Single Responsibility):** questo file copre **solo** la chiusura sessione — una fase con
> confini *finiti* (report → commit → push → allineamento → terminali). Non diventa un «file di tutto»:
> se un'informazione non riguarda la chiusura, NON va qui. (È l'anti-god-object del Playbook senior.)

---

# PARTE A — Come compilare il report

---

## Quando scrivere un report (riepilogo — dettaglio nella Bussola §6)

- **light** (fix piccolo, 1 zona, basso rischio): NIENTE file report → 1 riga in `sessioni/SESSION_LOG.md`.
- **standard / deep**: file `Report-*.md` in **`_sessioni-lavoro/AAAA-MM-GG/`** (cartella gitignored a root,
  data ISO) con le sezioni sotto. Crea la cartella del giorno se non esiste. L'indice `sessioni/SESSION_LOG.md`
  (committato) prende 1 riga che punta al report. Si scrive su **«lavoro ok»** o **«report finale»**.

La modalità la assegna l'agente di consulto a monte (se c'è) e la scrive nel prompt; altrimenti la
deduce l'agente di lavoro dai trigger della Bussola §6. Nel dubbio: standard.

---

## Le sezioni di un report standard/deep (in ordine)

### 1. Cappello (3 righe, sempre in cima)
- **Cosa è cambiato:** 1 frase, effetto per l'utente finale.
- **Cosa resta:** lavori aperti / follow-up, o «niente».
- **Serve una tua azione:** sì (cosa) / no.

### 2. Cosa è stato fatto
In ordine cronologico, in **linguaggio utente** (non «ho modificato X» ma «ora quando apri Y vedi Z»).

### 3. File toccati e perché
Tabella o elenco: file + perché. Compresi i file dello skill system, se li hai toccati.

### 4. Test eseguiti e risultato
I comandi eseguiti e l'esito reale. Il gate completo è `npm run validate`, ma include test RLS
remoti: senza ambiente confermato riportare il gate locale sicuro di `aree/TESTING_SKILL.md` e le
suite escluse. Niente «tutto ok» generico.

### 5. «File di skill aggiornati» (tabella obbligatoria, anche «nessuno»)
Colonne: **file · modifica · perché**. Elenca TUTTI i file skill toccati (Bussola, file di `context/`,
`comunicazione/*`, `SESSION_LOG`, report, eventuali hook).

> **Allineamento skill = implicito, NON una domanda all'utente.** Se il diff ha cambiato un
> layout/comportamento **descritto in un file di skill/context**, quel file va aggiornato **in questa
> chiusura** e la riga va in questa tabella con scritto **cosa** hai allineato. La riga «nessuno» è
> valida SOLO se per la zona toccata non esiste un file skill da aggiornare — e in quel caso scrivi
> il motivo («nessuno — nessuna skill area copre questo componente»). **Vietato** formulare
> l'allineamento come follow-up opzionale o «al prossimo giro»: vale per esecuzione e revisore.

### 6. «Dati comunicazione» (obbligatoria standard/deep)
- Frasi/richieste ricorrenti dell'utente in questa chat (con conteggio).
- Spiegazioni date e formato che ha funzionato.
- Prompt dell'utente annotati (verbatim dove utile) — fase raccolta dati.
- Esiti delle voci Liv.2 applicate (aggiornare anche `VOCABOLARIO.md`).
- Cosa si può automatizzare con certezza vs cosa lasciare manuale.

### 7. «Analisi flusso prompt, efficienza e statistiche» (sottosezione obbligatoria standard/deep)
- N° prompt sostanziali dell'utente · correzioni dopo la 1ª risposta · follow-up generati ·
  modalità alzata in corsa sì/no.
- Anatomia: cosa ha reso i prompt efficaci o ambigui. Cosa replicare/migliorare.

### 8. La TUA lettura della sessione ⭐ (il pezzo che l'hook chiede esplicitamente)
> **Questo è ciò che l'hook ti ricorda di scrivere, e che viene saltato più spesso.** Non è «cosa hai
> fatto» (già sopra): è la **tua versione di agente** su com'è andato il lavoro CON lo skill system.

- **Impressioni:** cosa ha funzionato bene e cosa no lavorando col sistema (prompt chiari? skill
  giuste caricate? procedura scorrevole o macchinosa?).
- **Difficoltà incontrate + come le hai risolte** (anche piccole — sono dati per migliorare il sistema).
- **Migliorie che TU suggeriresti** (allo skill system, ai prompt, al processo) — **come dato, non come
  modifica**: NON toccare le skill da solo, scrivi il suggerimento e basta (vedi «Cosa NON fare»).
- Scrivilo come **DATI e versione dell'agente, NON come voto sintetico** (il voto lo dà il Meta
  confrontando le versioni dei vari agenti — vedi `REVISIONE.md` §8).

### 8-bis. «Lezione della chat» (OPZIONALE — solo se il sottosistema didattico è attivo, solo profilo senior/Meta)

> ⚠️ **Solo l'agente senior/Meta.** Gli agenti di lavoro normali (Esecuzione/Verifica) NON danno lezioni:
> saltano interamente questa sezione. Il sottosistema risulta non attivo in
> `EVOLUZIONE_SKILLS.md` §3, quindi questa sezione oggi si salta.
> Questa è la **fonte unica** del momento «lezione»: la Bussola §5 rimanda qui, non duplica.

**Vincolo d'ordine: si chiede PRIMA di chiudere il report.** L'agente chiede all'utente:
«{{frase-richiesta-lezione}}».
- **Rifiuto** → scrivi una riga «lezione saltata su richiesta» qui **e** in `{{PROFILO_SCOLASTICO}}`
  (il salto è un dato tracciato, non un buco; i termini restano «dovuti»). Salta il resto della sezione.
- **Accetto** →
  1. **Richiamo spaced-repetition:** 2-3 termini vecchi dovuti, pescati dalla coda di `{{GLOSSARIO_VIVO}}`;
     domanda breve (non esame). Scrivi gli esiti qui.
  2. **Valutazione a 5 punti** (tono: insegnante esigente, onestà sopra gentilezza, niente voti numerici):
     lezione ricevuta · cosa ha deciso da sé **distinguendo (a) risposte guidate da (b) idee autonome**
     (valuta (b) di più, con esempi dalla chat) · ha deciso bene/male **nominando l'anti-pattern**
     ({{es. scope creep, premature optimization}}) · cosa ha appreso · cosa resta da consolidare.
  3. **Deposito:** termini nuovi → `{{GLOSSARIO_VIVO}}`; esiti richiami + valutazione → `{{PROFILO_SCOLASTICO}}`.

### 9. «Derivazione errori» (obbligatoria, anche «nessuna difficoltà»)
Per ogni bug/difficoltà, **classifica la causa**:
- **bug preesistente** — c'era già nel codice (cita file/RULE);
- **prompt ambiguo/incompleto** — la richiesta lasciava spazio a interpretazioni;
- **errore agente** — interpretazione sbagliata, tentativo evitabile;
- **vincolo strutturale** — un LOCK/CSS/architettura ha bloccato un approccio.
Per ognuno: cosa è successo, da cosa derivava, come si sarebbe evitato. I pattern ricorrenti vanno
**anche** appesi in `comunicazione/ERRORI_PROCESSO.md`.

### 10. Cosa resta per la prossima sessione
Sincronizza con `sessioni/FOLLOW_UP.md` (nuove righe FU-NNN; stato `fatto` se chiusi).

### 11. «Domande di chiusura» ⭐ (OBBLIGATORIA — l'hook la controlla riga per riga)

> Sei domande a **risposta obbligata**, valide per QUALSIASI report (esecuzione, verifica, meta).
> Formato rigido: una riga `❓ Q… —` e sotto/accanto una riga `✅ R… :` con la risposta PIENA.
> Il template `hooks/fine-sessione-nudge.mjs.template`, se adattato e installato, estrae ogni
> coppia e **blocca la chiusura** se una `✅ R` è vuota
> o placeholder (`...`, `TODO`, `-`). Per Q2 e Q3 DEVI rileggere il diff e i file: è il punto della
> sezione (la verifica intelligente la fai tu, l'hook controlla solo che tu abbia risposto).

❓ Q1 — Prompt ricevuti: riporta VERBATIM i prompt sostanziali dell'utente in questa chat.
✅ R1 :

❓ Q2 — I DATI del report (numeri, file, valori) corrispondono al DIFF reale? (rileggi il diff, no copie a memoria)
✅ R2 :

❓ Q3 — I FILE CORRELATI (skill area, context, test, tipi) sono allineati alla modifica? (caso E-A: sezioni lasciate indietro)
✅ R3 :

❓ Q4 — Cosa NON è stato fatto / è rimasto fuori scope? (onesto, anche se «nulla»)
✅ R4 :

❓ Q5 — Attrito incontrato + una miglioria di metodo/sistema?
✅ R5 :

❓ Q6 — Il contesto caricato era quello giusto? L'hook di fine-chat è stato utile o rumore?
✅ R6 :

### 12. Self-review del report ⭐ (la fai TU, prima che scatti l'hook)

> **L'hook controlla solo che tu abbia risposto; la qualità la garantisci tu qui.** Prima di dire
> «report pronto», rileggi a mente fredda e passa questa checklist. Non è un doppione delle Q1-Q6:
> lì *rispondi*, qui *ti correggi*. Così arrivi all'hook col report già pulito.

1. **Dati = diff reale.** Apri il diff: file, numeri, nomi citati esistono e sono giusti? Niente a
   memoria, niente sezione rimasta indietro rispetto a un fix successivo.
2. **File correlati allineati.** Se hai cambiato un comportamento documentato in una skill area /
   context / test / tipi → quel file è aggiornato *in questa chiusura*? (non è un follow-up).
3. **Q1-Q6 coerenti.** Non si contraddicono né col lavoro; ognuna ha sostanza. Per Q2/Q3 hai davvero
   riaperto i file.
4. **Tono utente.** Le parti rivolte all'utente parlano per flussi/schermate, non nomi-file isolati.

Se un punto fallisce → **correggi ora** e annota in 1 riga cosa hai sistemato.

> **Dopo il «report finale» (non «lavoro ok») scatta la CONTROVERIFICA imparziale.** Un sub-agente che
> NON ha eseguito il lavoro pesa report + diff contro i prompt dell'utente e il flusso dati/utente
> (scope creep? vocabolario reinterpretato?) ed emette un verdetto. Vedi `comunicazione/CONTROVERIFICA.md`.
> La self-review qui sopra la fai *tu* prima; la controverifica la fa *un altro agente* dopo.

---

## Tono (vale per le parti rivolte all'utente, non per i dati tecnici interni)

Segui `COMUNICAZIONE_SKILL.md`: parla per **flussi e schermate**, non nomi-file isolati. Errori in
linguaggio umano («permesso negato», non il codice grezzo). Default sintetico, dettaglio on-demand.

---

## Cosa NON fare (per non causare disallineamenti)

- **NON modificare le skill da solo** (VOCABOLARIO, regole, livelli): se hai un'idea o un'osservazione,
  scrivila come **dato** in `OSSERVAZIONI.md` (o suggerimento nel report). La promozione a regola la fa
  SOLO una sessione Meta con l'utente (`REVISIONE.md`). «annota ≠ codificare».
- **NON promuovere voci** di vocabolario, **NON cambiare i livelli** Liv.1/2/3.
- **NON inventare un voto** sintetico alla sessione: scrivi i tuoi dati, il voto è del Meta.
- **NON aggiungere deliverable non richiesti** senza chiedere (freno allo scope creep).
- **(Se didattico attivo, solo senior) NON scrivere la «Lezione della chat» senza aver chiesto prima**:
  il salto-lezione va **tracciato**, mai ignorato. E gli agenti di lavoro normali non la scrivono affatto.

---

## Cos'è l'hook di fine-chat (così non ti confonde)

In questa repository l'hook non è installato: `hooks/` contiene soltanto template. Se in futuro
viene adattato e installato, a fine chat un processo legge i
`Report-*.md` che hai appena scritto e **rilancia un turno** (non un promemoria passivo: vedi sotto
e `EVOLUZIONE_SKILLS.md` §1). Ti dice se manca una sezione obbligatoria e
ti ricorda di scrivere la **sezione 8** (la tua lettura). **È normale e voluto: assecondalo, completa
ciò che segnala, non è un errore.** Può bloccare fino al limite configurato. Se la chat non aveva report
(domanda veloce, light), l'hook tace.

---

# PARTE B — Procedure operative di chiusura

> Scattano sulla parola di pubblicazione (capitolo chiuso → si pubblica), NON sulla sola conferma di
> lavoro (= solo scrivere il report). Il via al commit/push è sempre una conferma dell'utente.
> (Due momenti distinti — vedi `COMUNICAZIONE_SKILL.md` §3.)

## 1. Prima di committare: report allineato al codice
Controlla che il report descriva il **diff reale** (nessuna sezione rimasta indietro rispetto a fix
successivi). **Allinea i file di skill/context delle zone toccate** (vedi Parte A §5): se il diff ha
cambiato un layout/comportamento documentato in una skill e quella skill è ancora indietro →
aggiornala **ora**, non dopo il merge. Approvare un merge con la skill stale lascia passare un debito.

> **(Solo agente Senior) Aggiorna l'HANDOFF prima di committare.** Sovrascrivi `sessioni/HANDOFF.md`
> (dove siamo · prossimo passo · decisioni d'intervista non ancora nei doc · questioni aperte) e la
> data in cima, così la prossima chat Senior riparte allineata. Dettaglio in `PREPARA_PROMPT_SKILL.md §5`.
> Gli agenti Esecuzione/Verifica saltano questo passo (non possiedono l'HANDOFF).

## 2. Commit — separati per tipo
- **Codice** (`feat`/`fix`) e **documentazione** (`docs(...)`) in **commit distinti** (punti di
  ripristino indipendenti).
- Conventional Commits: `feat(scope):` · `fix(scope):` · `docs(scope):`.
- Corpo del commit: sezione **`Review:`** con i path per revisionare (report, SESSION_LOG, skill toccati).
- **Report di sessione = locali, NON committati:** i `Report-*.md` vivono in `_sessioni-lavoro/` (gitignored)
  e **restano lì** — non forzarli con `git add -f`. Si committano solo: l'indice `sessioni/SESSION_LOG.md`,
  il follow-up `sessioni/FOLLOW_UP.md` e le skill toccate (già tracciati → commit normale).
- Aggiungi SOLO i tuoi file: non includere modifiche/untracked altrui nel commit del task.

## 3. Allineamento branch di lavoro → `main` (solo se richiesto)
- Il progetto usa oggi `main`; non inventare un branch di lavoro. Se l'utente ne indica uno,
  verifica prima che il merge sia fast-forward.
- Se il working tree ha modifiche non tue che bloccano il checkout → `git stash push <file>`, fai il
  merge, torna sul branch di lavoro, `git stash pop` (preserva il lavoro altrui senza committarlo).
- Commit, merge e push richiedono sempre conferma esplicita; usare i nomi branch reali letti da Git.

## 4. Allineamento ambienti DB (se richiesto)
- **Sola lettura per default.** Verifica **dove sei** prima di toccare qualsiasi cosa: il progetto
  ha tipicamente un ambiente **produzione** e uno **di test/staging**.
- **Mai scrivere su PRODUZIONE** senza conferma esplicita dell'utente. Sul test/staging la scrittura
  è ok.
- Confronta le migrazioni per **nome logico**, non per numero di versione (ambienti diversi possono
  avere schemi di versionamento diversi). Differenze storiche note ≠ disallineamento.

## 5. Terminali (nota obbligatoria in chiusura chat, 1-2 righe)
- Suggerisci di chiudere SOLO i terminali aperti **dall'agente** (validate, dev server in background
  avviati da tool).
- **Non** toccare il dev server che ha lanciato **l'utente** (può servirgli in locale).
