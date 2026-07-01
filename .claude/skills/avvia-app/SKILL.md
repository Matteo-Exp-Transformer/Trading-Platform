---
name: avvia-app
description: >-
  Come far girare il FREEDOM TRADING SYSTEM in locale e provare una modifica nell'app reale (non solo
  nei test). Usala quando devi avviare/lanciare l'app, aprirla nel browser, fare login, o verificare a
  video che un cambiamento (UI, tema, chat, analisi) funzioni davvero. Per scrivere/eseguire i test
  automatici vedi invece la skill "testing" (aree/TESTING_SKILL.md).
---

# Avvia app — guida operativa (FREEDOM TRADING SYSTEM)

Monorepo **npm workspaces**: `client/` (React+Vite, porta **5173**) + `server/` (Node+Express, porta
**3001**). In dev il client fa da **proxy** di `/api` verso il server. Segreti in `.env.local` (root,
gitignored). Windows: shell primaria **PowerShell**.

## 1. Prerequisiti (una volta)

```bash
npm install            # installa client + server (workspaces)
```

`.env.local` nella **root** deve essere popolato (è gitignored, non committarlo). Serve:
- `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` + `VITE_SUPABASE_URL` · `VITE_SUPABASE_ANON_KEY` → login e dati
- `GOOGLE_API_KEY` + `AI_MODEL` (default `gemini-2.5-flash`) → analisi AI reale
- `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` → **account demo** per il login (vedi §3)

Modello di riferimento: `.env.example`.

## 2. Avviare

```bash
npm run dev            # avvia client (5173) + server (3001) insieme (concurrently)
# oppure, separati:
npm run dev:client     # solo UI  → http://localhost:5173
npm run dev:server     # solo API → http://localhost:3001
```

Poi apri **http://localhost:5173**. Sanity del server: `GET http://localhost:3001/api/health`.

> **Cosa serve avviare, secondo cosa provi:**
> - **UI / tema / login / storico** → basta il **client** (parla con Supabase direttamente). Il server non è indispensabile.
> - **Analisi completa** (form → screenshot → risposta AI in streaming) → serve **anche il server** con `GOOGLE_API_KEY` valida (il client chiama `/api/agent/...` in proxy).

## 3. Login (account demo)

Niente registrazione aperta: gli account si creano **a mano** dal pannello Supabase (con *Auto
Confirm*). Per provare l'app usa l'**account demo** le cui credenziali sono in `.env.local`
(`TEST_USER_EMAIL` / `TEST_USER_PASSWORD`). Entra dalla pagina **Login**.

> Non incollare la password in chat, in un file tracciato o in un commit: sta solo in `.env.local`.

## 4. Provare una modifica a video (QA manuale)

1. Avvia (`npm run dev`) ed entra con l'account demo.
2. Vai sulla schermata che hai toccato: **Login · Chat** (form nuova analisi, upload screenshot, bolle,
   streaming) **· Sidebar/storico · Impostazioni** (tema, cambio password).
3. Se il lavoro tocca l'aspetto, provalo su **entrambi i temi** (chiaro/scuro, toggle in Impostazioni)
   e ai viewport **375 / 834 / 1280**.
4. Verifica sempre che il **disclaimer** resti visibile e leggibile.
5. Per un'analisi reale servono screenshot di **grafici** veri (il modello li legge): una foto non-grafico
   viene segnalata come non valida (comportamento voluto).

## 5. Prima di dire «fatto»: il gate

```bash
npm run validate       # lint + tutti i test (client + server). DEVE essere verde.
node --check <file.js> # sanity sintattica dopo una modifica JS
```

Se `validate` è rosso non è «fatto». I test server RLS colpiscono **Supabase live**: se `.env.local`
manca delle chiavi Supabase falliscono per ambiente, non per il tuo codice. Dettaglio e struttura dei
test: **`docs/skill-system-trading-platform/aree/TESTING_SKILL.md`**.

## 6. Fermare / ripartire

- Ferma i dev server con **Ctrl-C** nel terminale.
- Porta occupata (5173/3001 già in uso): chiudi il processo che la tiene o riavvia il terminale.

## 7. Regole da non violare (LOCK di progetto)

- **Segreti solo lato server**: `GOOGLE_API_KEY` e `SUPABASE_SERVICE_ROLE_KEY` non finiscono mai nel
  bundle client. Nel client solo le `VITE_*` (anon pubblica per design; la sicurezza è la RLS).
- **Isolamento per utente (RLS)**: ogni utente vede solo i propri dati. Se provando ne vedi di altri, è un bug grave.
- **`.env.local` mai committato.** `Esempio/` è solo materiale di riferimento: non fa parte dell'app in esecuzione.
</content>
