# Skill System — FREEDOM TRADING SYSTEM

> Questa cartella è la **copia operativa** del progetto, non un template da inizializzare.
> Per lavorare all'app entra da `AGENTS.md` e dalla skill `$freedom-trading-workflow`.
> `MANUALE_AVVIO.md`, `*.template`, `_TEMPLATE_*`, `ESEMPIO_*` e i segnaposto `{{...}}`
> sono materiale riusabile/inattivo: non sono regole del progetto corrente.

---

## Cos'è (in una frase)

Un insieme di file Markdown che insegnano a un agente AI **come orientarsi nel tuo
progetto** (quale file leggere per quale task) e **come parlare con te** (le tue parole →
comportamento dell'agente). Sostituisce il «rispiegare tutto da capo» a ogni nuova chat.

## Cosa risolve

| Problema senza skill system | Con questo template |
|------------------------------|---------------------|
| L'agente legge file a caso e indovina | Una bussola lo instrada al file giusto |
| Rispieghi le stesse preferenze ogni chat | Un vocabolario le ricorda al posto tuo |
| Ogni sessione riparte da zero | Report + log lasciano una traccia |
| Le regole stanno tutte in un file gigante | Bussola snella + mappe di dettaglio separate |

## I 4 pilastri

1. **Skill 0 / Bussola** (`00_BUSSOLA_SKILL.md`) — il file che l'agente legge **sempre per
   primo**. Smista: «task tipo X → carica file Y». Resta **piccolo**.
2. **File di contesto per zona** (`context/`) — le mappe di dettaglio di ogni grande sezione
   del progetto. L'agente li apre **solo quando lavora su quella zona**.
3. **Vocabolario** (`comunicazione/VOCABOLARIO.md`) — la tua «bibbia»: le tue parole →
   comportamento agente (3 livelli di libertà) **e** orientamento nell'app.
4. **Memoria di sessione** (`sessioni/`) — report, log, follow-up. Quello che resta tra una
   chat e l'altra.

**(Opzionale) Sottosistema didattico** — trasforma le chat **senior** in scuola continua: glossario
vivo + profilo scolastico + roadmap skill, con lezione e richiamo *spaced-repetition* a fine chat.
Vive nella cartella privata, si attiva dal `MANUALE_AVVIO.md` (passo 8-bis). **Solo l'agente
senior/Meta** lo usa, mai gli agenti di lavoro normali. Vedi `comunicazione/EVOLUZIONE_SKILLS.md`
stato in §3. In questo progetto non è attivo.

## Struttura della cartella

```
_skill-system-v0/
├── README.md                      ← questo file (cos'è, struttura)
├── MANUALE_AVVIO.md               ← guida passo-passo per un NUOVO progetto
├── REGOLE_ORGANIZZATIVE.md        ← come tenere root e cartelle pulite (anti-disordine)
│
├── 00_BUSSOLA_SKILL.md            ← Skill 0: tabella routing + profili + LOCK globali
├── CLAUDE.md.template             ← file master del progetto (comandi, file critici)
│
├── context/                       ← una mappa di dettaglio per ogni grande zona
│   ├── _TEMPLATE_CONTEXT.md       ← copia questo per ogni nuova zona
│   └── ESEMPIO_ZONA_CONTEXT.md    ← esempio compilato (da cancellare)
│
├── aree/                          ← skill specializzate (DB, UI, Testing, ...)
│   ├── _TEMPLATE_AREA_SKILL.md
│   └── TESTING_SKILL.md.template
│
├── comunicazione/                 ← il vocabolario e il suo ciclo di vita
│   ├── VOCABOLARIO.md             ← bibbia: lessico-comando + lessico-mappa
│   ├── OSSERVAZIONI.md            ← dati grezzi (cosa ha detto l'utente, conteggi)
│   ├── PROPOSTE.md                ← parole candidate in attesa di approvazione
│   ├── ERRORI_PROCESSO.md         ← pattern di errore ricorrenti
│   ├── REVISIONE.md               ← compiti dell'agente Meta (chi affina il sistema)
│   ├── EVOLUZIONE_SKILLS.md       ← roadmap operativa del sistema + idee
│   ├── CHIUSURA_SESSIONE.md       ← guida unica della fase fine-chat (report + commit/push/DB/terminali)
│   └── COMUNICAZIONE_SKILL.md     ← stile di risposta (breve, concreto, no gergo)
│
├── hooks/                         ← (opzionale) enforcement vero della fase fine-chat
│   ├── fine-sessione-nudge.mjs.template ← esempio hook `stop` non installato
│   ├── hooks.json.template        ← esempio config da adattare
│   └── README.md                  ← come installarlo e cosa adattare
│
└── sessioni/
    ├── _TEMPLATE_REPORT.md        ← modello report di fine sessione
    ├── SESSION_LOG.md             ← indice cronologico one-liner
    └── FOLLOW_UP.md               ← debiti tecnici differiti (FU-NNN)
```

## Come si usa nel progetto corrente

1. Leggi `00_BUSSOLA_SKILL.md`.
2. Scegli il profilo per il deliverable e carica solo skill/context instradati.
3. Verifica codice e lockfile per valori e comportamento effettivi.
4. Se codice e documenti divergono, segnala il drift e aggiorna la fonte competente nello stesso lavoro.
5. Usa `MANUALE_AVVIO.md` solo quando estrai il sistema per un progetto nuovo.

## Principi di design (perché è fatto così)

- **La bussola non è un archivio.** Smista, non spiega. I dettagli stanno nei file di contesto.
- **Un solo vocabolario, due funzioni.** Comando (come ti comporti) + mappa (cosa intendi).
  Non due file da tenere allineati.
- **Le parole battono le frasi.** Dove esiste una parola di vocabolario, la usi come trigger:
  meno testo, meno fraintendimenti.
- **Chi esegue ≠ chi revisiona ≠ chi affina.** Ruoli separati per evitare l'auto-approvazione.
- **Fiducia misurabile.** Una regola nasce prudente (Liv. 3), raccoglie esiti, sale a Liv. 1
  solo quando si è dimostrata affidabile.
- **La fase fine-chat ha una casa sola.** Report, commit, push, allineamento branch/DB e terminali
  stanno tutti in `comunicazione/CHIUSURA_SESSIONE.md` (coesione per fase del ciclo di vita). Se
  l'IDE lo permette, un hook `stop` (`hooks/`) la blinda: rilancia l'agente se il report è incompleto.
- **Markdown vs enforcement vero.** Una regola `.md` l'agente *dovrebbe* seguirla; un hook la
  *esegue la macchina*. Quando un comportamento critico viene saltato nonostante la regola, serve
  l'hook — non un'altra regola markdown. Vedi `comunicazione/EVOLUZIONE_SKILLS.md`.
- **Didattica = governance soft, solo senior.** L'introduzione-termini e la lezione-fine-chat si
  verificano solo dalla *conversazione*, non dai file → nessun hook: solo regola nel Playbook senior
  + file vivi privati. E vale **solo** per l'agente senior/Meta, non per gli agenti di lavoro normali.
- **Niente disordine in root.** Vedi `REGOLE_ORGANIZZATIVE.md`.

---

*Copia operativa riallineata al progetto il 2026-07-02; i file esplicitamente marcati template
restano riusabili per altri progetti.*
