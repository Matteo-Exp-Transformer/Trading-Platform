---
name: testing
description: >-
  Skill per qualsiasi lavoro sui test del FREEDOM TRADING SYSTEM: unit e component (client),
  unit e RLS-live (server), lint, gate `validate`. Caricala quando il task riguarda test, oppure
  quando — in profilo Verifica — devi validare un lavoro prima di dichiararlo «fatto».
---

# Testing — Guida agente

> Stack: **Vitest** ovunque. Client: `jsdom` + `client/src/test/setup.js`. Server: Node +
> `server/test/setup-env.js`, `testTimeout: 30000`. Nessun runner E2E.
>
> Regola di prodotto (LOCK-soft, richiesta utente): **una funzione = almeno un test**. Niente merge
> con test rossi. Dopo modifiche JS: `node --check <file>`.

---

## 0. Quando caricare questo skill

| Il task riguarda… | Skill |
|-------------------|-------|
| Aggiungere/modificare test | **questo** |
| Analizzare un test che fallisce | **questo** |
| Profilo Verifica: validare un lavoro prima di «fatto» | **questo** (+ context della zona revisionata) |
| Modificare codice app (non i test) | skill/context della zona (Bussola §0.2) |

## 1. Regole d'oro

- **Una funzione = almeno un test** (richiesta utente). Prima di scriverne uno nuovo, **cerca se
  esiste già** un test utile ed **estendilo** invece di duplicare.
- **Niente merge senza test verdi.** `npm run validate` è il gate completo, ma oggi include due
  suite RLS che mutano il Supabase remoto: prima va confermato l'ambiente.
- **I test RLS live NON toccano dati di produzione utente**: creano e cancellano **utenti/righe usa-e-getta**
  sul progetto Supabase (via `service_role`). Non puntarli a dati reali di clienti; non lasciarli sporchi.
- **Vision/segreti:** i test non espongono chiavi. Le chiavi vivono in `.env.local` (gitignored); i
  test server le leggono da lì tramite `setup-env.js`. Mai hardcodare una chiave in un test.

## 2. Quando usare cosa

```
Logica pura / util (client o server)      → Vitest unit  (…test.js)
Componente React (render + interazione)   → Vitest + jsdom (…test.jsx, client)
Isolamento per utente / policy DB (RLS)   → Vitest server "live" su Supabase (…-rls.test.js)
Simuli un utente che clicca in un browser  → NON c'è E2E: usa la project skill "avvia-app" (QA manuale)
```

## 3. Comandi

```bash
npm test                    # tutti i test (client + server workspaces)
npm run test -w client      # solo client (unit + component, jsdom)
npm run test -w server      # solo server (unit + RLS live) — richiede .env.local popolato
npm run lint                # ESLint 9 (flat config) su tutto il repo
npm run validate            # GATE pre-PR = lint + test. Deve essere VERDE prima di dichiarare «fatto».
node --check <file.js>      # sanity sintattica dopo una modifica JS
```

> **Attenzione ai test server:** le suite `server/test/*-rls.test.js`
> colpiscono **Supabase reale** e possono creare/cancellare utenti e righe.
> `supabaseAdmin.test.js` è unitario e usa un mock. Se `.env.local` non ha
> `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY`, falliscono con errori di rete/credenziali:
> non è una regressione del codice, è ambiente mancante. Non leggere `.env.local` per verificarlo:
> conferma con l'utente il progetto di test prima di eseguire.

### Gate locale sicuro (nessuna scrittura remota)

```bash
npm run lint
npm run test -w client
npm run test -w server -- --exclude "test/*-rls.test.js"
npm run build
```

Su PowerShell con execution policy restrittiva sostituire `npm` con `npm.cmd`. Se si usa il gate
locale, dichiarare esplicitamente quali suite RLS non sono state rieseguite.

## 4. Dove vivono i test

| Zona | Percorso | Tipo |
|------|----------|------|
| Client — util/librerie | `client/src/lib/*.test.js` (es. `theme`, `chatData`, `formUtils`, `imageCompression`, `agentApi`) | unit |
| Client — componenti/pagine | `client/src/**/*.test.jsx` (es. `pages/Chat`, `pages/Settings`, `components/chat/*`, `components/layout/Sidebar`) | component (jsdom) |
| Client — auth | `client/src/auth/*.test.jsx` (`AuthProvider`, `ProtectedRoute`) | component |
| Server — catena agente | `server/test/{promptBuilder,orchestrator,providerClient,transcript,models,agent-route}.test.js` | unit |
| Server — isolamento/DB | `server/test/*-rls.test.js` | **RLS live** |
| Server — client admin | `server/test/supabaseAdmin.test.js` | unit con mock |
| Server — salute | `server/test/health.test.js` | unit |

> Non riportare conteggi copiati da sessioni precedenti: eseguire e leggere l'esito reale.

## 5. Profilo Verifica — QA quando revisioni

> Caricare quando l'utente chiede «verifica/revisiona» o a fine sessione prima di dichiarare «fatto».

1. **Gate automatico:** `npm run validate` solo su ambiente RLS confermato; altrimenti gate locale
   sicuro (§3) e nota esplicita sulle suite escluse.
2. **QA manuale sul browser** (per lavori UI) tramite la **project skill `avvia-app`**: avvia l'app,
   entra con l'account demo, ripeti gli stessi passi funzionali sui viewport standard **375 / 834 / 1280**
   e, dove c'è il tema chiaro/scuro (M6/M7), **su entrambi i temi**.
3. **Registro esiti** — tabella nel report (ID · viewport/tema · esito · nota).

> Non dichiarare «verificato» con una sola larghezza schermo, un solo tema, né con la sola lettura del
> codice. Per il **come** avviare/entrare nell'app → project skill `avvia-app`.

## 6. Confini

- Questo skill è sui **test e sulla validazione**. Il *come far girare l'app* (dev server, login demo,
  click nel browser) sta nella **project skill `avvia-app`** (`.claude/skills/avvia-app/`).
- Le RULE di isolamento/RLS di prodotto vivono in `aree/DB_SUPABASE_SKILL.md` e `context/AUTH_CONTEXT.md`:
  qui verifichiamo che i test le **coprano**, non le ridefiniamo.

## 7. Debiti correnti della toolchain (audit 2026-07-02)

- I test client passano ma `jsdom` stampa errori `HTMLCanvasElement.getContext` non implementato:
  il setup non silenzia/mocka il canvas, quindi il segnale della suite è rumoroso.
- `npm audit` non rileva vulnerabilità runtime, ma rileva 5 vulnerabilità nelle dipendenze di sviluppo
  Vite/Vitest (3 moderate, 1 high, 1 critical). La correzione proposta è major: va gestita in un
  task dedicato con test completi, senza `npm audit fix --force` automatico.
