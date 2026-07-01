---
name: agente-ai
description: >-
  Skill per qualsiasi lavoro sul motore agente di FREEDOM TRADING SYSTEM: la catena
  skillLoader→promptBuilder→providerClient→orchestrator e il kit Aware Trader caricato come system
  prompt. Caricala quando il task riguarda «catena agente», «orchestrator», «providerClient»,
  «Gemini», «kit», «system prompt», «vision/lettura grafici», «collegare il cervello». ⚠️ LOCK kit + catena.
---

# AGENTE AI — Skill di area (entry point)

> **Strato centrale del pattern a 3 strati.** Questo file cattura il **SENSO** del motore agente
> (cos'è, chi fa cosa, come scorre, cosa NON toccare) e rimanda al codice per i numeri. La **UI/flusso**
> della chat sta in `context/CHAT_ANALISI_CONTEXT.md`; qui stanno gli **interni dell'AI**.
>
> Stack dell'area: Node + Express (ESM) · Google **Gemini** (modello con vista) via `providerClient`
> (switcher, modello da `.env`) · Supabase (storia chat) · kit Markdown (metodo, lato server).
>
> **Provenienza (importante):** la catena **esiste già** ed è stata **portata e adattata**, non
> costruita da zero. Fonte: l'estratto `C:\Users\previ\OneDrive\Desktop\EXPORT_CATENA_AGENTE`
> (copie byte-per-byte degli originali, era OpenRouter+SQLite). ⚠️ Non cancellare quella cartella
> finché la catena non è interamente nel repo e verificata.

---

## 0. Quando caricare questo skill (vs altri)

| Il task riguarda… | Skill da usare |
|-------------------|----------------|
| Catena agente, kit, system prompt, provider Gemini, vision, salvataggio risposta AI | **questo** |
| Form di avvio, bolle, composer, storico chat, cosa vede l'utente | `context/CHAT_ANALISI_CONTEXT.md` (+ `context/SIDEBAR_STORICO_CONTEXT.md`) |
| Schema DB / migrazioni / RLS (colonna `form_context`, salvataggio messaggi) | `aree/DB_SUPABASE_SKILL.md` ⚠️ deep |
| Streaming della risposta | **questo**, ma è **M5** — in M3 la risposta arriva tutta insieme |

## 1. A che serve l'agente AI (il senso)

È il **cervello** del prodotto: trasforma il primo prompt costruito dal form (asset, stile, posizione,
timeframe) + gli **screenshot** dei grafici in un'analisi in **prosa** secondo il metodo Aware Trader.
Senza questo motore la chat è un guscio vuoto (è lo stato fino a M2). Il valore che il cliente vede
all'intervista è esattamente qui: l'AI **legge davvero i grafici** (vision) e risponde con la voce e la
gerarchia del kit. Priorità assolute: **qualità della lettura** (rischio #1) e **mai un crash a vista**.

## 2. Chi fa cosa (attori)

- **Utente** — avvia l'analisi dal form, allega screenshot, poi fa follow-up testuali (e, se vuole, un
  grafico aggiornato). Non digita mai i dati del grafico: li **legge l'AI**.
- **Catena agente** (`server/src/agent/`) — 4 stadi a responsabilità separata:
  - `skillLoader.js` — carica e mette in cache i file del **kit** come unico system prompt.
  - `promptBuilder.js` — costruisce l'array messaggi: system + storia testuale + **immagini del turno
    corrente** in formato multimodale.
  - `providerClient.js` — chiama **Gemini** e interpreta la risposta. È lo **switcher** di provider.
  - `orchestrator.js` — coordina: carica system prompt, legge la storia da **Supabase**, costruisce i
    messaggi, chiama il provider, restituisce il testo.
- **Kit Aware Trader** (`kit/`) — l'autorità del metodo (LOCK). Lato server, mai esposto al client.
- **Provider Gemini** — modello con vista; default **Gemini 2.5 Flash**, letto da `.env` (mai nel client).

## 2-bis. Il flusso completo (percorso utente + flusso dati affiancati)

| Passo utente | Cosa succede nei dati/codice |
|--------------|------------------------------|
| Compila il form e invia | Il client costruisce il primo prompt (riepilogo testuale) + il **contesto strutturato** (asset/stile/posizione/TF) e gli screenshot |
| — | La route server riceve testo + immagini + `chatId`; salva il messaggio utente su `messages` |
| (attesa: «sta analizzando…») | `orchestrator` → `skillLoader` (kit→system) + legge storia da Supabase + `promptBuilder` (storia testuale + immagini turno corrente, **formato multimodale Gemini**) |
| — | `providerClient` chiama Gemini (modello da `.env`), interpreta la risposta |
| Legge la risposta in prosa | La route salva la risposta come `messages` con `role:'assistant'`; il client la mostra |
| Follow-up (**solo testo** — niente nuovi screenshot) | Si rimanda **tutta la storia testuale** (incluse le analisi precedenti dell'AI) ma **nessuna immagine**: le uniche immagini esistono nel primo turno (il form) |

## 3. Limiti e regole VOLUTE — NON «aggiustarle»

> ⚠️ Scelte, non bug. Un agente che le «sistema» rompe il prodotto o lo scope.

- **Niente streaming in M3** — la risposta arriva tutta insieme, dopo un'attesa con indicatore «sta
  analizzando…». Lo streaming è **M5**. Non implementarlo ora.
- **Kit lato server, mai al client** — il system prompt non esce mai dal server; mai citare il
  nome-metodo proibito (vedi `CONTESTO_PRODOTTO.md`). LOCK.
- **Immagini solo nel primo turno (il form)** — gli screenshot si caricano solo all'avvio; nei follow-up
  la chat è **solo testo** (niente nuovi screenshot — vedi `CHAT_ANALISI_CONTEXT §5`). Il modello è
  **stateless**: «ricorda» la lettura perché gli rimandiamo la **sua stessa risposta testuale** (che descrive
  struttura/livelli/trigger). Minimizza i token. Non degradare a text-only sul turno con immagini (RULE
  vision: il modello DEVE vedere i grafici).
- **Caching del contesto = automatico/implicito** — il kit va costruito come **blocco fisso e identico in
  testa** alla chiamata, così lo sconto cache di Gemini 2.5 si attiva da solo. NON costruire caching esplicito
  gestito in M3 (è una leva futura). La parte fissa (kit) precede sempre la parte variabile (storia + domanda).
- **Modello da `.env`, mai hardcoded** — `providerClient` resta uno switcher; il default è Gemini 2.5
  Pro ma si cambia da configurazione, non nel codice.
- **Stile risposta del kit** — prosa breve a due voci, niente liste/tabelle/titoli/«compra-vendi» come
  ordine. È vincolo di prodotto (kit 08/09): la catena non lo altera, lo serve.

## 4. Questioni aperte (decise, da implementare in M3)

**Decisioni d'intervista (2026-06-30):**

| Questione | Decisione presa | Stato |
|-----------|-----------------|-------|
| Modello Gemini di default | **Gemini 2.5 Flash**. Il test completo sui grafici ha rispettato i requisiti dell'analisi già validata con Pro; Flash è scelto per il costo inferiore, Pro resta assegnabile per-account. Switcher, valore da `.env` (`AI_MODEL`). | **fatto** (2026-07-01) — default aggiornato dopo verifica live |
| Attesa risposta (no streaming M3) | Indicatore **«L'agente sta analizzando…»** + input disabilitato. Streaming → M5. | **fatto** (2026-06-30, M3) — `Chat.jsx`/`ChatPanel.jsx` |
| Persistenza contesto-form (FU-010) | **Colonna `jsonb` su `chats`** (es. `form_context`). Niente tabella dedicata: 1:1 con la chat, RLS già coperta, additivo/scale-ready. Si promuovono singoli campi a colonna solo se diventano «caldi». | **fatto** (2026-06-30, M3) — migrazione `m3_chats_form_context`, salvata da `createChat` |
| Screenshot nei follow-up | **No**: gli screenshot si caricano solo nel form iniziale; i follow-up sono solo testo. Il composer non gestisce upload. | **fatto** (2026-06-30, M3) — composer solo testo; immagini solo nel form |
| Storia al modello | Tutta la **storia testuale** + immagini **solo del primo turno** (form). Da riconfermare col test vista. | **fatto** (2026-06-30, M3) — da confermare col test vista (FU-011) |
| Caching del contesto | **Automatico/implicito** (Gemini 2.5): kit come blocco fisso in testa alla chiamata. Niente caching esplicito gestito in M3 (leva futura). | **fatto** (2026-06-30, M3) — kit blocco fisso; esplicito = FU-013 |
| Thinking budget (M3) | I modelli Gemini 2.5 ragionano e i token di thinking condividono `maxOutputTokens`: budget basso → risposta vuota (`MAX_TOKENS`). **Tetto `thinkingBudget=4096` + `maxOutputTokens=8192`**. | **fatto** (2026-06-30, M3) — `providerClient.buildGeminiPayload` |

**Punti di adattamento dell'estratto — ✅ TUTTI FATTI (2026-06-30, M3).** L'ossatura è stata riusata, NON
«pari-pari». Dettaglio per memoria:

1. **Provider → Gemini.** L'estratto è OpenRouter (`providerClient.js`→openrouter.ai, modello hardcoded
   `anthropic/claude-3.5-sonnet` in `orchestrator.js`). Riscrivere per Gemini, modello da `.env`.
2. **DB → Supabase.** L'estratto è SQLite (`db/database.js`, tabelle `sessions/messages/session_memory`).
   Noi leggiamo/scriviamo le **nostre** `chats`/`messages` (M2). **NON** portare `database.js` né le
   migrazioni SQLite.
3. **Vision da correggere.** `promptBuilder.js` spinge i blocchi `image_url` come messaggi nudi senza
   `role`/nesting in `content`. Riscrivere nel **formato multimodale corretto per Gemini**.
4. **Path kit.** `skillLoader.js` risolve `server/kit`; nel nostro repo il kit sta in `kit/` (root).
   Allineare il path.
5. **Streaming → M5.** Non implementato nell'estratto: in M3 va bene così (non-streaming).
6. **Salvataggio/memoria.** L'orchestrator non salva la risposta né aggiorna memoria (stava nella route
   SQLite). Ricollocare il salvataggio (`role:'assistant'`) sul nostro flusso Supabase (vedi FU-010).
   Nota: `chatData.addMessage` oggi hardcoda `role:'user'` → va generalizzato per l'assistant.

**Kit splittato — ✅ FATTO (2026-06-30, M3).** Ora `kit/{01_METODO_OPERATIVO, 02_PROMPT_MASTER_AGENT,
04_TEMPLATE_OUTPUT, 06_PROFILI_ASSET, 07_CAUTELE_TECNICHE, 08_STILE_RISPOSTA, 09_PROFILO_AWARE_TRADER}.md`.
⚠️ **Decisione importante:** i 7 file dell'estratto erano **placeholder in inglese** che contraddicevano
lo stile-LOCK (dicevano «usa elenchi, titoli, grassetto»). Il metodo **reale** stava nel monolite
`kit/Trade_Analysis_Agent_Kit_v3_1_.md`: i 7 file sono stati popolati col **contenuto reale del monolite**
(non coi placeholder) e il monolite è stato cancellato. `skillLoader` concatena i .md ordinati = blocco
fisso in testa (caching). Il loader carica TUTTI i 7 file come unico system prompt (02 incluso): è il
comportamento voluto per il nostro flusso automatico.

## 4-bis. M4 — Trascrizione JSON dell'analisi (niente Storage immagini)

**Decisione d'intervista (2026-07-01).** Invece di **conservare gli screenshot** (Storage + policy RLS +
retention), a ogni analisi si salva una **scheda JSON strutturata** di ciò che i grafici mostravano. Le
immagini restano **solo in volo** (servono a Gemini per la lettura), poi si **scartano**: dopo la
trascrizione non servono più. Conseguenza: **niente Supabase Storage**, **FU-005 superata**.

| Questione | Decisione presa | Nota LOCK |
|-----------|-----------------|-----------|
| Chi genera la scheda | **Gemini stesso, nella stessa chiamata d'analisi** (un solo passaggio: nessun costo/attesa extra). | Tocca la catena oltre `providerClient` (orchestrator) → adattamento ESPLICITO e circoscritto, approvato in intervista. |
| Contenuto scheda (ricca) | `asset` · `timeframe` (per grafico) · `livelli` (supporti/resistenze) · `struttura`/`trend` · `indicatori` (RSI…) · `bias` direzionale · `posizione` (o null). | — |
| Come si chiede senza rompere il kit | Istruzione aggiunta **in coda al turno utente corrente** (parte variabile), **mai** nei file `kit/`: il blocco-kit in testa resta identico → **caching Gemini intatto**. | Kit LOCK non toccato. |
| Solo con immagini | La scheda si chiede **solo** nel turno con screenshot (vera analisi), mai nei follow-up testuali. | Coerente §3 "immagini solo nel primo turno". |
| Prosa pulita | Gemini scrive l'analisi + in fondo il marcatore `===SCHEDA_JSON===` + JSON. Il **server separa**: l'utente vede solo la prosa; la scheda va in `messages.attachments` (jsonb, già predisposto). | Stile risposta kit intatto (utente non vede il JSON). |
| Mai bloccare | Scheda mancante o JSON illeggibile → si salva l'analisi lo stesso, `transcript = null`. | RULE "mai crash a vista". |
| Screenshot non valido (FU-015, 2026-07-01) | Se uno screenshot NON è un grafico leggibile (es. una foto), l'agente lo **segnala esplicitamente** a inizio risposta indicando quale + avvisa che l'analisi può essere **incompleta**; procede con ciò che è leggibile. Direttiva `buildImageCheckInstruction()`, nel turno immagini (kit intatto). Anche nel JSON: campo `avvisi`. | Consapevolezza utente; coerente §3 vision. |

**Innesto nel codice (M4):** modulo nuovo `server/src/agent/transcript.js` (marcatore +
`buildTranscriptInstruction()` + `splitTranscript()`, puri e testati); `orchestrator` inietta l'istruzione
quando `images.length > 0`, separa prosa/scheda, ritorna `{ text, transcript }`; la route ritorna anche
`transcript`; lato client `chatData.addMessage` accetta `attachments` e `Chat.jsx` salva la scheda sul
messaggio `assistant` come **elemento tipizzato in un array**: `[{ type:'transcript', data:{…} }]` (la colonna
jsonb ha default `[]`, quindi `attachments` resta sempre un array).

## 4-ter. M5 — Streaming (deciso 2026-07-01)

La risposta scorre **a pezzi** invece di arrivare tutta insieme. **Si adatta solo `providerClient`** (LOCK
rispettato): nuova `streamGeminiText()` che chiama `:streamGenerateContent` (SSE) e produce i delta di testo.

| Aspetto | Decisione |
|---------|-----------|
| Trasporto | Gemini SSE → server → client via **NDJSON** su risposta a flusso (serve header auth → non EventSource). |
| Scheda mai a vista | Il server usa `transcript.createProseStreamer()`: emette solo la prosa, **bufferizza la coda** e nasconde `===SCHEDA_JSON===` + JSON. La scheda si consegna al client in un evento finale `done`. |
| Persistenza (invariata M4) | La prosa scorre a schermo ma si **salva a fine risposta** (client), con la scheda estratta. Nessun salvataggio a metà. |
| Interruzione | Testo parziale resta visibile + avviso «risposta interrotta, riprova». Il parziale **non** si salva. |
| Pulsante «ferma» | **No** (anti-scope; possibile follow-up). |

**Innesto:** `providerClient.streamGeminiText` (SSE, generator) · `transcript.createProseStreamer` (nasconde
scheda) · `orchestrator.runAnalysisStream` (async generator: eventi `delta`/`done`) · route
`POST /api/agent/analyze/stream` (NDJSON; auth/ownership condivisa con `/analyze` via helper) · client
`agentApi` consuma lo stream, `Chat.jsx` mostra progressivo e salva a fine. Il vecchio `/analyze` resta come fallback.

## 5. LOCK di area (invarianti locali)

```
LOCK  kit/ (metodo Aware Trader) — autorità del metodo. Solo server, mai esposto al client,
      mai citare il nome-metodo proibito. Vedi Bussola §2.
LOCK  catena agente — skillLoader→promptBuilder→providerClient→orchestrator: si riusa l'ossatura
      e la separazione di responsabilità; gli adattamenti §4 sono ESPLICITI e circoscritti.
LOCK  segreti — chiave Gemini solo lato server, mai nel client/bundle. Vedi Bussola §2.
RULE  Vision obbligatoria: il modello DEVE vedere le immagini (multimodale). Mai degradare a text-only.
RULE  Mai crash a vista: ogni errore (immagine grande, timeout, rete, chiave mancante) → messaggio
      chiaro lato chat + possibilità di riprova. Niente eccezioni non gestite verso l'utente.
RULE  Modello da .env, mai hardcoded. providerClient resta switcher.
```

> I LOCK battono il profilo: valgono anche in un fix «piccolo». Testo pieno dei LOCK trasversali in
> Bussola §2 — non duplicarlo qui.

## 6. Mappa: tocchi X → apri il file Y

| Se il task tocca… | Apri (intero) |
|-------------------|---------------|
| UI/flusso chat, form, attesa, bolle | `context/CHAT_ANALISI_CONTEXT.md` |
| Storico/sidebar/nuova chat | `context/SIDEBAR_STORICO_CONTEXT.md` |
| Schema DB, colonna `form_context`, RLS, salvataggio messaggi | `aree/DB_SUPABASE_SKILL.md` |
| Sorgente reale della catena da portare | `C:\Users\previ\OneDrive\Desktop\EXPORT_CATENA_AGENTE` (estratto) |

## 7. Principio di lettura (vale per tutta l'area)

Leggi **INTERO** il file di codice della catena e il pezzo dell'estratto **prima** di editare: è LOCK,
nessun micro-fix «al volo». Il codice è la verità per i numeri (timeout, max_tokens, temperature); i
`.md` li specchiano. Se questo file supera ~250 righe, spaccalo per sotto-funzione
(provider / vision / persistenza) — vedi `REGOLE_ORGANIZZATIVE.md` §5.
