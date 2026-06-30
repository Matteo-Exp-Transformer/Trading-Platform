# Manuale di avvio — Skill System v.0

> Da seguire una sola volta, quando porti questo template in un **nuovo progetto**.
> Tempo stimato: 30–60 min. Al termine hai un sistema funzionante che cresce da solo.

---

## Prima di iniziare: dove mettere i file

Hai due opzioni. Scegline una e sii coerente.

| Opzione | Quando | Dove vanno i file |
|---------|--------|-------------------|
| **A — Cartella `docs/`** (consigliata) | Progetto con molta documentazione | `docs/` contiene bussola + aree + sessioni; `comunicazione/` e `context/` come sottocartelle |
| **B — `.claude/skills/`** | Vuoi il formato nativo Claude Code | Ogni skill è una cartella con `SKILL.md` |

> ⚠️ **Regola anti-disordine #1:** decidi UNA casa per le skill e non spargerle. Vedi
> `REGOLE_ORGANIZZATIVE.md`. Non lasciare file di skill nella root del progetto.

---

## I passi

### Passo 1 — Copia e rinomina

1. Copia `_skill-system-v0/` nella casa scelta (es. dentro `docs/`).
2. Rinomina `CLAUDE.md.template` → `CLAUDE.md` e mettilo nella **root** del progetto (è l'unico
   file di questo kit che vive in root: lo cercano sia Claude Code sia Cursor).
3. Rinomina `00_BUSSOLA_SKILL.md` con il nome che preferisci (es. `APP_CONTEXT_SKILL.md`).

### Passo 2 — Compila il CLAUDE.md

Apri `CLAUDE.md` e riempi i `{{segnaposto}}`:
- Stack tecnologico
- Comandi principali (`dev`, `build`, `test`, `validate`…)
- File critici e perché
- Zone delicate / LOCK (file da non toccare mai)

Questo è il file che orienta TE e gli agenti su comandi e setup.

### Passo 3 — Compila la Bussola (Skill 0)

Apri `00_BUSSOLA_SKILL.md`. È il cuore. Compila:
1. **Tabella di routing**: «task riguarda X → carica file Y». Una riga per ogni grande zona.
2. **Profili di ingresso**: parti dai 3 di default (Esecuzione / Verifica / Meta), aggiungine
   solo se servono davvero.
3. **LOCK globali**: i file che nessun agente deve toccare senza permesso.
4. **Regola anti-buco**: già scritta — «se nessuna riga matcha, fermati e chiedi».

> Tieni la bussola **sotto ~250 righe**. Se cresce, è segno che stai mettendo dettagli che
> dovrebbero stare in un file di `context/`.

### Passo 4 — Crea i file di contesto delle grandi zone

Per ogni grande sezione del progetto (es. una pagina importante, un modulo, un flusso):
1. Copia `context/_TEMPLATE_CONTEXT.md`.
2. Rinominalo (es. `PAGINA_HOME_CONTEXT.md`).
3. Mettici **i dettagli di implementazione** di quella zona (componenti, invarianti, gotcha).
4. Aggiungi la riga corrispondente nella tabella di routing della Bussola.

Guarda `context/ESEMPIO_ZONA_CONTEXT.md` per capire il livello di dettaglio, poi cancellalo.

### Passo 4-bis — (Opzionale) Il pattern a 3 strati per le aree con molto «senso»

Per un'area grande o molto usata, un solo file di context non basta: serve catturare anche il
**senso** (perché esiste, chi la usa, quali limiti sono VOLUTI). Usa i **3 strati**:

1. **SKILL d'area** — copia `aree/_TEMPLATE_AREA_SKILL.md` → `{{AREA}}_SKILL.md`. Cattura senso
   (§1), attori (§2), flusso utente+dati (§2-bis), limiti voluti (§3), questioni aperte (§4), LOCK
   (§5), mappa ai context (§6). È lo strato che dà all'agente gli appigli per giudicare se un upgrade
   «ha senso».
2. **MINI-pack** (solo aree molto usate) — copia `aree/_TEMPLATE_MINI.md` → `{{AREA}}_MINI.md`:
   ingresso ~1 schermata (trigger · carica subito · divieti top-3 · mappa · LOCK solo-link).
   Indicizzalo nella Bussola §0.0b.
3. **Context** — uno o più `context/*_CONTEXT.md` col **dettaglio** per sotto-funzione (passo 4).

> **Regola di taglio a soglia:** area piccola = 1 file context a due sezioni; area grande = 1 file
> per sotto-funzione (se non si legge intero, si spacca). Il **senso** sta nella SKILL d'area; scende
> nel context solo se la gonfia. Il **codice è la verità** per i valori; i `.md` li specchiano.

### Passo 5 — Imposta il vocabolario

Apri `comunicazione/VOCABOLARIO.md`. È diviso in due sezioni:
- **A — Lessico-comando**: le tue parole ricorrenti → comportamento agente (livelli 1/2/3).
  Parti vuoto o con 2-3 voci che già usi («fatto», «spiegamelo semplice»…).
- **B — Lessico-mappa**: le tue parole per le zone dell'app → quale file caricare. Queste
  alimentano i trigger della tabella di routing.

Non riempirlo tutto ora: il vocabolario **cresce dall'uso**. Le parole nuove nascono in
`PROPOSTE.md` e salgono solo dopo la tua approvazione.

### Passo 6 — Prepara la memoria di sessione

In `sessioni/`:
- `SESSION_LOG.md` — lascialo vuoto, si riempie una riga per sessione.
- `FOLLOW_UP.md` — lascialo vuoto, raccoglie i debiti differiti.
- `_TEMPLATE_REPORT.md` — è il modello che gli agenti copiano a fine sessione.

### Passo 7 — Imposta la fase fine-chat (report + chiusura)

Apri `comunicazione/CHIUSURA_SESSIONE.md`: è la **fonte unica** della fase di chiusura — Parte A (come
compilare il report, sezione per sezione) e Parte B (commit/push, allineamento branch, ambienti DB,
terminali). Adatta i `{{segnaposto}}` di Parte B al tuo progetto (nome branch principale, comando di
validazione, dove vivono i report, ambiente prod vs test). Tutto il resto del sistema **rimanda qui**
per la chiusura: non duplicare queste istruzioni altrove.

### Passo 8 — (Opzionale) Installa l'hook di fine-chat

Se l'IDE supporta gli hook di lifecycle (es. Cursor), porta `hooks/` da governance soft a
**enforcement vero**: a fine chat l'hook `stop` legge i report freschi e **rilancia** l'agente se il
report è incompleto. Segui `hooks/README.md` (3 punti da adattare: dove stanno i report, quali sezioni
sono obbligatorie, il path della guida di chiusura). Senza hook resta tutto valido come regola markdown
+ checklist nel prompt — l'hook è la rete extra, non un prerequisito.

### Passo 8-bis — (Opzionale) Attiva il sottosistema didattico (solo se vuoi usare le chat senior come scuola)

> Trasforma le chat **senior** in scuola continua: impari la terminologia e il metodo *mentre* lavori.
> ⚠️ Vale **solo per l'agente senior/Meta** — gli agenti di lavoro normali non danno lezioni.

1. Crea **3 file vivi** nella cartella privata gitignored (`{{cartella_privata}}/`):
   - `{{GLOSSARIO_VIVO}}` — il quaderno dei termini: *semplice · preciso · esempio-tuo · link*, con
     stato a nastro (🌱 in apprendimento → ✅ consolidato → 📦 archiviato) e livello di padronanza
     (Sento → So spiegare → Lo uso → Lo insegno);
   - `{{PROFILO_SCOLASTICO}}` — la pagella: livello per area, storico richiami, storico Lezioni;
   - `{{ROADMAP_SKILL}}` — il programma: competenze ordinate per dipendenza, dove sei.
   - sotto-cartella `materiale-didattico/` — fonti canoniche, principio **cita-non-copia** (link, non contenuto).
2. Attiva il **Playbook §6** in `comunicazione/EVOLUZIONE_SKILLS.md` (milestone M6) e compila la
   `{{frase-richiesta-lezione}}` in `comunicazione/CHIUSURA_SESSIONE.md` §8-bis.
3. (Se usi le auto-memory dell'IDE) crea una **feedback-memory** che ricordi il mandato in ogni chat senior.

> **Per disattivarlo:** non creare i file e ignora le sezioni marcate «opzionale / solo senior» — il
> resto del sistema funziona identico. I file vivi sono PRIVATI gitignored, NON contesto obbligatorio
> (REGOLE #3); se li passi a un agente remoto devono essere **self-contained**.

### Passo 9 — Pulisci

Cancella tutti i file `_TEMPLATE_*` e `ESEMPIO_*` che non ti servono più come riferimento.
Verifica che la root del progetto non contenga file di skill sparsi (`REGOLE_ORGANIZZATIVE.md`).

---

## Legenda dei segnaposto `{{…}}`

Ogni `{{…}}` va sostituito col valore del tuo progetto. Quelli in prosa («{{cosa fa}}», «{{1-2
frasi…}}») si capiscono dal contesto; quelli **ricorrenti/strutturali** (stesso nome in più file →
devono restare coerenti) sono qui:

| Segnaposto | Cosa metterci |
|------------|---------------|
| `{{NOME_PROGETTO}}` / `{{progetto}}` | Nome del progetto |
| `{{STACK}}` | Stack tecnologico (framework, linguaggio, DB) |
| `{{area}}` / `{{AREA}}` / `{{nome-area}}` | Nome di un'area (per la skill d'area e il mini-pack) |
| `{{ZONA}}` / `{{NOME_ZONA}}` | Nome di una zona/sotto-funzione (per un file di `context/`) |
| `{{comando_dev}}` · `{{comando_build}}` · `{{comando_lint}}` · `{{comando_test}}` · `{{comando_e2e}}` | I comandi npm/script del progetto |
| `{{comando_validate}}` (alias `{{comando validate}}`) | Il comando pre-PR che fa lint+typecheck+test |
| `{{unit runner}}` · `{{E2E runner}}` | I runner di test (es. Vitest / Playwright) |
| `{{main}}` | Branch principale (es. `main`) |
| `{{branch_lavoro}}` | Branch di sviluppo (es. `env/test`) |
| `{{casa skill}}` | Dove vivono le skill (`docs/` o `.claude/skills/`) |
| `{{cartella gitignored}}` / `{{cartella_privata}}` | Cartella privata gitignored (es. `_lavoro/`) |
| `{{parole_liv1_esecuzione}}` · `{{parole_liv1_verifica}}` · `{{parole_liv1_meta}}` | Parole-trigger di profilo (dal vocabolario) |
| `{{SKILL_AREA}}` · `{{FILE_OBBLIGATORIO}}` · `{{Altra-Area}}` | Riferimenti incrociati nel mini-pack |
| `{{id_prod}}` / `{{id_test}}` | Identificatori ambiente DB prod / test |
| `{{repo_pubblica}}` · `{{deploy}}` · `{{script_release}}` · `{{dir_codice_servito}}` | Solo se pubblichi un bundle separato (Playbook merge §8) |
| `{{GLOSSARIO_VIVO}}` · `{{PROFILO_SCOLASTICO}}` · `{{ROADMAP_SKILL}}` · `{{PIANO_DIDATTICO}}` · `{{frase-richiesta-lezione}}` | Solo se attivi il sottosistema didattico (passo 8-bis) |

> Verifica finale: `grep -rhoE "\{\{[^}]+\}\}"` sui file in uso non deve restituire segnaposto
> strutturali non sostituiti. I segnaposto in prosa-esempio dentro i `_TEMPLATE_*` non contano
> (quei file si cancellano al passo 9).

---

## Come funziona, una volta avviato

```
Nuova chat
   │
   ▼
Agente legge la BUSSOLA (Skill 0)
   │
   ├─ Riconosce una tua PAROLA del vocabolario? → applica comportamento + livello
   │
   ▼
Sceglie il PROFILO (Esecuzione / Verifica / Meta)
   │
   ▼
Matcha una riga di ROUTING → carica il file di CONTEXT della zona
   │
   ▼
Lavora. Rispetta i LOCK.
   │
   ▼
A fine sessione (se confermi successo) — fonte unica: comunicazione/CHIUSURA_SESSIONE.md:
   ├─ scrive il REPORT (sessioni/) seguendo le 10 sezioni di CHIUSURA Parte A
   ├─ aggiorna SESSION_LOG + FOLLOW_UP
   ├─ raccoglie dati comunicazione (esiti voci Liv.2) + la SUA lettura della sessione
   ├─ allinea i file di skill/context delle zone toccate (implicito, non lo chiede)
   ├─ alla pubblicazione: commit/push, branch, DB, terminali (CHIUSURA Parte B)
   └─ ti mostra in chat la CHECKLIST di chiusura (per allinearti anche tu)

   (se l'hook `stop` è installato → ti rilancia un turno se il report è incompleto)
   (se il didattico è attivo E il profilo è Meta/senior → PRIMA del report chiede la Lezione: §8-bis)
```

## I tre ruoli (chi fa cosa)

| Ruolo | Quando | Cosa fa | Cosa NON fa |
|-------|--------|---------|-------------|
| **Esecuzione** | Scrivi/modifichi codice | Implementa, documenta, report | Non si auto-approva |
| **Verifica** | Revisioni/debug/test | Controlla, esegue i test, segnala difetti | Non implementa feature nuove |
| **Meta / Comunicazione** | Affini il sistema | Promuove voci vocabolario, conia parole nuove, sintetizza feedback | Non tocca il codice dell'app |

> L'agente che esegue **non decide** se una voce del vocabolario è affidabile: registra solo
> i dati. La promozione la fa il **Meta** in una sessione dedicata. Questo evita che il sistema
> si auto-convalidi.

---

## Manutenzione periodica (compito dell'agente Meta)

Ogni tot sessioni, lancia una sessione Meta che:
1. Legge i dati Liv.2 raccolti → promuove/regredisce voci del vocabolario.
2. **Cerca le frasi-trigger della routing che potrebbero diventare parole di vocabolario**
   (riduce testo e fraintendimenti) e te le propone.
3. Sintetizza i pattern di errore da `ERRORI_PROCESSO.md`.
4. Verifica che nessun file di contesto sia diventato un nuovo «muro di testo».
5. Controlla che la root sia ancora pulita (`REGOLE_ORGANIZZATIVE.md`).
6. **Fa avanzare l'evoluzione del sistema** (`EVOLUZIONE_SKILLS.md`): legge le idee annotate dai
   Meta junior, le analizza, decide cosa costruire e in che ordine sulle milestone. Distingue
   governance soft (markdown) da enforcement vero (hook config).

---

*Per la filosofia di design vedi `README.md`. Per le regole anti-disordine vedi
`REGOLE_ORGANIZZATIVE.md`.*
