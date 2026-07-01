# hooks/ — template opzionali, non installati

> In questa repository **non c'è enforcement hook attivo**. I file `*.template` sono esempi generici:
> contengono path, formato data e regex da adattare prima di copiarli nella configurazione dell'IDE.
> Finché non esiste una config installata e testata, valgono soltanto le regole Markdown.

## Cosa c'è qui

| File | Evento | Cosa fa |
|------|--------|---------|
| `fine-sessione-nudge.mjs.template` | `stop` (Cursor) | esempio generico per report |
| `guard-prod.mjs.template` | pre-esecuzione (Cursor) | esempio generico di guardia PROD |
| `fine-sessione-senior.mjs.template` | `Stop` (Claude Code) | esempio avanzato |
| `hooks.json.template` | — | config Cursor da copiare/adattare |

## Perché v4 (da «titolo» a «risposta»)

Le versioni v1-v3 controllavano la **presenza del titolo** di una sezione: un titolo con sotto il
vuoto passava. La **v4** controlla che ogni domanda di chiusura abbia una **risposta piena**. Per
rispondere a «i dati corrispondono al diff?» e «i file correlati sono allineati?» l'agente DEVE
rileggere diff e file → la verifica intelligente la fa lui, l'hook controlla solo che abbia risposto.
È il meccanismo più forte senza un agente-revisore separato. Le 6 domande stanno in
`comunicazione/CHIUSURA_SESSIONE.md` §11.

## Come si installa (Cursor)

1. Copia gli script senza suffisso `.template` dove preferisci (es. `.cursor/hooks/`).
2. Fondi il contenuto di `hooks.json.template` in `.cursor/hooks.json` (se ne hai già uno, **unisci** le
   sezioni invece di sovrascrivere). Allinea i `command` ai percorsi reali.
3. Verifica che `node` sia sul PATH dell'IDE.
4. Verifica che Git invochi davvero Husky: `git config core.hooksPath` deve restituire `.husky`.
   Se restituisce `nul`, riattiva con `git config core.hooksPath .husky`. Su Windows il file
   `.husky/pre-commit` deve iniziare con `#!/usr/bin/env sh`, altrimenti Git puo fallire con
   `cannot spawn .husky/pre-commit`.
5. Per il guard-prod: apri la copia di `guard-prod.mjs.template` e adatta i valori in « CONFIG DA ADATTARE » (nome server
   MCP prod/test, comandi shell). Senza questo passaggio non riconosce il tuo ambiente.

Per Claude Code: registra gli hook in `.claude/settings.local.json` (`PreToolUse` per guard-prod,
`Stop` per la copia adattata di `fine-sessione-senior.mjs.template`).

## Da adattare negli script (segnati in « CONFIG » in testa a ogni file)

- **nudge:** `REPORTS_DIR` (dove vanno i report), `CHIUSURA_DOC` (path citato nei messaggi).
- **guard-prod:** `PROD_MCP_RE` / `TEST_MCP_RE` (nome server MCP), `SHELL_PROD_RE` (comandi CLI).
- **senior:** come il nudge + `EVOLUZIONE_DOC`, `TEMPLATE_V0_DIR`.

## Limiti onesti

- **Gira solo su IDE locale.** Gli hook `stop`/`beforeMCPExecution` NON girano sui Cloud/remote
  Agents. Per quelli serve un fallback soft (checklist nel prompt + regola sicurezza PROD in
  `comandi-base`).
- **Verifica i file/payload, non la chat.** L'hook sa se una risposta *esiste ed è piena*, non se è
  *vera*: per questo il cold-check va eseguito come guardia separata al commit.
- **guard-prod = `ask`, non `deny`.** Ferma e chiede conferma, non vieta del tutto (una scrittura prod
  a volte è legittima). Nota Claude Code: un `ask` NON vince un `allow` già concesso in settings — togli
  gli `allow` espliciti sui tool di scrittura PROD perché la guard morda.

> Stato enforcement del progetto: `comunicazione/EVOLUZIONE_SKILLS.md` §1.
