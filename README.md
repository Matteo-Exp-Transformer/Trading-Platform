# FREEDOM TRADING SYSTEM

Webapp di **supporto all'analisi tecnica**: l'utente carica screenshot di grafici di trading e un
agente AI li legge e li commenta applicando il metodo **Aware Trader**.

> ⚠️ **Disclaimer:** strumento di supporto all'analisi tecnica. **Non è consulenza finanziaria**, non
> fornisce segnali operativi e non dice «compra/vendi».

---

## Stato

🚧 **Fase 0 — demo pre-intervista.** In costruzione: attualmente repo in setup documentale, il codice
viene pianificato per milestone. Vedi [`docs/PIANO_LAVORO.md`](docs/PIANO_LAVORO.md).

## Stack

- **Client:** React + Vite + Tailwind + Zustand
- **Server:** Node.js + Express
- **Dati & auth:** Supabase (Postgres + Auth + Storage)
- **AI:** Google Gemini (modello con vista) via uno *switcher* di provider

## Struttura

```
.
├── CLAUDE.md                 guida per gli agenti AI (Claude Code)
├── docs/
│   ├── CONTESTO_PRODOTTO.md  fonte di verità del prodotto
│   ├── PIANO_LAVORO.md       piano a milestone
│   └── skill-system-trading-platform/   sistema operativo per gli agenti
├── client/                   frontend (in arrivo)
├── server/                   backend + agente AI (in arrivo)
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

_Istruzioni in arrivo con la milestone M0 (fondamenta repo & tooling)._
