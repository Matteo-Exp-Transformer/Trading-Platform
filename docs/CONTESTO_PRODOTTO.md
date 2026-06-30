# CONTESTO PRODOTTO — FREEDOM TRADING SYSTEM (demo)

> **Fonte di verità unica** del prodotto e delle decisioni prese. La leggono tutti gli agenti
> (Senior, Esecutore, Verifica) e l'utente. Le skill e i `context/` rimandano qui per il «perché».
> La cronologia datata delle decisioni vive qui e nei report di sessione, **non** nelle skill vive.
>
> Aggiornato: 2026-06-30 · Fase: **0 — demo pre-intervista** · Stato: setup documentale (codice da costruire).

---

## 1. Cos'è il prodotto (e cosa NON è)

**FREEDOM TRADING SYSTEM** è una webapp dove l'utente carica **screenshot di grafici di trading** e
un **agente AI** li legge e li commenta applicando il metodo **Aware Trader** (uno skill system di file
`.md` caricati come system prompt, lato server).

**Cosa NON è — e va detto ovunque, disclaimer non rimovibile:** non dà segnali operativi, non dice
«compra/vendi», **non è consulenza finanziaria**. È supporto all'analisi tecnica.

---

## 2. Decisioni LOCKED (datate)

| # | Decisione | Valore | Data | Note |
|---|-----------|--------|------|------|
| L1 | Motore AI | **Google Gemini**, modello con vista; default sul **più capace** (qualità prima); switcher mantenuto | 2026-06-30 | *Aggiorna* la vecchia ipotesi OpenRouter/Claude. Test vista su grafici reali = rischio #1 |
| L2 | Dati & account | **Supabase** (Postgres + Auth + Storage) | 2026-06-30 | Account isolati per utente (RLS), online, scale-ready. Sostituisce SQLite locale |
| L3 | Nome app / repo | **FREEDOM TRADING SYSTEM** (repo `freedom-trading-system`) | 2026-06-30 | Continuità con la beta |
| L4 | Perimetro demo | **Minimal + estetica beta** | 2026-06-30 | Chat + Sidebar/Storico + Impostazioni; più lo stile ricco (da ricostruire) |
| L5 | API via servizio gestito | Sì; **niente self-host del modello** ora | (eredità docs) | Costo variabile pericoloso per un team di due |
| L6 | Chiave AI | Una sola, **lato server**, mai esposta al client | (eredità docs) | Per la demo basta una chiave di sviluppo |
| L7 | Vision obbligatoria | Il modello DEVE essere multimodale | (eredità docs) | L'app legge grafici |
| L8 | Lingua | Tutto in **italiano** | (eredità docs) | UI, agente, documentazione |
| L9 | Kit Aware Trader | Riusato **pari-pari** (ripulito dal nome-metodo proibito) | (eredità docs) | Valore distintivo; lato server |
| L10 | Identità agente | L'AI si presenta come **Aware Trader**; kit riusato pari-pari | 2026-06-30 | Nome-metodo proibito ancora da raccogliere (giro kit) |
| L11 | Account demo | **Su invito / creati a mano** (no registrazione aperta) | 2026-06-30 | Più controllato e sicuro per l'intervista |
| L12 | Freno costi | **Nessun limite** in demo | 2026-06-30 | La demo la prova l'utente in test; il cliente la prova solo all'intervista (controllata), non riceve un accesso proprio |
| L13 | Metodo (kit) | **Trade Analysis Agent Kit v3** è l'autorità; scope **intraday/scalping** (decisionale 5m/15m, contesto 1H/4H) | 2026-06-30 | Sostituisce i placeholder `kit/`. Swing/Position = estensione futura, fuori demo |
| L14 | Avvio analisi | **Form guidato** che genera il primo prompt + slot screenshot fissi per timeframe | 2026-06-30 | Dettaglio in `context/CHAT_ANALISI_CONTEXT.md` §4 |

---

## 3. Perimetro della demo

**Dentro (da costruire e blindare):**
- **Chat di analisi** (il cuore): scrivo + carico screenshot → l'agente risponde in stile Aware Trader, **in streaming**.
- **Sidebar**: profilo utente + **storico chat** (clic = riapro) + «nuova chat».
- **Impostazioni**: cambio password · tema chiaro/scuro · **scelta del modello** AI (lista curata).
- **Login**: porta d'ingresso; account leggeri reali (su Supabase).
- **Estetica beta** (rifinitura additiva): stile scuro verde-acqua, sfondo animato. ⚠️ Non è nei file
  estratti → va **ricostruita**; non deve compromettere la blindatura del cuore.

**Fuori (anti-scope, vedi §9).**

---

## 4. I due «skill system» — non confonderli MAI

| Nome | Cos'è | Dove | Chi lo usa |
|------|-------|------|-----------|
| **Skill System Trading Platform** | Il sistema *meta* per gli agenti AI: bussola, profili, context, plan, report, vocabolario. È lo **schema di lavoro**. | `docs/skill-system-trading-platform/` | Tutti gli agenti che lavorano sul progetto |
| **Kit Aware Trader** | Il *metodo di trading* caricato come **system prompt** dell'AI di prodotto. | `kit/` (lato server) | L'AI di prodotto, a runtime. **Mai esposto al client** |

---

## 5. Schema di lavoro (fonte di verità)

```
Agente Senior  →  intervista all'utente  →  contesto nello skill system (context/, aree/)
   →  docs/PIANO_LAVORO.md allineato  →  skill PREPARA_PROMPT_SKILL.md  →  agente Esecutore (codice + test)
   →  Verifica  →  chiusura (report in sessioni/)
```

- **Prima si definisce e mappa, poi si esegue.** Nessun codice di una zona prima che esista il suo
  `context/`. Questo previene conflitti strutturali e scope creep.
- **Ruoli separati** (anti auto-approvazione): chi esegue ≠ chi revisiona ≠ chi affina il sistema.
- L'intervista continua a **giri brevi di 2–3 domande con opzioni**, fino a coprire ogni schermata,
  flusso utente e flusso dati. Ogni risposta nuova → scritta qui o nel `context/` pertinente, datata.

---

## 6. Principi di qualità (richiesti dall'utente)

1. **Scalabilità — «scale-ready, non scale-features».** Scegliamo un'architettura che **non ci
   inchioda** verso migliaia di utenti (Supabase/Postgres gestito, isolamento RLS, server stateless,
   moduli disaccoppiati), **senza** costruire ora le funzioni di scala (pagamenti, crediti,
   multi-tenant avanzato). Così la Fase 2 non richiede un rifacimento.
2. **Solidità strutturale — test per ogni funzione.** Una funzione = almeno un test. Niente merge
   senza test verdi. `node --check` dopo modifiche JS.
3. **Facile revisione del codice.** Moduli piccoli e nominati, niente duplicazioni, file < ~250 righe
   dove possibile, PR piccole e a tema unico, prompt esecutore con `Output attesi` espliciti.
4. **Documentazione sempre allineata al codice reale.** Il codice è la verità per i valori; i `.md` li
   specchiano. Ad ogni lavoro si aggiornano i `context/` toccati (parte del protocollo di chiusura).
5. **Sicurezza dei segreti.** Chiavi solo lato server; `.env` e `/uploads` gitignored; nessun segreto nel codice.

---

## 7. Attori / utenti

- **Utente finale (trader):** apre l'app, fa login, carica screenshot, riceve l'analisi, riapre lo storico.
- **Cliente dell'intervista:** valuta la demo; priorità = **qualità delle analisi** + esperienza base **blindata**.
- **Team:** Matteo (sviluppo, non profondamente tecnico) · Cristiano (socio, skill system + operativo).
- **Agenti AI:** Senior (intervista/piano), Esecutore (codice), Verifica (test/revisione), Meta (affina il sistema).

---

## 8. Rischi tecnici da presidiare

1. **Qualità vision sui grafici = rischio #1.** Da testare su grafici reali **prima** di blindare il modello.
2. **Costo per analisi.** ~4 screenshot per analisi → input pesante. Serve un **freno anti-runaway**
   (limite analisi per utente/sessione) anche in demo.
3. **Streaming + immagini.** Risposta a pezzi senza crash; decidere quante immagini/messaggi passati rimandare al modello.
4. **Isolamento dati per utente.** Un utente non deve mai vedere le chat di un altro → RLS, verificato esplicitamente.
5. **Segreti.** Chiave AI/Supabase solo lato server.

---

## 9. Anti-scope (cosa NON fare ora)

❌ Pagamenti / fatturazione / abbonamenti · ❌ Crediti / token a consumo · ❌ Self-host del modello su GPU ·
❌ White-label / branding del cliente · ❌ Funzioni extra fuori dalla spec. Arrivano **dopo** l'intervista col cliente.

---

## 10. Disallineamenti rilevati e come risolti (2026-06-30)

| # | Disallineamento | Risoluzione |
|---|-----------------|-------------|
| D1 | I doc 00–03 descrivono un'app più grande dell'estratto reale (mancano sfondo animato, TradingView, Markets/TradingLive/Timeline/Notes/Search, vision-service, provider multipli) | Fonte di verità attuale = **SPEC_DEMO_MINIMAL + RIASSUNTO** + questo file. L'estetica beta è lavoro da **ricostruire** |
| D2 | Modello AI: doc dicevano OpenRouter/Claude | **Aggiornato a Google Gemini** (L1) |
| D3 | Account: SPEC dice «demo senza login», utente vuole profilo+password+storico | Si fanno **account leggeri reali** su Supabase (L2) |
| D4 | Scalabilità: utente vuole «pronti a migliaia», doc dicono «demo prima» | **Scale-ready, non scale-features** (§6.1) |
| D5 | Due «skill system» con nome simile | Disambiguati (§4): Skill System Trading Platform vs Kit Aware Trader |
| D6 | I file `kit/` dell'estratto erano **placeholder** generici (in inglese, pro-elenchi) che contraddicevano lo stile prodotto | Sostituiti dal **kit v3 reale** (`kit/Trade_Analysis_Agent_Kit_v3_1_.md`), intraday/scalping; da splittare in `kit/01..09` al milestone M3 |

---

## 11. Questioni aperte (da chiudere nei prossimi giri di intervista)

- [x] ~~**Nome-metodo proibito**~~: il kit v3 reale è pulito. Identità pubblica = **Aware Trader** (nome interno del kit: *Trade Analysis Agent*). GoldenTrend = plugin di terzi, citabile come tale.
- [x] ~~**Auth demo**~~: deciso 2026-06-30 → **su invito / a mano** (no registrazione aperta).
- [x] ~~**Freno costi**~~: deciso 2026-06-30 → **nessun limite** (demo controllata). Resta solo `MAX_SCREENSHOT_PER_ANALISI` per la finestra di contesto, non per i costi.
- [ ] **Deploy**: la demo si prova all'intervista in modo controllato (il cliente non riceve accesso) → può bastare locale o URL privato? Target di deploy da definire.
- [ ] **Modelli nello switcher**: quali 2–3 Gemini nella lista curata delle Impostazioni?
- [ ] **Estetica**: quali elementi della beta ricostruire (sfondo animato, palette, font) e con che priorità?
- [~] **Flussi dettagliati** per schermata: **Chat + Avvio analisi (form) + follow-up** mappati (`CHAT_ANALISI_CONTEXT.md`). Restano: Auth, Sidebar/Storico, Impostazioni, Estetica.

---

## Check-list di questo documento

- [x] Cos'è / cosa non è (disclaimer)
- [x] Decisioni LOCKED datate
- [x] Perimetro demo (dentro/fuori)
- [x] Due skill system disambiguati
- [x] Schema di lavoro
- [x] Principi di qualità (scalabilità, test, revisione, doc, segreti)
- [x] Rischi + anti-scope + disallineamenti
- [ ] Questioni aperte → si chiudono nei prossimi giri (poi questo file e i `context/` si aggiornano)
