---
name: bussola
description: >-
  Skill 0 — orienta qualsiasi agente sul progetto FREEDOM TRADING SYSTEM. Caricalo a inizio
  sessione, quando non sai quale skill usare, o quando il task attraversa più aree.
  Mappa il progetto, definisce gli invarianti globali e instrada al file corretto.
---

# Bussola — Skill 0 / orientamento agente

> Stack: React + Vite + Tailwind (client; Zustand è una dipendenza scaffold non usata dai flussi
> correnti) · Node.js + Express (server) · Supabase (Postgres + Auth; niente Storage immagini) ·
> Google **Gemini** multimodale via `providerClient` (switcher).
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
| **Prepara/Senior** | intervista, piano, prompt | `prepara · prepara prompt · intervista` | `sessioni/HANDOFF.md` per primo + `PREPARA_PROMPT_SKILL.md` | codice |
| **Esecuzione** | feature, fix, lavoro UI | `esegui · implementa · costruisci · sistema` (vedi VOCABOLARIO) | file di `context/` della zona pertinente | testing/debug/meta |
| **Verifica** | debug, test, revisione | `verifica · testa · revisiona · debugga` | skill testing + context della zona revisionata | meta |
| **Meta** | affinamento sistema/comunicazione | `affina · vocabolario · skill system` | documenti Meta/organizzativi; context solo da evidenze Verifica | codice applicativo |

> Ogni sub-task ha un solo profilo. Una richiesta composta può eseguire in sequenza **Verifica**
> (evidenze sul codice) e **Meta** (riallineamento documentale); Meta non modifica l'app.

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
file da modificare. Se una zona nuova non ha context, si applica la regola anti-buco (§0.3).

| Il task riguarda… | File da caricare |
|-------------------|------------------|
| Chat di analisi (avvio/form, invio messaggio, screenshot, streaming, follow-up) | `context/CHAT_ANALISI_CONTEXT.md` ⚠️ tocca il kit (LOCK §2) |
| Motore agente / kit Aware Trader (skillLoader→promptBuilder→providerClient→orchestrator) | `aree/AGENTE_AI_SKILL.md` ✅ ⚠️ LOCK §2 |
| Autenticazione / account / sessione utente | `context/AUTH_CONTEXT.md` ⚠️ deep (§6) |
| Sidebar / storico chat / nuova chat | `context/SIDEBAR_STORICO_CONTEXT.md` ✅ |
| Impostazioni (tema · cambio password · modello AI per-account) | `context/IMPOSTAZIONI_CONTEXT.md` ✅ ⚠️ deep (§6) |
| Estetica / stile UI (palette slate + accento ciano, sobrio) | `context/ESTETICA_CONTEXT.md` ✅ |
| Home / landing dopo login (sfondo animato, hero, CTA) | `context/HOME_CONTEXT.md` ✅ (+ `ESTETICA_CONTEXT` per i token) |
| Journal / diario di trading (voci, esiti, «salva nel journal») | `context/JOURNAL_CONTEXT.md` ✅ (+ `aree/DB_SUPABASE_SKILL.md` per `journal_entries`) |
| Blindatura agente / dominio / jailbreak / canary / classificatore | `context/SICUREZZA_CONTEXT.md` ✅ + `aree/AGENTE_AI_SKILL.md` ⚠️ LOCK §2 |
| DB / schema / migrazioni / RLS (Supabase) | `aree/DB_SUPABASE_SKILL.md` ✅ ⚠️ deep (§6) |
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

Demo funzionante con **Login · Home · Chat · Sidebar/Storico · Impostazioni**. M0–M7-bis sono
implementate; M8 (hardening, QA, deploy) è in corso.

| Area | Entry point reale | Note |
|------|-------------------|------|
| Routing | `client/src/App.jsx` | `/login`, `/`, `/nuova-analisi`, `/impostazioni` |
| Home | `client/src/pages/Home.jsx` + `components/home/*` | landing scura, mercati, ultima sessione, card |
| Chat | `client/src/pages/Chat.jsx` + `components/chat/*` | form, vision, streaming, max 5 follow-up |
| Motore agente / sicurezza | `server/src/agent/*` + `server/src/routes/agent.js` + `kit/` | kit server-side, classificatore, canary |
| Auth / dati | `client/src/auth/*` + Supabase | sessione e owner-only via RLS |
| Sidebar / storico | `client/src/components/layout/*` | drawer condiviso |
| Impostazioni | `client/src/pages/Settings.jsx` | tema e password; modello admin-only |

---

## 2. Invarianti globali — valgono in ogni task, in ogni file

```
LOCK  kit/ (metodo Aware Trader)         — valore distintivo. Solo lato server, MAI esposto al client.
                                           Mai citare il nome-metodo proibito (vedi CONTESTO_PRODOTTO).
                                           Si riusa pari-pari, ripulito.
LOCK  catena agente                      — skillLoader → promptBuilder → providerClient → orchestrator:
                                           preservare ordine e responsabilità. Formato/chiamata provider SOLO
                                           in providerClient; estensioni approvate attorno alla catena.
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
RULE  Logging: oggi non esiste un logger condiviso. Non aggiungere nuovi console.* fuori dai punti
      boot/errore già presenti; introdurre un logger richiede un task esplicito.
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
├── client/                       React+Vite+Tailwind, app funzionante
├── server/                       Node+Express ESM, API e agente funzionanti
├── kit/                          metodo Aware Trader (LOCK, lato server)
├── _private/                     gitignored, non-obbligatorio per gli agenti
└── _sessioni-lavoro/             gitignored — report di lavoro datati AAAA-MM-GG (indice in sessioni/SESSION_LOG.md)
```

> Regola: le **skill** stanno in `docs/skill-system-trading-platform/` (casa unica). Il **privato**
> sta in `_private/` (gitignored) e NON è contesto obbligatorio per gli agenti. Vedi `REGOLE_ORGANIZZATIVE.md`.

---

## 4. Comandi principali

```bash
# Confermati da M0. ESEGUIRE SEMPRE DALLA ROOT (monorepo npm workspaces): gli script stanno
# nel package.json di root, NON in client/ o server/ (lì `npm run validate` non esiste → falso allarme).
npm run dev            # dev server (client 5173 + server 3001)
npm test               # test unitari (client + server, per ogni funzione)
npm run validate       # gate pre-PR = lint + test (NON typecheck: è JS)
npm run build          # build produzione del client
node --check <file.js> # check sintassi dopo modifiche JS (solo .js, non .jsx)
```

> `validate` include test RLS che creano/cancellano dati sul Supabase remoto. Senza conferma
> dell'ambiente usare i gate locali di `aree/TESTING_SKILL.md`. Su PowerShell che blocca
> `npm.ps1`, usare `npm.cmd`.

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
  I file in `hooks/` sono materiale opzionale da adattare: non presumere che un hook sia installato.
- **Sottosistema didattico:** NON attivo in questo progetto (gli agenti di lavoro non danno lezioni).

> L'allineamento context↔codice avviene nello stesso task applicativo, prima della consegna. Il
> comando di chiusura aggiunge report/log ma non è il momento in cui si rimanda la documentazione.

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
