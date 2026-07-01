# Chat di analisi — contesto operativo

> Aggiornato: 2026-07-02. Codice reale: `client/src/pages/Chat.jsx`,
> `client/src/components/chat/*`, `client/src/lib/{chatData,agentApi,formUtils,followUp,imageCompression}.js`.
> Motore: `../aree/AGENTE_AI_SKILL.md`; DB/RLS: `../aree/DB_SUPABASE_SKILL.md`.

## 1. Esperienza reale

La Chat vive su `/nuova-analisi`. Il primo turno usa un form guidato con screenshot per timeframe;
Gemini risponde in streaming. Le immagini vengono scartate e il client salva prosa + scheda JSON.
La conversazione prosegue solo in testo per massimo 5 follow-up. Storico e nuova analisi sono nel
drawer condiviso; selezionando una chat se ne ricaricano i messaggi.

## 2. Form iniziale

| Campo | Stato |
|------|-------|
| Asset | lista curata + simbolo libero |
| Stile | Scalping / Intraday |
| Obiettivo | Studiare / Analisi completa / Lettura operativa |
| Posizione | sì/no; se sì: Long/Short, apertura, SL/TP opzionali |
| Idea | testo libero opzionale |
| Screenshot | slot fissi, etichettati e compressi client-side |

Timeframe:

| Obiettivo | Scalping | Intraday |
|-----------|----------|----------|
| Studiare | 1H + 5m obbligatori | 4H + 15m obbligatori |
| Analisi completa | 1H + 5m + GoldenTrend opzionale | 4H + 15m + GoldenTrend opzionale |
| Lettura operativa | 5m obbligatorio + 1H opzionale | 15m obbligatorio + 4H opzionale |

Il decisionale è sempre obbligatorio. Massimo 3 immagini. Il riepilogo testuale e
`chats.form_context` restano il contesto della chat.

## 3. Persistenza e streaming

1. `createChat()` crea la chat via client Supabase/RLS.
2. `addMessage(..., 'user')` salva il riepilogo.
3. `analyzeChatStream()` chiama `/api/agent/analyze/stream` con JWT e immagini.
4. I delta NDJSON alimentano `streamingText`.
5. A `done`, il client salva un messaggio `assistant`; la trascrizione va in
   `attachments: [{type:'transcript', data: ...}]`.
6. Se lo stream fallisce, il parziale resta a video ma non viene salvato.

Il fallback non-streaming `/analyze` e `analyzeChat()` esistono ma il flusso UI corrente usa lo stream.

## 4. Limite conversazione

La prima analisi non conta; dopo sono ammessi 5 messaggi utente. Il client blocca il composer e il
server tenta di imporre lo stesso limite. Un rifiuto fuori tema è una risposta normale e consuma
un follow-up.

Questo è il comportamento approvato più recente (CONTESTO_PRODOTTO L20). Non descriverlo come quota
commerciale o protezione costi completa.

## 5. LOCK

```
LOCK  kit e prompt solo server.
LOCK  immagini realmente inviate al modello nel primo turno.
LOCK  owner-only via RLS per chat e messaggi.
RULE  follow-up solo testo.
RULE  scheda JSON mai visibile all'utente.
RULE  screenshot non valido segnalato; analisi continua su ciò che è leggibile.
RULE  disclaimer visibile.
RULE  niente crash: loading/error/interruzione con messaggio e percorso di riprova.
RULE  stile agente in prosa breve, non direttiva, niente “compra/vendi” come ordine.
```

## 6. Gap correnti (audit 2026-07-02)

- **Race chat/stream:** fetch e stream non sono abortiti né legati a un chat-id di richiesta; passando
  da A a B una risposta o un caricamento di A può contaminare B.
- **Composer:** non è disabilitato durante caricamento/errore messaggi.
- **Retry vision:** se la prima generazione fallisce, gli screenshot non sono più disponibili; il
  composer non può ripetere correttamente il turno multimodale.
- **Race upload:** durante compressione stile/obiettivo/submit restano attivi; una vecchia immagine
  può ricomparire sotto un nuovo timeframe.
- **Posizione incompleta:** fuori da “Lettura operativa”, scegliere “sì” non obbliga direzione/prezzo
  e può produrre `Posizione: @`.
- **Limite server aggirabile:** `images.length` distingue analisi/follow-up, i messaggi sono
  client-authored e manca idempotenza/concorrenza per turno.
- **Integrità assistant:** il proprietario può scrivere direttamente righe `role='assistant'`.

## 7. Test mancanti prioritari

- creazione chat + primo stream + persistenza completa;
- cambio chat durante fetch/stream e richieste fuori ordine;
- retry della prima analisi con immagini;
- cambio stile/obiettivo durante compressione e submit while busy;
- posizione sì in ogni obiettivo;
- follow-up concorrenti/replay/payload immagini malformato;
- loading/error con composer bloccato;
- separazione transcript anche con output provider anomalo.

## 8. Estensioni

Screenshot nei follow-up, stop manuale, eliminazione chat, nuove quote e nuovi stili operativi sono
nuovi comportamenti: prima aggiornare decisione prodotto e questo context. Per sicurezza/rifiuti
caricare anche `SICUREZZA_CONTEXT.md`.
