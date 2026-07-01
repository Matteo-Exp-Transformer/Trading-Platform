---
name: agente-ai
description: >-
  Entry point per motore agente, kit Aware Trader, Gemini, vision, streaming, trascrizione e
  blindatura. Area deep con LOCK kit, catena e segreti.
---

# Agente AI — stato operativo e invarianti

> Aggiornato: 2026-07-02. Codice reale: `server/src/agent/`, `server/src/routes/agent.js`, `kit/`.
> UI/flusso: `context/CHAT_ANALISI_CONTEXT.md`. Sicurezza conversazionale:
> `context/SICUREZZA_CONTEXT.md`. DB/RLS: `aree/DB_SUPABASE_SKILL.md`.

## 1. Cosa esiste oggi

La catena è operativa e multimodale:

```
skillLoader → promptBuilder → providerClient → orchestrator
```

- `skillLoader.js`: concatena e mette in cache tutti i `.md` di `kit/` in ordine alfabetico.
- `promptBuilder.js`: costruisce messaggi neutri; allega le immagini al turno utente corrente.
- `providerClient.js`: unico adapter Google Gemini; payload, chiamata REST, parsing e SSE.
- `orchestrator.js`: legge la storia via client Supabase vincolato al JWT, coordina la catena,
  trascrizione e filtro canary.
- `transcript.js`: chiede e separa la scheda JSON; le immagini non vengono conservate.
- `models.js`: lista account `gemini-2.5-flash` / `gemini-2.5-pro`.
- `topicGuard.js`, `security.js`, `canary.js`: classificatore d'ingresso, rifiuti e sentinella.
- `routes/agent.js`: auth/ownership, limite follow-up, modello account, guard e route
  `/analyze` + `/analyze/stream`.

La persistenza dei messaggi avviene oggi dal **client** via `chatData.addMessage`; la route server
legge la storia ma non salva direttamente user/assistant.

## 2. Flusso reale

1. Il client crea chat e messaggio utente tramite Supabase/RLS.
2. Invia `chatId` e, al primo turno, immagini inline alla route Express.
3. La route verifica che la chat sia visibile col JWT utente, legge il modello dal profilo e
   applica limite/classificatore.
4. L'orchestrator carica kit e storia, aggiunge al turno immagini il controllo screenshot e la
   richiesta della scheda JSON.
5. `providerClient` chiama Gemini. In streaming: Gemini SSE → server NDJSON → client.
6. Il server nasconde marcatore/JSON; il client salva a fine risposta prosa e trascrizione.
7. I follow-up sono testuali; il massimo voluto è 5 dopo la prima analisi.

## 3. LOCK

```
LOCK  kit/ — metodo e guardrail solo server; mai esporli al client.
LOCK  catena — preservare ordine e responsabilità dei quattro stadi.
LOCK  provider — formato/chiamata Gemini soltanto in providerClient.
LOCK  segreti — GOOGLE_API_KEY e service_role mai nel client, nei log o nei file tracciati.
LOCK  RLS — route e storia usano il client vincolato al token; niente service_role nel percorso.
RULE  Vision — nel turno immagini il modello deve ricevere davvero i grafici.
RULE  Kit stabile — istruzioni variabili (trascrizione/check immagini) restano nel turno utente.
RULE  Mai crash a vista — errori tradotti in messaggi utente; niente eccezioni grezze.
```

Le estensioni approvate in orchestrator/route (trascrizione, modello account, sicurezza) non
autorizzano a spostare logica provider fuori da `providerClient`.

## 4. Valori effettivi

- Provider: `google`; base REST `v1beta/models`.
- Default codice: `gemini-2.5-flash`; override globale `AI_MODEL`; override account filtrato da
  `CURATED_MODELS`.
- `maxOutputTokens=8192`, `thinkingBudget=4096`, temperatura default `0.3`.
- Massimo immagini: `MAX_SCREENSHOT_PER_ANALISI` o `3`.
- Massimo follow-up: `MAX_FOLLOW_UP_PER_SESSIONE` o `5`.
- Trasporto streaming: SSE Gemini in ingresso, NDJSON verso il browser.
- Trascrizione: marcatore `===SCHEDA_JSON===`; assenza/JSON invalido non blocca la prosa.

I valori si verificano nel codice e in `.env.example`; `.env.local` non va aperto.

## 5. Blindatura: coperto e non coperto

Implementato:

- recinto di dominio/riservatezza nel kit;
- classificatore Gemini Flash sull'ultimo messaggio utente testuale;
- rifiuto sul canale normale, salvato dal client;
- canary su risposta intera e delta streaming;
- limite UI+route di 5 follow-up.

Non ancora blindato (M8):

- niente analisi del testo contenuto negli screenshot;
- niente filtro d'uscita semantico completo;
- il canary streaming può rilevare una sentinella **dopo** che testo precedente è già uscito;
- storia e messaggi assistant sono scrivibili dal client proprietario: non sono una fonte trusted;
- limite follow-up basato sui messaggi client e su `images.length === 0`: payload/replay concorrenti
  possono aggirarlo;
- nessun timeout/AbortController, rate limit o cancellazione provider;
- parser JSON globale da 25 MB viene eseguito prima dell'autenticazione;
- la route streaming deve catturare anche i reject di `authorizeAnalyze`.
- il provider non valida `finishReason`/`promptFeedback` e ignora righe SSE non parseabili: un
  blocco safety/MAX_TOKENS o stream incompleto può essere trattato come risposta conclusa;
- il kit contiene ancora tre drift da correggere con una decisione dedicata: riferimento interno
  «tabella 06», promessa di ricerca web non abilitata dal payload e timeframe non coerenti col form.

Non descrivere questi punti come “sicurezza completa” finché test/fix dedicati non li chiudono.

## 6. Modelli: scadenza operativa

Google ha annunciato lo shutdown di `gemini-2.5-flash` e `gemini-2.5-pro` il **2026-10-16**.
Non cambiare modello solo perché più nuovo: il successore va aggiunto alla lista curata e validato
con TEST VISTA, stile, trascrizione, streaming e classificatore prima del deploy cliente.

## 7. Test pertinenti

- Provider/payload/SSE: `server/test/providerClient.test.js`
- Catena: `promptBuilder.test.js`, `orchestrator.test.js`, `transcript.test.js`, `models.test.js`
- Sicurezza: `topicGuard.test.js`, `canary.test.js`, `guardrail.test.js`
- Route/auth/limite/stream: `agent-route.test.js`

Mancano test di integrazione per timeout/cancellazione, concorrenza/replay, limite con payload
immagini malformato, storia forgiata dal client, `finishReason`/safety e reject asincrono pre-stream.

## 8. Routing

| Task | Carica anche |
|------|--------------|
| Form, bolle, composer, race UI | `context/CHAT_ANALISI_CONTEXT.md` |
| Dominio/rifiuti/jailbreak/canary | `context/SICUREZZA_CONTEXT.md` |
| Modello account/tema | `context/IMPOSTAZIONI_CONTEXT.md` |
| Schema, ownership, ruolo messaggi | `aree/DB_SUPABASE_SKILL.md` |
| Verifica | `aree/TESTING_SKILL.md` |
