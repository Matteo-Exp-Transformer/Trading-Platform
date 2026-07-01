# CLAUDE.md — Guida per sessioni AI (FREEDOM TRADING SYSTEM)

> File master per **Claude Code**. Vive nella **root**. Una sola fonte di verità.
>
> Prodotto: `docs/CONTESTO_PRODOTTO.md` · Piano: `docs/PIANO_LAVORO.md` ·
> Skill system: `docs/skill-system-trading-platform/`.

## Orientamento

All'inizio di **ogni** sessione l'agente carica la **Bussola**
(`docs/skill-system-trading-platform/00_BUSSOLA_SKILL.md`): instrada al file di contesto giusto e
definisce profili (Esecuzione / Verifica / Meta) e LOCK globali. Se non sai dove lavorare → Bussola §0.2.

## Schema di lavoro (fonte di verità)

```
Agente Senior → intervista all'utente → contesto nello skill system (context/, aree/)
   → docs/PIANO_LAVORO.md allineato → skill PREPARA_PROMPT_SKILL.md → agente Esecutore (codice + test)
   → Verifica → chiusura (report)
```

Prima si **definisce e mappa** (intervista → contesto), poi si **esegue** (prompt → codice). Non
si scrive codice di una zona prima che il suo file di `context/` esista. Dettaglio in
`docs/CONTESTO_PRODOTTO.md` §Schema di lavoro.

## Comandi e vocabolario (leggi a inizio sessione)

> Fonte di verità: `docs/skill-system-trading-platform/comunicazione/VOCABOLARIO.md`. Applica la voce
> quando l'utente usa una parola mappata. **Livelli:** Liv. 1 = applica subito · Liv. 2 = applica, ma se
> ambiguo una domanda breve prima · Liv. 3 = chiedi sempre conferma. **Comando non riconosciuto → non
> dedurre, chiedi prima.**

## File critici

| File | Perché è importante |
|------|---------------------|
| `kit/` | Metodo Aware Trader (system prompt dell'AI). LOCK: solo server, mai esposto, mai citare il nome-metodo proibito. |
| `server/src/agent/` | Catena agente (skillLoader→promptBuilder→providerClient→orchestrator). LOCK: riusare; si adatta solo providerClient (Gemini+streaming). |
| `.env.local` | Chiavi Gemini + Supabase service key (root, gitignored; modello in `.env.example`). LOCK: solo server, mai nel client. |
| `docs/CONTESTO_PRODOTTO.md` | Fonte di verità di prodotto e decisioni LOCKED. |

## Comandi principali

```bash
# Confermati da M0. ESEGUIRE SEMPRE DALLA ROOT del repo (monorepo npm workspaces):
# gli script vivono nel package.json di root, non nelle sottocartelle client/ o server/.
npm run dev            # dev server (client 5173 + server 3001)
npm test               # test unitari (client + server, per ogni funzione)
npm run validate       # gate pre-PR = lint + test (NON typecheck: JS, non TS)
npm run build          # build produzione del client
node --check <file.js> # check sintassi dopo modifiche JS (solo .js, non .jsx)
```

## Convenzioni

- **Comunicazione con l'utente:** breve, concreta, no gergo. Vedi
  `docs/skill-system-trading-platform/comunicazione/COMUNICAZIONE_SKILL.md`. L'utente non è
  profondamente tecnico: spiega semplice, gestisci l'implementazione, non farlo debuggare a mano.
- **Lingua:** tutto in italiano (UI, agente, documentazione).
- **Test:** una funzione = almeno un test. Niente merge senza test verdi.
- **Commit:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`…). Commit/push **solo se richiesto**.

## Zone delicate / LOCK

Sintesi (testo pieno: Bussola §2): `kit/` · catena agente · segreti `.env.local` · isolamento per utente (RLS).
I LOCK battono il profilo: valgono anche in un fix piccolo.

## Regole organizzative

Root pulita, skill in una sola casa (`docs/skill-system-trading-platform/`), privati in `_private/`
(gitignored). Vedi `docs/skill-system-trading-platform/REGOLE_ORGANIZZATIVE.md`.
