# Chat di analisi — file di contesto

> Mappa di dettaglio della zona **cuore** del prodotto: l'avvio analisi (form guidato), la chat e i
> follow-up. Il **motore agente/kit** ha la sua casa in `aree/AGENTE_AI_SKILL.md` ✅:
> qui sta la **UI/flusso**, là gli **interni dell'AI**. Fonte del metodo: `kit/01..09` (splittato a M3 dal
> monolite reale; il monolite `Trade_Analysis_Agent_Kit_v3_1_.md` è stato rimosso).
>
> **Trigger di routing:** «chat», «analisi», «avvio analisi», «form», «nuova analisi», «follow-up»,
> «screenshot», «streaming» → questo file.
> Aggiornato: 2026-06-30 (giri 3 + form). Codice da costruire (M2–M5): i path sono **previsti**.

---

## 1. Cos'è questa zona

La schermata principale. L'utente avvia un'analisi tramite un **form guidato** (previene il primo prompt
mal formulato), poi l'agente **Aware Trader** legge gli screenshot e risponde in prosa, **in streaming**;
da lì in poi è **conversazione libera** (follow-up). È il valore che il cliente vede all'intervista →
priorità a **qualità** e **blindatura** (mai un crash a vista).

## 2. File coinvolti (previsti)

| File | Ruolo |
|------|-------|
| `client/src/pages/Chat.jsx` | Pagina chat: lista messaggi + composer |
| `client/src/components/chat/NewAnalysisForm.jsx` | Form guidato di avvio analisi |
| `client/src/components/chat/ChatPanel.jsx` · `MessageBubble.jsx` · `UploadArea.jsx` | Lista messaggi, bolle, upload (riusano estratto) |
| `server/src/routes/agent.js` | Endpoint analisi + upload |
| `server/src/agent/*` + `kit/` | Catena agente + metodo (vedi `aree/AGENTE_AI_SKILL.md`) |

## 3. Invarianti / LOCK locali

```
LOCK  kit v3 = autorità del metodo. Lato server, mai esposto al client. Vedi Bussola §2.
RULE  Stile risposta (kit 08, PRIORITÀ ASSOLUTA): prosa breve, due voci. NIENTE liste/tabelle/##titoli/
      maiuscole-categoriche ("SETUP: VALIDO")/"in sintesi". In italiano, col "tu", senza paternalismo.
RULE  Regola tecnica ferma (kit): manca il decisionale (5m/15m) → niente giudizio operativo, lo chiede.
RULE  Gerarchia Aware Trader (kit 09): struttura macro → Dove (livelli) → Quando (trigger) → indicatori per ultimi.
RULE  Mai far digitare all'utente i dati del grafico (prezzo/RSI/livelli/struttura): li LEGGE l'AI dalle immagini.
RULE  Disclaimer una sola volta a inizio chat ("non sono un consulente finanziario") + disclaimer fisso in UI.
RULE  Mai crash a vista: ogni errore (immagine grande, timeout, rete) → messaggio chiaro + riprova.
```

## 4. Avvio analisi — il form guidato

Quando l'utente clicca **+ Nuova analisi** si apre un form (linguaggio semplice). Scopo: dare all'AI un
primo prompt **completo** e caricare **solo** gli screenshot necessari (token minimi, qualità piena).

### Campi

| Campo (label utente) | Opzioni | Serve a |
|----------------------|---------|---------|
| «Quale asset?» | Lista curata (kit 06): Oro XAU/USD · EUR/USD · GBP/USD · USD/JPY · Nasdaq US100 · S&P500 US500 · DAX DE40 · Bitcoin · Ethereum · Azioni USA — + «Altro (scrivi il simbolo)» | profilo asset |
| «Come operi?» | **Scalping** (decisionale 5m, contesto 1H) · **Intraday** (decisionale 15m, contesto 4H) | scegliere i timeframe |
| «Cosa vuoi da questa analisi?» | **Studiare** · **Analisi completa** · **Lettura operativa** | flusso + orientamento risposta |
| «Hai una posizione aperta?» | **Obbligatoria** se *Lettura operativa*; opzionale altrimenti. Se Sì → Long/Short, prezzo apertura, SL (opz.), TP (opz.) | dati non leggibili dal grafico |
| «La tua idea (facoltativo)» | testo libero breve | diventa la frase di apertura |
| Screenshot | slot **fissi ed etichettati** per timeframe (tabella sotto) | zero ambiguità |

### Quanti screenshot e quali timeframe (fedele al kit)

Sempre top-down; il **decisionale (5m/15m) è obbligatorio** (regola ferma del kit). Max 3 → token sotto controllo.

| Obiettivo | Scalping | Intraday |
|-----------|----------|----------|
| **Studiare** | 1H + 5m (2) | 4H + 15m (2) |
| **Analisi completa** | 1H + 5m (+GoldenTrend opz.) | 4H + 15m (+GoldenTrend opz.) |
| **Lettura operativa** (posizione aperta) | 5m attuale (+1H contesto opz.) | 15m attuale (+4H contesto opz.) |

> **Check anti-errore:** slot fissi (non si caricano più screenshot del previsto); non si avvia se manca
> uno slot obbligatorio. Il numero esatto deriva da *come operi × obiettivo*. (Limite di immagini = finestra
> di contesto, non costi: nessun freno costi in demo — CONTESTO L12.)
> **Scope:** il kit è **intraday/scalping**. *Swing/Position non esistono nel kit* → estensione futura, non in demo.

### Come il form costruisce il primo prompt (esempio)

```
Asset: XAU/USD (Oro) · Come operi: Intraday · Obiettivo: Lettura operativa
Posizione: Short aperta a 4530 · SL 4560 · TP non impostato
Screenshot allegati: [15m attuale] (+[4H contesto])
Idea utente: "RSI risale, esco o tengo?"
→ Istruzioni: applica il metodo Aware Trader (Trade Aperto, non-direttivo). Prezzo/RSI/struttura li ricavi
  dai grafici. Tieni conto della posizione. Niente "compra/vendi" come ordine.
```

**Mappatura ai template del kit:** Studiare / Analisi completa → **Pre-Trade (kit 03)** · Lettura operativa → **Trade Aperto (kit 03b)**.

## 5. Flusso follow-up

> **Stato M3 (2026-06-30):** ✅ implementato. Prima analisi reale end-to-end (form→screenshot→Gemini
> vision→prosa kit, salvata e mostrata) + follow-up testuali con contesto. Catena in `aree/AGENTE_AI_SKILL.md`.
> Route `server/src/routes/agent.js`; client `agentApi.js` + `Chat.jsx`/`ChatPanel.jsx` (attesa «sta
> analizzando…»). Upload nel form: versione minimale (max 3, ≥1) — slot fissi per-TF = FU-012.

Dopo la prima analisi **niente più form**: chat libera a due voci (stile kit). L'utente può fare domande
testuali e dire «sono entrato/uscito a X». **Niente nuovi screenshot nei follow-up** (deciso 2026-06-30,
intervista M3): gli screenshot si caricano **solo nel form iniziale**; nei follow-up la chat è solo testo.
Il **contesto del form (asset, stile, posizione, TF) resta valido per tutta la chat** e l'agente lo ricorda.
L'agente può fare al massimo una o due domande tecniche, poi opinione in prosa breve, e «lascia la palla al trader».

### 5-bis. M4 — Persistenza: scheda JSON, non le immagini (deciso 2026-07-01)

Gli screenshot **non si conservano**: vivono solo in volo per l'analisi, poi si scartano. Al loro posto,
a ogni analisi si salva una **scheda JSON** (asset, timeframe per grafico, livelli, struttura, indicatori,
bias, posizione) che Gemini produce nella **stessa** chiamata; il server la separa dalla prosa e la salva in
`messages.attachments`. Riaprendo una vecchia analisi si rivede la **prosa** (le immagini non servono più).
Conseguenza: **niente Supabase Storage** (FU-005 superata). Dettaglio catena/LOCK: `aree/AGENTE_AI_SKILL.md §4-bis`.

## 6. Questioni tecniche aperte (default proposti, da confermare in M3/M5)

- **Storia conversazionale al modello (deciso M3):** ✅ implementato — tutta la storia **testuale** + immagini
  **solo del primo turno** (il form). Nei follow-up niente immagini (vedi §5) → token minimi. Il modello è
  stateless: «ricorda» la lettura perché gli si rimanda la sua stessa risposta testuale precedente. **Da
  riconfermare col test vista (FU-011).**
- **Caching del contesto (deciso M3):** ✅ implementato — caching **automatico/implicito** di Gemini 2.5: il
  kit è il **blocco fisso e identico in testa** (`skillLoader` → `systemInstruction`). Caching esplicito
  gestito = leva futura (FU-013), non in M3.
- **Titolo chat:** da «Idea utente» o asset + obiettivo (deciso nel giro 5, Sidebar/Storico).
- **GoldenTrend:** plugin di terzi (kit §12); screenshot opzionale, trattato come opinione visiva, non sovrascrive la struttura.

## 7. Come estendere senza rompere

- Comportamento dell'agente → si tocca il **kit** (giro 6 / `AGENTE_AI_SKILL.md`), non la UI.
- Journal, swing/position, output extra → **scope extra**: prima si rivede il perimetro (CONTESTO §3/§9).
- Modifiche alla catena agente = **deep** + LOCK: leggi prima `aree/AGENTE_AI_SKILL.md`.

## 8. Report di sessione collegati

- `_sessioni-lavoro/2026-06-30/Report-M2-chat-ui-base.md` — slice 2b: form guidato + pagina chat base + persistenza Supabase, 57 test verdi. File principali creati: `client/src/pages/Chat.jsx`, `client/src/components/chat/NewAnalysisForm.jsx`, `client/src/components/chat/MessageBubble.jsx`, `client/src/components/chat/ChatPanel.jsx`, `client/src/lib/chatData.js`, `client/src/lib/formUtils.js`.
