# FREEDOM TRADING SYSTEM

Webapp di **supporto all'analisi tecnica**: l'utente carica screenshot di grafici di trading e un
agente AI li legge e li commenta applicando il metodo **Aware Trader**.

> ⚠️ **Disclaimer:** strumento di supporto all'analisi tecnica. **Non è consulenza finanziaria**, non
> fornisce segnali operativi e non dice «compra/vendi».

---

## Stato

🟡 **Fase 0 — demo pre-intervista, M8 in corso.** La demo è funzionante: login, Home, nuova analisi
multimodale, streaming, storico, impostazioni e blindatura base dell'agente sono implementati.
Restano QA end-to-end, hardening e deploy. Vedi [`docs/PIANO_LAVORO.md`](docs/PIANO_LAVORO.md).

## Stack

- **Client:** React + Vite + Tailwind + Zustand
- **Server:** Node.js + Express
- **Dati & auth:** Supabase (Postgres + Auth); gli screenshot non vengono conservati in Storage
- **AI:** Google Gemini (modello con vista) via uno *switcher* di provider

## Struttura

```
.
├── CLAUDE.md                 guida per gli agenti AI (Claude Code)
├── docs/
│   ├── CONTESTO_PRODOTTO.md  fonte di verità del prodotto
│   ├── PIANO_LAVORO.md       piano a milestone
│   └── skill-system-trading-platform/   sistema operativo per gli agenti
├── client/                   frontend React funzionante
├── server/                   API Express + agente AI funzionante
└── kit/                      metodo Aware Trader (system prompt, lato server)
```

## Come si lavora a questo progetto

Lo sviluppo segue uno **schema documentale-prima-del-codice**:

```
Senior → intervista → contesto (skill system) → piano allineato → prepara-prompt → esecutore → verifica
```

Dettagli in [`docs/CONTESTO_PRODOTTO.md`](docs/CONTESTO_PRODOTTO.md) e nello skill system in
[`docs/skill-system-trading-platform/`](docs/skill-system-trading-platform/).

## Sicurezza

I segreti (chiavi Gemini e Supabase) vivono **solo lato server** in un file `.env` **mai committato**
(vedi [`.env.example`](.env.example)). Ogni utente accede solo ai propri dati (isolamento RLS).

## Setup

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```

Su PowerShell con esecuzione script disabilitata usa `npm.cmd`. `npm run validate` include test RLS
che creano e cancellano dati sul progetto Supabase remoto: eseguilo solo dopo aver confermato che
l'ambiente collegato è quello di test previsto. Dettaglio in
[`TESTING_SKILL.md`](docs/skill-system-trading-platform/aree/TESTING_SKILL.md).
