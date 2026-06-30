# EVOLUZIONE SKILLS — roadmap di sviluppo dello skill system

> **A cosa serve.** Non raccoglie dati su come parla l'utente (`OSSERVAZIONI.md`) né bug di processo
> (`ERRORI_PROCESSO.md`). Qui si raccoglie e si decide **come far evolvere il sistema stesso**:
> automazioni, statistiche, tecniche non ancora usate, raffinamenti.
>
> **Due ruoli (come nel resto del sistema):**
> - **Meta junior** (modelli più piccoli / agenti durante il lavoro): *annotano* una riga nel Log
>   idee quando notano qualcosa di utile. Spontaneo, non a ogni sessione. Non decidono.
> - **Meta senior** (modello più capace, on-demand): *analizza* Log idee + milestone + dati; decide
>   cosa costruire e in che ordine; fa avanzare le milestone; pota le idee morte.
>
> **Flusso:** agenti annotano durante il lavoro → l'utente, dopo alcune sessioni, chiede una revisione
> → poi lancia il Meta senior per analisi + fix + sviluppo del sistema.

> 🛑 **Principio anti-burocrazia.** Dopo una fase di aggiunte, **fermati e misura** prima di aggiungere
> altri meccanismi. Un sistema scalabile ha **poche regole validate dall'uso**, non molte regole non
> verificate. Le idee nuove vanno nel Log idee; il senior promuove **sui dati** (metriche sotto), non
> sull'intuizione. Periodicamente fai una **pausa-raccolta**: nessuna nuova regola finché non hai
> ~5-10 sessioni di dati con gli strumenti già esistenti.

---

## ⚠️ Distinzione tecnica (markdown vs enforcement vero)

- **Governance soft** (regole `.md`): l'agente *dovrebbe* seguirle, non è obbligato dalla macchina.
  È quasi tutto lo skill system. Funziona con agenti collaborativi.
- **Enforcement vero** (eseguito dalla macchina): solo dove la piattaforma lo permette — **hook** di
  config (es. comando pre-commit o a inizio/fine task). Alcune piattaforme/IDE hanno meno leve.

Il senior, quando pianifica un'automazione, **deve dichiarare di che tipo è**. Promettere "comandi
che scattano da soli" via markdown è un buon proposito, non un'automazione.

### Leve concrete per piattaforma (verificare alla doc, cambiano spesso)

- **Cursor** (verificato 06-2026, doc `cursor.com/docs/agent/hooks`): supporta hook di lifecycle in
  `.cursor/hooks.json` — eventi tra cui `sessionStart`, `stop`, `beforeShellExecution`, `preToolUse`,
  `afterFileEdit`, `beforeSubmitPrompt`. Comunicano via stdin/stdout JSON. Alcuni **bloccano**
  (`permission: deny`, exit code 2), altri solo osservano. **Rules** (`.cursor/rules/*.mdc` con
  `alwaysApply: true`) = sempre caricate → ideali per i grilletti di profilo. **Skills** = on-demand.
  **Limite:** gli hook `stop`/`sessionStart` **NON girano sui Cloud Agents**, solo IDE locale.
  - *Leve utili allo skill system:* `stop` → nudge fine-chat (ricorda report/comunicazione/esiti
    Liv.2 — risolve "l'agente si dimentica"); `sessionStart` → carica i grilletti per forza;
    `beforeShellExecution` → blocca scritture su DB di produzione senza conferma.
- **Altre piattaforme/IDE:** verificare se esiste un equivalente hook; se no, resta governance soft
  (Rules/regole markdown) + checklist-nel-prompt come unica leva.

---

## Playbook del Meta senior (competenze, da aggiornare con le sessioni reali)

> Strumenti e principi che il senior applica quando fa evolvere il sistema. Tienilo vivo: ogni
> sessione che insegna un metodo nuovo aggiunge un punto qui.

**1. Markdown vs enforcement — la domanda che decide tutto.** Prima di promettere un'automazione,
chiediti: *la regola è verificabile guardando i FILE, o solo conoscendo la CONVERSAZIONE?*
- File (es. «il report ha la sezione X?») → **hook possibile** (la macchina lo verifica).
- Chat (es. «ha consegnato più output di quanti chiesti?») → **hook impossibile**; il massimo è il
  vincolo dentro il prompt (semi-enforcement).
Una regola markdown che già c'è e viene saltata **non si ripara con un'altra markdown**: serve l'hook.

**2. Cosa fa (e cosa NON fa) un hook.** L'hook **sposta il momento** in cui l'informazione arriva
(es. «come scrivere il report» consegnato a fine chat, non tenuto in testa tutta la sessione). NON
rende il sistema più piccolo da solo: è il *fattorino*, non chi riordina la casa. Il dimagrimento vero
lo fa la **riorganizzazione** (mettere le cose nei file giusti).

**2-bis. La matrice che decide DOVE va una regola (estende il punto 1).** Due assi, non uno:
- **Asse A — cosa verifica:** FILE (hook possibile) vs CHAT (solo vincolo nel prompt).
- **Asse B — QUANDO agisce:** *durante* il lavoro (preventivo) vs *dopo* (a posteriori).

|                            | Verificabile dai **file**          | Verificabile solo dalla **chat**         |
|----------------------------|------------------------------------|------------------------------------------|
| **Agisce DURANTE** (prev.) | riga obbligatoria nel **prompt**   | vincolo nel **prompt** / regola sempre-attiva |
| **Agisce DOPO** (a post.)  | **hook `stop`** (legge i report)   | *impossibile* (chat finita, niente la legge)  |

Esempio: «allinea la skill toccata» è verificabile dai file MA va fatta *durante* la chiusura → va sia
nella regola sempre-attiva (preventivo) **sia** in un check dell'hook `stop` (rete a posteriori).
**Due leve, non una.**

**2-ter. `stop` non è un promemoria, è un RILANCIO.** Un messaggio passivo dell'hook `stop` NON è
visibile all'agente (la chat è chiusa) → arriva a vuoto. Ma `stop` può emettere **`followup_message`**:
auto-invia un turno che riapre il loop → l'agente RICEVE e RISPONDE. È il vero potenziale di `stop`.
Guardia anti-loop: lo stdin porta `loop_count` (parte da 0); politica «rilancia 1 volta sola» →
`if (loop_count >= 1) tace`. Rete extra: `loop_limit: 1` in `hooks.json`. Scelta consigliata: rilancia
SEMPRE 1 turno se c'è report fresco, **anche se completo** (la presenza del titolo non garantisce il
contenuto). Implementazione di riferimento: `hooks/fine-sessione-nudge.mjs`.

**2-quater. Mappa hook — non tutti gli eventi possono iniettare/rilanciare.** Un IDE può avere 20+
eventi, ma per *iniettare contesto* o *rilanciare* ne contano pochi; gli altri possono **solo
bloccare** (allow/deny). Esempio mappato su Cursor (verificare alla doc, cambia):
| Hook | Quando | Cosa può fare | Uso skill system |
|------|--------|---------------|------------------|
| `sessionStart` | avvio chat (1×) | inietta contesto | carica i grilletti (spesso già coperto da una Rule sempre-attiva) |
| `postToolUse` | dopo ogni tool ok | inietta contesto | regole contestuali su un file (rumoroso → usare con cautela) |
| `stop` | fine loop agente | **`followup_message`** (rilancia) | **nudge fine-chat** ✅ |
| `preToolUse`/`before*Execution` | prima azione/shell/MCP | **solo `allow`/`deny`** (NON inietta testo) | guard produzione / LOCK (enforcement vero) |

> ⚠️ Trappola da non ripetere: gli hook che girano *prima* di un'azione (`preToolUse`,
> `beforeSubmitPrompt`) NON possono iniettare istruzioni, solo bloccare/informare. «Istruisci l'agente
> prima che scriva» NON si fa con loro → si fa con `sessionStart` o una Rule sempre-attiva.

**3. Alleggerire i file (principi di ingegneria).**
- **Cohesion by lifecycle phase:** raggruppa per *quando* serve, non per *tipo*. Tutto il «fine chat»
  in un file (`CHIUSURA_SESSIONE.md`), puntato dall'hook quando quella fase arriva.
- **Single source of truth:** una sola copia di ogni istruzione. Se due file dicono la stessa cosa, si
  disallineano → il dettaglio in un posto, gli altri rimandano.
- **Evita il god-object:** un file di fase va bene finché la fase ha confini *finiti*. «Chiusura» sì
  (report→commit→push→allinea→terminali). «File di tutto» no.
- **Nastro trasportatore, non magazzino:** `OSSERVAZIONI.md` processa dati, non li accumula. Lo
  storico consolidato va in archivio; i file di lavoro restano leggeri.

**4. Sequenza di una sessione senior.** Parti dal materiale del revisore (se c'è) → non
ri-diagnosticare, **decidi e fai avanzare**. Ogni decisione che spetta all'utente → presentala a
opzioni pesate (no piani calati). Onestà sul limite della propria mossa («la mia prima idea è
markdown-su-markdown, non basta») produce le decisioni migliori. Educa l'utente confrontando le sue
idee con i principi di ingegneria.

**5. A fine sessione senior:** archivia il deciso (file di lavoro leggeri), aggiorna questo Playbook se
hai imparato un metodo nuovo, e **propaga gli upgrade strutturali nel template generico** se questa è
la copia operativa di un progetto (vedi `REVISIONE.md` §9).

**6. Educare il vocabolario dell'utente (sottosistema didattico — OPZIONALE, SOLO senior).**
> ⚠️ Questo mandato vale **solo per l'agente senior/Meta**, MAI per gli agenti di lavoro normali
> (profilo Esecuzione/Verifica). Un agente normale risolve e basta; non dà lezioni. È la stessa
> separazione di ruoli del resto del sistema (chi lavora ≠ chi affina).

Se il progetto ha attivato il sottosistema didattico, il senior non risolve solo problemi: **insegna**.
- **Durante** la chat: introduce i **termini tecnici nuovi in grassetto** quando emergono dal lavoro
  vero, con definizione semplice + esempio dalla chat (progressione **scaffolding**: parole → frasi →
  concetti). Se un termine dell'utente ha un nome canonico diverso, lo segnala.
- **A fine** chat, **prima** del report, **chiede**: «{{frase-richiesta-lezione}}».
  - Rifiuto → annota «lezione saltata» nel report (il salto è un dato, non un buco; i termini restano dovuti).
  - Accetto → richiamo **spaced-repetition** di 2-3 termini vecchi (dalla coda di `{{GLOSSARIO_VIVO}}`) +
    sezione «Lezione della chat» nel report (5 punti — vedi `CHIUSURA_SESSIONE.md` §8-bis).
- **Tipo: governance soft.** Verificabile solo dalla CHAT (l'agente ha introdotto un termine?), non dai
  file → **niente hook** (vedi matrice §2-bis: «durante» + «chat» = vincolo nel prompt/regola sempre-attiva).
- File vivi e dettaglio: `{{cartella_privata}}/{{PIANO_DIDATTICO}}`. Si attiva dal `MANUALE_AVVIO.md` (passo 8-bis).

**7. Controtest = ricerca ATTIVA di rotture, non conferma (metodo di blindatura).** Chiudere una
sezione **non è «i test sono verdi»** — il verde di copertura dimostra solo che *ciò che hai pensato di
testare* funziona, non che la sezione è robusta. La chiusura è **cercare attivamente cosa la rompe**: si
lanciano sub-agent con mandato esplicito di *trovare bug*, guidati dalla domanda **«cosa può rompere la
sezione e cosa può fare l'utente per romperla?»**. Quattro fronti: flusso dati (sporcalo: nulli, doppio
click, race, azione su record già in un altro stato), flusso utente (rompilo: fuori sequenza, navigazione
durante una mutation, back/refresh), limit test (confini: testi enormi, numeri 0/negativi, date limite,
liste lunghe, capienza ±1), responsive (viewport standard). **Un controtest che non ha *provato* a
rompere nulla non chiude l'area.** Anti-pattern curato: il *falso PASSA da copertura*. Metodo eseguibile
nel template: `aree/MANUALE_BLINDATURA.md` (ciclo A→D + 4 fronti + cancello «blindata»).

**8. Merge in production — la repo pubblica è il prodotto, non lo specchio del lavoro.** Se il progetto
pubblica un bundle servito ai clienti da una repo/deploy separati ({{repo_pubblica}}/{{deploy}}), questa
deve ricevere **solo ciò che cambia per i clienti**, non materiale di sviluppo (test, doc, config interna).
- **Prima di ogni merge production, classifica il diff:** tocca **codice servito** sì/no?
  `git diff --name-only {{main}}..{{branch_lavoro}} -- {{dir_codice_servito}}`.
- **Se tocca codice servito:** merge → release sulla pubblica ({{script_release}}) → build → pubblica.
  Il bundle cliente cambia, va pubblicato.
- **Se NON tocca codice servito** (solo test/config/doc): il merge va sul branch principale privato
  (backup), ma **NON si pubblica**. Motivo: il bundle servito è identico → una pubblicazione
  ri-deploierebbe a vuoto e trascinerebbe materiale di sviluppo tra gli artefatti pubblici. Dopo il sync,
  riporta la pubblica pulita (annulla le modifiche pendenti).
- **Niente debiti per gate non dovuti:** se un merge non tocca codice servito, il controtest "rompi"
  (Playbook §7) **non è dovuto** — non c'è comportamento da rompere → non si traccia come follow-up. È la
  stessa classificazione del diff che governa `aree/MANUALE_BLINDATURA.md` §2.

**9. Revisione di un'analisi «drift versionato ↔ stato reale» — traccia ogni oggetto per NOME su tutta la
catena.** Quando un sub-agent confronta artefatti versionati (es. migrazioni DB) con lo stato reale e
dichiara un «drift», il revisore senior NON si fida del confronto: lo rifà cercando ogni oggetto/policy
**per nome lungo l'INTERA catena** delle modifiche (DROP/CREATE successivi), non solo nel primo file che
lo nomina. Caso tipico: un oggetto creato in un file e ridefinito in uno successivo appare «mancante» se
guardi solo il primo → bozza sovra-dimensionata che ri-dichiara roba già versionata. **Anti-pattern
curato:** *false drift da confronto parziale* (concludere da un solo file invece che dallo stato
risultante dell'intera catena). Pattern che paga: **sub-agent fase-1 read-only + bozza, senior rivede
prima di scrivere** — proprio sui casi che sembrano banali.

**10. Restringere un permesso d'accesso pubblico — mappa CHI legge la risorsa in TUTTA l'app prima di
toccarla.** Prima di restringere una regola d'accesso anonima/pubblica (da «tutti» a whitelist/filtro), il
primo passo OBBLIGATORIO non è scrivere la modifica: è mappare **ogni** punto che legge quella risorsa via
il canale pubblico in tutta l'app, **non solo nelle pagine pubbliche**. Caso tipico: una risorsa letta via
client pubblico **anche dentro l'area autenticata** → una whitelist ingenua romperebbe l'area autenticata.
Il fix corretto: classificare ogni chiave pubblico-vs-solo-interno → ri-instradare le letture interne sul
canale autenticato → poi restringere alla sola parte davvero pubblica. **Ordine di deploy obbligatorio:**
prima il codice live (che legge via canale autenticato), POI la modifica restrittiva — altrimenti l'area
live si rompe nella finestra tra i due. **Anti-pattern curato:** *restrizione a scope parziale* (assumere
che solo il pubblico legga dal canale pubblico). Schema: sub-agent mappa read-only → senior verifica la
classificazione (è lì che un errore rompe le pagine) → sub-agent implementa.

> §7-§10 sono **metodi generici** estratti dal progetto-madre (controtest, merge pubblico/privato, review
> DB senior). I valori e i nomi specifici del progetto vivono nelle skill d'area, non qui.

---

## Milestone attive

> Ordinate per impatto sul workflow dell'utente. Stato: ⬜ da iniziare · 🔶 in corso · ✅ fatta.
> {{Adatta queste milestone al progetto reale all'avvio: tieni quelle utili, riscrivi le altre.}}

### M1 — Prompt più veloci da scrivere ⬜
**Obiettivo:** ridurre i giri di chiarimento tra utente e agente di consulto a monte.
**Idee:** template di prompt per i task ricorrenti; mockup/anteprime per le scelte UX prima
dell'implementazione. **Tipo:** governance soft.

### M2 — Report a colpo d'occhio 🔶
**Obiettivo:** l'utente decide se aprire un report senza leggerlo tutto.
**Idee:** ogni report standard/deep apre con **3 righe fisse** — cosa è cambiato / cosa resta / serve
azione tua sì-no. La modalità light/standard/deep (Bussola §6) è il primo passo. **Tipo:** soft.
**Stato:** cappello 3 righe già nel template report (`sessioni/_TEMPLATE_REPORT.md`). Da validare
all'uso se le 3 righe sono quelle giuste.

### M3 — Chiusura con una parola sola ⬜
**Obiettivo:** non ripetere ogni volta "report + comunicazione + commit".
**Idee:** una parola di vocabolario fa partire il protocollo di fine lavoro **giusto per la modalità**
del task. **Tipo:** soft (voce vocabolario + §chiusura).

### M4 — Enforcement via hook 🔶
**Obiettivo:** blindare gli errori costosi che una regola markdown non garantisce.
**Idee:** spostare in hook di config i controlli critici — es. {{verifica ambiente prima di scrivere
su DB di produzione}}, test pre-commit, blocco su file LOCK senza conferma. **Tipo:** enforcement vero.
**Pronto nel template:** l'hook `stop` di fine-chat è già scritto in forma generica in `hooks/`
(`fine-sessione-nudge.mjs` + `hooks.json`) — legge i report freschi, verifica le sezioni obbligatorie e
**rilancia 1 turno** (`followup_message`). Da copiare/adattare al progetto (vedi `hooks/README.md`).
**Altre leve note (Cursor):** `beforeShellExecution`/`before*Execution` → guard DB produzione;
`sessionStart` → carica grilletti. Vedi «Leve per piattaforma» + Playbook §2-quater.
**Attenzione:** gli hook che NON girano sui Cloud Agents lasciano scoperta quella modalità → serve
anche una leva soft (checklist-nel-prompt) per gli agenti dove l'hook non arriva. Due leve, non una.

### M5 — Statistiche d'uso ⬜
**Obiettivo:** capire dove il sistema funziona con numeri semplici.
**Idee:** dai report e dal SESSION_LOG contare sessioni light/standard/deep, zone toccate più spesso,
cause d'errore ricorrenti, quante volte un task è stato "alzato" di modalità. **Tipo:** misto.

### M6 — Sottosistema didattico (OPZIONALE, solo senior) ⬜
**Obiettivo:** usare le chat senior come scuola continua — insegnare all'utente la terminologia e il
metodo *mentre* si lavora (just-in-time), per prompt più efficaci e autonomia crescente.
**Idee:** termini in grassetto durante la chat + lezione/richiamo spaced-repetition a fine chat (vedi
Playbook §6); 3 file vivi nel privato (glossario · profilo scolastico · roadmap skill) + materiale
canonico citato (non copiato). **Tipo:** governance soft (mai hook — verificabile solo dalla chat).
**Vincolo:** vale **solo** per l'agente senior/Meta, mai per gli agenti di lavoro normali.

---

## Metriche di successo chat (forma concreta di M5)

**Scopo:** dati **oggettivi e contabili** (non opinioni) su quanto bene è andata una sessione → chat
di riferimento per capire **quali comportamenti automatizzare e promuovere**. È la milestone che cura
il rischio di tutte le altre: dice quali regole valgono davvero.

**Chi mette i dati:** l'agente di consulto **a valle** (ha visto tutto il ciclo, non si auto-pagella).
Se assente, l'agente di chiusura mette **solo i numeri grezzi**, senza voto.

**Cosa si registra** (criteri iniziali — affinabili coi dati):

| Criterio | Come si conta | Segnale |
|----------|---------------|---------|
| **N° prompt dell'utente** per chiudere | messaggi sostanziali | pochi = comando recepito bene |
| **Correzioni dopo la 1ª risposta** | quante ripetizioni dell'intento | 0 = capito alla prima |
| **Follow-up / fix generati** | n° FU o bug emersi dopo | 0 = pulito al primo giro |
| **Modalità alzata in corsa** | sì/no + perché | sì = stima o prompt incompleti |

**Solo per sessioni standard/deep.** Niente voto sintetico finché i criteri non sono tarati: solo
numeri + nota. Il senior decide il voto e taglia i criteri inutili quando i pattern sono chiari.

### Registro metriche (append-only)

> Formato: `GG-MM-AA · tema · modalità · prompt:N · correzioni:N · FU:N · alzata:sì/no · nota`.

- {{prima riga quando arriva la prima sessione standard/deep}}

---

## Milestone future (il senior le attiva quando è il momento)

- **Catene di comandi all'avvio task** — sequenza che scatta a inizio sessione. Dipende da M4: senza
  hook è solo un elenco che l'agente *dovrebbe* seguire.
- **Integrazione con issue/PR** — collegare follow-up e report al tracker. Per team/progetti grandi.
- **Metriche di successo** — misurare se il sistema *riduce davvero* i giri di correzione. Dopo M5.

---

## Log idee (append-only — i Meta junior scrivono qui)

> Una riga per idea. Formato: `GG-MM-AA · [automazione|statistica|tecnica|raffinamento] · idea — perché`.
> Non cancellare: il senior pota da qui spostando le idee mature nelle milestone.

- {{GG-MM-AA}} · [tecnica|statistica|raffinamento|automazione] · {{idea in una riga — perché}}  ← esempio di formato; cancella quando arriva la prima idea reale del progetto.
