# Regole organizzative — anti-disordine

> Lezioni dagli errori organizzativi reali di un progetto vissuto. Servono a tenere la **root**
> e le cartelle pulite man mano che il progetto cresce. Vale per te e per gli agenti.

---

## Le 6 regole

### 1. La root del progetto contiene solo l'essenziale

In root vanno **solo**: config (`package.json`, `tsconfig`, `vite.config`…), `README.md`,
`CLAUDE.md`, e le cartelle sorgente (`src/`, `tests/`, `docs/`, `public/`…).

**MAI in root:**
- Script usa-e-getta (`pw-screenshot.mjs`, `check.mjs`, `test-temp.js`…) → cartella `scripts/`
  o `tmp/` (gitignored).
- File senza estensione o con nome a frase (`Report idea workflow`) → dagli estensione e
  mettilo in `docs/`.
- Output di test, screenshot, dump → cartella dedicata gitignored.

> **Errore tipico:** 9 file `pw-gap-*.mjs` accumulati in root da sessioni di debug. Nessuno li
> cancella perché «magari servono». Soluzione: nascono in `tmp/` (gitignored), non in root.

### 2. Una sola casa per le skill

Decidi dove vivono le skill (`docs/` **oppure** `.claude/skills/`) e non spargerle. Se usi
sia Cursor che Claude Code e ti servono entrambi i formati, tieni **uno solo come fonte di
verità** e l'altro come puntatore di una riga che rimanda al primo. Mai contenuto duplicato in
due posti: si disallinea.

### 3. Il privato è gitignored e dichiarato

I file con prezzi, dati sensibili, bozze personali vanno in una cartella **gitignored**
(es. `_lavoro/`, `_private/`) ed è scritto a chiare lettere nella bussola che NON sono contesto
obbligatorio per gli agenti. Mai referenziarli come fonte in una skill versionata.

> **Esempio — sottosistema didattico (se attivo):** i file vivi (`{{GLOSSARIO_VIVO}}`,
> `{{PROFILO_SCOLASTICO}}`, `{{ROADMAP_SKILL}}`, `materiale-didattico/`) stanno qui, nella cartella
> privata gitignored. Devono essere **self-contained** (leggibili da soli, da incollare a mano a un
> agente remoto che non vede il disco) e il materiale **cita le fonti con un link, non ne copia il
> contenuto** (single source of truth). Una skill versionata può *rimandarci*, mai *dipenderne*.

### 4. Le regole «temporanee» hanno una scadenza scritta

Ogni regola provvisoria (es. «per ora committa con `-f`», «raccogliamo dati extra finché…»)
deve dichiarare **quando si rimuove** (data o condizione). Senza scadenza, le regole temporanee
si fossilizzano e nessuno le toglie più.

> Formato: `> ⚠️ TEMPORANEA (rimuovere quando {{condizione}}): ...`

### 5. La bussola smista, i file di contesto spiegano

Quando un file di skill supera ~250 righe o accumula tanti blocchi «Nota:», è segno che sta
diventando un archivio. Sposta i dettagli in un file di `context/` e lascia nella bussola solo
il rimando. Un dettaglio = un solo file (mai lo stesso contenuto in due file).

### 6. Anti-storia: la cronologia vive nei report, non nelle skill vive

Le skill e i file di `context/` contengono **stato attuale + divieti + link**, non la cronologia di
come ci si è arrivati. La storia (decisioni datate, perché di un refactor, QA di sessione) vive nei
**report di sessione**. Vietato nelle skill vive: paragrafi «Fino al GG-MM-AA…», «Nella sessione
del…», changelog per sessione. Eccezione ammessa: **guardrail ≤3 righe** senza date lunghe, con link
al report —

```markdown
> **Divieto:** NON reintrodurre {{cosa rimossa}}.
> Dettaglio storico: [Report {{tema}} GG-MM-AA](sessioni/.../Report-….md).
```

Le tabelle operative («Se hai modificato X → aggiorna Y») restano: sono procedura, non cronologia.
Migrazione: potatura attiva sull'area più «narrativa», on-touch sulle altre al prossimo WP che le tocca.

---

## Checklist di igiene (l'agente Meta la esegue periodicamente)

- [ ] La root non ha script usa-e-getta né file senza estensione
- [ ] Nessuna skill duplicata in due formati/posti senza fonte-di-verità unica
- [ ] I file privati sono gitignored e dichiarati non-obbligatori
- [ ] Ogni regola «temporanea» ha una condizione di rimozione scritta
- [ ] Nessun file di skill supera ~250 righe senza essere spezzato in `context/`
- [ ] Ogni file di `context/` è raggiungibile da almeno una riga della tabella di routing

---

*Collegato a: `README.md` (principi), `MANUALE_AVVIO.md` (passo 7 e manutenzione).*
