---
name: bussola
description: >-
  Skill 0 — orienta qualsiasi agente sul progetto FREEDOM TRADING SYSTEM. Caricalo a inizio
  sessione, quando non sai quale skill usare, o quando il task attraversa più aree.
  Mappa il progetto, definisce gli invarianti globali e instrada al file corretto.
---

# Bussola — Skill 0 / orientamento agente

> Stack: React + Vite + Tailwind + Zustand (client) · Node.js + Express (server) · Supabase
> (Postgres + Auth + Storage) · Google **Gemini** (modello con vista) via `providerClient` (switcher).
> File master: `CLAUDE.md` (root). Contesto prodotto: `docs/CONTESTO_PRODOTTO.md`. Piano: `docs/PIANO_LAVORO.md`.
>
> **Schema di lavoro (fonte di verità):** Senior → intervista → contesto (`context/`, `aree/`) →
> `docs/PIANO_LAVORO.md` allineato → skill `PREPARA_PROMPT_SKILL.md` → agente Esecutore. Dettaglio
> in `docs/CONTESTO_PRODOTTO.md` §Schema di lavoro.

> **Questa è la bussola: smista, non spiega.** I dettagli di implementazione di ogni zona
> stanno nei file di `context/`. Tieni questo file **sotto ~250 righe**.

---

## 0. Prima cosa: scegli il profilo e instrada

### 0.0 Profilo di ingresso

Capisci **che tipo di task** stai per fare. Il profilo riduce il contesto che carichi:
non leggi skill fuori dal tuo profilo.

| Profilo | Tipo di task | Parole-trigger | Carica | Salta |
|---------|--------------|----------------|--------|-------|
| **Esecuzione** | feature, fix, lavoro UI | `esegui · implementa · costruisci · sistema` (vedi VOCABOLARIO) | file di `context/` della zona pertinente | testing/debug/meta |
| **Verifica** | debug, test, revisione | `verifica · testa · revisiona · debugga` | skill testing + context della zona revisionata | meta |
| **Meta** | affinamento sistema/comunicazione | `affina · vocabolario · skill system` | solo `comunicazione/` (sottosistema didattico non attivo) | tutte le skill di codice |

> I profili non si sovrappongono. Discriminante: **cosa produce il task**. Esecuzione produce
> codice; Verifica controlla codice già prodotto (sempre coi test); Meta lavora sul sistema
> documentale e sulla comunicazione, non sul codice.

> ⚠️ **I LOCK battono il profilo.** Le righe marcate **OBBLIGATORIO** e gli invarianti §4
> valgono sempre, anche in un fix «piccolo».

### 0.0b Indice mini-pack (ingresso rapido per le aree molto usate)

Alcune aree hanno un **mini-pack** `{{AREA}}_MINI.md`: un ingresso ~1 schermata (trigger · carica
subito · divieti top-3 · mappa · LOCK solo-link). I LOCK hanno **un solo master** (skill/context):
il mini-pack li cita per nome+link, non li duplica.

| Area | Mini-pack (ingresso) | Skill piena |
|------|----------------------|-------------|
| _(nessun mini-pack ancora — tier opzionale: si crea quando un'area diventa molto usata)_ | — | — |

> Aggiungi una riga qui quando crei un mini-pack (vedi `MANUALE_AVVIO.md` passo 4-bis).

### 0.1 Le parole battono le frasi

I trigger della tabella sotto sono il riferimento rapido. La **fonte autorevole** (con livello
di libertà e comportamento) è `comunicazione/VOCABOLARIO.md`.

- Dove esiste una **parola Liv. 1** che mappa una zona → usala come trigger.
- Dove non c'è ancora una parola → si tiene la **frase-trigger descrittiva**, finché l'agente
  Meta non conia la parola (vedi `comunicazione/REVISIONE.md`).

---

## 0.2 Tabella di routing

Leggi il task e applica questa tabella. Carica il file indicato **prima** di aprire qualsiasi
file da modificare. I file `*(da creare)*` nascono via intervista nei prossimi giri.

| Il task riguarda… | File da caricare |
|-------------------|------------------|
| Chat di analisi (avvio/form, invio messaggio, screenshot, streaming, follow-up) | `context/CHAT_ANALISI_CONTEXT.md` ⚠️ tocca il kit (LOCK §2) |
| Motore agente / kit Aware Trader (skillLoader→promptBuilder→providerClient→orchestrator) | `aree/AGENTE_AI_SKILL.md` *(da creare)* ⚠️ LOCK §2 |
| Autenticazione / account / sessione utente | `context/AUTH_CONTEXT.md` ⚠️ deep (§6) |
| Sidebar / storico chat / nuova chat | `context/SIDEBAR_STORICO_CONTEXT.md` *(da creare)* |
| Impostazioni (tema · cambio password · scelta modello) | `context/IMPOSTAZIONI_CONTEXT.md` *(da creare)* |
| Estetica / stile UI (sfondo animato, tema verde-scuro) | `context/ESTETICA_CONTEXT.md` *(da creare)* |
| DB / schema / migrazioni / RLS (Supabase) | `aree/DB_SUPABASE_SKILL.md` *(da creare)* ⚠️ deep (§6) |
| Test / CI | `aree/TESTING_SKILL.md` |
| Come rispondere / report / vocabolario | `comunicazione/COMUNICAZIONE_SKILL.md` |
| Affinare il sistema / promuovere voci | `comunicazione/REVISIONE.md` (sessione dedicata) |
| **Non è chiaro di quale area si tratti** | **Fermati e chiedi — NON indovinare** (vedi §0.3) |

> **Regola sub-task:** ogni volta che scomponi il lavoro in sotto-task, **ripeti questa domanda**
> per ciascuno — rivalutando sia il profilo (§0.0) sia la riga di routing.

### 0.3 Regola anti-buco (la rete di sicurezza)

Se **nessuna riga** della tabella matcha il task, o matchano **più righe in conflitto**:
1. **Non indovinare** quale file caricare.
2. Fai una domanda breve all'utente per disambiguare la zona.
3. Se emerge una zona nuova non mappata → segnalala come candidata in `comunicazione/PROPOSTE.md`.

---

## 1. Mappa del progetto

Demo minimal + estetica beta. Tre luoghi (**Chat** · **Sidebar/Storico** · **Impostazioni**) +
**Login** come porta d'ingresso. Il codice è ancora da costruire (vedi `docs/PIANO_LAVORO.md`):
gli entry point sotto sono quelli **previsti**, non ancora verificati.

| Area | Entry point (previsto) | Note |
|------|------------------------|------|
| Chat di analisi (cuore) | `client/src/pages/Chat.jsx` + `server/src/agent/*` | Riusa la catena agente; risposta in streaming |
| Motore agente / kit | `server/src/agent/` + `kit/` | Kit caricato come system prompt, lato server |
| Auth / account | Supabase Auth + `client/src/pages/Login.jsx` | Isolamento per utente via RLS |
| Sidebar / storico | `client/src/components/layout/Sidebar.jsx` | Storico chat per utente |
| Impostazioni | `client/src/pages/Settings.jsx` | Tema · cambio password · scelta modello |
| Estetica | `client/src/components/layout/AnimatedBackground.jsx` | Da ricostruire (non nell'estratto) |

---

## 2. Invarianti globali — valgono in ogni task, in ogni file

```
LOCK  kit/ (metodo Aware Trader)         — valore distintivo. Solo lato server, MAI esposto al client.
                                           Mai citare il nome-metodo proibito (vedi CONTESTO_PRODOTTO).
                                           Si riusa pari-pari, ripulito.
LOCK  catena agente                      — skillLoader → promptBuilder → providerClient → orchestrator:
                                           riusare così com'è. Si adatta SOLO providerClient (Gemini + streaming).
LOCK  segreti (.env, chiavi AI/Supabase) — chiave Gemini e service key Supabase solo lato server, mai nel
                                           client/bundle. `.env` e `/uploads` gitignored. Nessun segreto nel codice.
LOCK  isolamento per utente (RLS)        — ogni utente accede SOLO a proprie chat/messaggi/file.
                                           Verificato esplicitamente. Mai query cross-utente senza policy.
```

> Per i file LOCK l'agente DEVE: (1) leggere prima tutti i file collegati per capire l'impatto;
> (2) identificare i conflitti; (3) procedere solo se la modifica preserva l'integrità
> strutturale e i contratti esistenti. Se viola un invariante documentato → discutere con
> l'utente prima.

### RULE globali (valgono ovunque — non spostare nei context)

```
RULE  Leggere INTERO il file da toccare + i file collegati prima di editare.
RULE  Anti-duplicazione: prima di scrivere un helper, cerca se esiste già. Se compare in 2+ file → estrai.
RULE  Logger: usa il logger del progetto, mai console.log in codice di produzione.
RULE  Vision obbligatoria: il modello deve vedere le immagini (multimodale). Mai degradare a text-only.
RULE  Disclaimer non rimovibile e sempre visibile: «Strumento di supporto all'analisi tecnica. Non è consulenza finanziaria.»
RULE  Stile agente (vincolo prodotto, kit 08/09): prosa breve, niente elenchi puntati, niente
      «compra/vendi» come ordine, niente paternalismo.
RULE  Test per ogni funzione (richiesta utente). Dopo modifiche JS: `node --check`. Niente merge senza test verdi.
RULE  Scale-ready, non scale-features: scelte che non inchiodano (DB gestito, RLS, stateless, modularità),
      ma NIENTE pagamenti/crediti/multi-tenant ora (anti-scope — CONTESTO_PRODOTTO §Anti-scope).
```

---

## 3. Struttura cartelle

```
Trading-Platform/                 (repo: freedom-trading-system)
├── CLAUDE.md                     master per Claude Code
├── README.md · .gitignore · .env.example
├── docs/
│   ├── CONTESTO_PRODOTTO.md      fonte di verità del prodotto
│   ├── PIANO_LAVORO.md           piano a milestone
│   └── skill-system-trading-platform/   (questo sistema)
├── client/                       React+Vite+Tailwind+Zustand (scaffold M0 ✅, zone da costruire)
├── server/                       Node+Express ESM (scaffold M0 ✅, agente da costruire)
├── kit/                          metodo Aware Trader (LOCK, lato server)
├── _private/                     gitignored, non-obbligatorio per gli agenti
└── _sessioni-lavoro/             gitignored — report di lavoro datati AAAA-MM-GG (indice in sessioni/SESSION_LOG.md)
```

> Regola: le **skill** stanno in `docs/skill-system-trading-platform/` (casa unica). Il **privato**
> sta in `_private/` (gitignored) e NON è contesto obbligatorio per gli agenti. Vedi `REGOLE_ORGANIZZATIVE.md`.

---

## 4. Comandi principali

```bash
# Provvisori — da finalizzare quando parte il codice (vedi PIANO_LAVORO M0)
npm run dev            # dev server (client + server)
npm test               # test unitari (test per ogni funzione)
npm run validate       # lint + typecheck + test (pre-PR)
node --check <file.js> # check sintassi dopo modifiche JS
```

---

## 5. Obbligo inizio e fine sessione

- **A inizio sessione**, l'agente carica `comunicazione/COMUNICAZIONE_SKILL.md` e — se userà il
  vocabolario o farà domande — mostra all'utente la **checklist di apertura**. Vedi quella skill.
- **A fine sessione** (se l'utente conferma successo, su «lavoro ok» o «report finale»), l'agente esegue
  il protocollo di chiusura **secondo la modalità del task** (§6): report in `_sessioni-lavoro/AAAA-MM-GG/`
  (gitignored), aggiornamento dell'indice `sessioni/SESSION_LOG.md` + `FOLLOW_UP.md`, raccolta dati
  comunicazione, checklist di chiusura. **Fonte unica:**
  `comunicazione/CHIUSURA_SESSIONE.md` (Parte A = report; Parte B = commit/push/branch/DB/terminali).
  Lo stile sta in `comunicazione/COMUNICAZIONE_SKILL.md`; il modello in `sessioni/_TEMPLATE_REPORT.md`.
  Se è installato l'hook `stop` (`hooks/`), a fine chat ti rilancia per completare il report.
- **Sottosistema didattico:** NON attivo in questo progetto (gli agenti di lavoro non danno lezioni).

> ⚠️ TEMPORANEA (rimuovere quando esiste codice e i comandi §4 sono confermati): finché la repo è
> in setup documentale, gli entry point (§1) e i comandi (§4) sono **previsti**, non verificati.

---

## 6. Peso della sessione: light / standard / deep

Ogni task ha una **modalità** che decide quanto del §5 (chiusura) si applica.

**Chi la decide:** se c'è un agente a monte (`PREPARA_PROMPT_SKILL.md`), la classifica lui e la
scrive come prima riga del prompt (`Modalità: standard`). Altrimenti la deduce l'agente di lavoro.

| Modalità | Quando | Chiusura (§5) |
|----------|--------|----------------|
| **light** | fix piccolo, 1 file/zona, basso rischio, nessun trigger deep | 1 riga in `SESSION_LOG.md`; niente report |
| **standard** | feature o fix normale, una zona | report normale + Dati comunicazione; allinea le skill toccate |
| **deep** | vedi trigger | protocollo completo: report esaustivo + follow-up + allineamento skill |

**Trigger DEEP obbligatori** (basta uno):
- DB / migrazioni / Supabase / sicurezza-RLS — dove un errore costa caro;
- **file LOCK / invarianti** (§4) — kit, catena agente, segreti, isolamento utente;
- **più di una view / un nuovo componente o comportamento**;
- auth / login / account — flussi identità.

Se nessun trigger scatta: **light** se è davvero piccolo, altrimenti **standard**. Nel dubbio, il più alto.

> **L'agente di lavoro può solo ALZARE la modalità in corsa, mai abbassarla.** Nel dubbio ci si protegge.
