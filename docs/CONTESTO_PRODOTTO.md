# CONTESTO PRODOTTO — FREEDOM TRADING SYSTEM (demo)

> **Fonte di verità unica** del prodotto e delle decisioni prese. La leggono tutti gli agenti
> (Senior, Esecutore, Verifica) e l'utente. Le skill e i `context/` rimandano qui per il «perché».
> La cronologia datata delle decisioni vive qui e nei report di sessione, **non** nelle skill vive.
>
> Aggiornato: 2026-07-02 · Fase: **0 — demo pre-intervista** · Stato: **M0–M7-bis completi;
> M8 blindatura/deploy in corso**.

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
| L1 | Motore AI | **Google Gemini**, modello con vista; switcher mantenuto | 2026-06-30 | *Aggiorna* la vecchia ipotesi OpenRouter/Claude. Default aggiornato da L18 |
| L2 | Dati & account | **Supabase** (Postgres + Auth; Storage non usato) | 2026-06-30 | Account isolati per utente (RLS), online, scale-ready. Sostituisce SQLite locale |
| L3 | Nome app / repo | **FREEDOM TRADING SYSTEM** (repo `freedom-trading-system`) | 2026-06-30 | Continuità con la beta |
| L4 | Perimetro demo | **Minimal + estetica beta** | 2026-06-30 | Chat + Sidebar/Storico + Impostazioni; più lo stile ricco (da ricostruire) |
| L5 | API via servizio gestito | Sì; **niente self-host del modello** ora | (eredità docs) | Costo variabile pericoloso per un team di due |
| L6 | Chiave AI | Una sola, **lato server**, mai esposta al client | (eredità docs) | Per la demo basta una chiave di sviluppo |
| L7 | Vision obbligatoria | Il modello DEVE essere multimodale | (eredità docs) | L'app legge grafici |
| L8 | Lingua | Tutto in **italiano** | (eredità docs) | UI, agente, documentazione |
| L9 | Kit Aware Trader | Metodo 01–09 riusato lato server; guardrail 10 aggiunto | (eredità docs) | Valore distintivo; i drift audit del kit vanno corretti con task dedicato |
| L10 | Identità agente | L'AI si presenta come **Aware Trader**; kit riusato pari-pari | 2026-06-30 | Nome-metodo proibito ancora da raccogliere (giro kit) |
| L11 | Account demo | **Su invito / creati a mano** (no registrazione aperta) | 2026-06-30 | Più controllato e sicuro per l'intervista |
| L12 | Freno costi | Nessun tetto al **numero di analisi** nella demo | 2026-06-30 | Aggiornata da L20 per i follow-up; resta il massimo di 3 screenshot per finestra di contesto |
| L13 | Metodo (kit) | **Trade Analysis Agent Kit v3** è l'autorità; scope **intraday/scalping** (decisionale 5m/15m, contesto 1H/4H) | 2026-06-30 | Sostituisce i placeholder `kit/`. Swing/Position = estensione futura, fuori demo |
| L14 | Avvio analisi | **Form guidato** che genera il primo prompt + slot screenshot fissi per timeframe | 2026-06-30 | Dettaglio in `context/CHAT_ANALISI_CONTEXT.md` §4 |
| L15 | Login (M1) | **Email + password**; account creati **a mano** (no registrazione aperta); conferma email **disattivata**, email finte/interne ammesse; sessione persistente fino a «Esci» | 2026-06-30 | Niente SMTP in demo. Dettaglio in `context/AUTH_CONTEXT.md` |
| L16 | Recupero password / validazione email | **Rimandati a dopo l'intervista cliente** (FU-002, FU-003) | 2026-06-30 | In demo: reset password a mano dall'admin. Richiederanno SMTP + email reali |
| L17 | Impostazioni (M6) | L'utente gestisce **tema e password**; il **modello AI è per-account e lo assegna solo l'admin** | 2026-07-01 | `profiles.ai_model` è protetto anche a livello DB; gestione manuale ora, console super-admin in FU-016 |
| L18 | Modello AI di default | **Gemini 2.5 Flash**; Pro resta assegnabile per-account | 2026-07-01 | Test completo su grafici superato: lettura e requisiti dell'analisi già validata con Gemini 2.5 Pro rispettati. Flash scelto per il miglior costo a qualità adeguata |
| L19 | Estetica (M7) | **Dark su slate + accento ciano**, sobrio, font di sistema; tema chiaro/scuro mantenuto | 2026-07-01 | Derivata dalla vecchia app; la cartella sorgente di riferimento è stata rimossa dopo M7. La Home ha poi introdotto uno sfondo animato confinato alla landing |
| L20 | Limite conversazione | Prima analisi + massimo **5 follow-up** per chat | 2026-07-01 | Vincolo attivo client+server; supera L12 soltanto per i follow-up. Un rifiuto fuori tema consuma un follow-up |
| L21 | Blindatura agente | Dominio trading/mercati, classificatore d'ingresso Flash, recinto nel kit e canary | 2026-07-01 | Strati 1/2/4 implementati; filtro d'uscita completo e analisi del testo negli screenshot restano M8/Fase 2 |

---

## 3. Perimetro della demo

**Dentro (implementato; da completare la blindatura M8):**
- **Chat di analisi** (il cuore): scrivo + carico screenshot → l'agente risponde in stile Aware Trader, **in streaming**.
- **Sidebar**: profilo utente + **storico chat** (clic = riapro) + «nuova chat».
- **Impostazioni**: cambio password · tema chiaro/scuro. Il **modello AI per-account** non è
  modificabile dall'utente: lo assegna l'admin (gestione manuale DB nella demo; FU-016 per la console).
- **Login**: porta d'ingresso; account leggeri reali (su Supabase).
- **Home**: landing autenticata con stato indicativo delle piazze, ultima sessione e panoramica.
- **Estetica** (M7, rifinitura additiva): linguaggio derivato dalla vecchia app — dark su slate
  + accento ciano, sobrio, font di sistema; tema chiaro/scuro mantenuto (L19). Non deve
  compromettere la blindatura del cuore. Dettaglio in `context/ESTETICA_CONTEXT.md`.

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
2. **Costo per analisi.** Fino a 3 screenshot per analisi → input pesante. Non c'è un tetto al numero
   di analisi; ogni chat ha però massimo 5 follow-up (L20).
3. **Streaming + immagini.** Risposta a pezzi senza crash; decidere quante immagini/messaggi passati rimandare al modello.
4. **Isolamento dati per utente.** Un utente non deve mai vedere le chat di un altro → RLS, verificato esplicitamente.
5. **Segreti.** Chiave AI/Supabase solo lato server.

---

## 9. Anti-scope (cosa NON fare ora)

❌ Pagamenti / fatturazione / abbonamenti · ❌ Crediti / token a consumo · ❌ Self-host del modello su GPU ·
❌ White-label / branding del cliente · ❌ Funzioni extra fuori dalla spec. Arrivano **dopo** l'intervista col cliente.

🔭 **Fase 2 (prodotto finale, NON demo):** quote per utente su numero di analisi e consumo. Il limite
di 5 follow-up e quello di 3 screenshot sono già attivi come vincoli di conversazione/contesto (L20),
non come sistema commerciale di quote.

---

## 10. Disallineamenti rilevati e come risolti (2026-06-30)

| # | Disallineamento | Risoluzione |
|---|-----------------|-------------|
| D1 | I doc 00–03 descrivono un'app più grande dell'estratto reale (mancano sfondo animato, TradingView, Markets/TradingLive/Timeline/Notes/Search, vision-service, provider multipli) | Fonte di verità attuale = **SPEC_DEMO_MINIMAL + RIASSUNTO** + questo file. L'estetica beta è lavoro da **ricostruire** |
| D2 | Modello AI: doc dicevano OpenRouter/Claude | **Aggiornato a Google Gemini** (L1) |
| D3 | Account: SPEC dice «demo senza login», utente vuole profilo+password+storico | Si fanno **account leggeri reali** su Supabase (L2) |
| D4 | Scalabilità: utente vuole «pronti a migliaia», doc dicono «demo prima» | **Scale-ready, non scale-features** (§6.1) |
| D5 | Due «skill system» con nome simile | Disambiguati (§4): Skill System Trading Platform vs Kit Aware Trader |
| D6 | I file `kit/` dell'estratto erano **placeholder** generici (in inglese, pro-elenchi) che contraddicevano lo stile prodotto | **Risolto (M3, 2026-06-30):** il kit v3 reale è stato splittato in `kit/01,02,04,06,07,08,09` col contenuto autentico del monolite; placeholder dell'estratto scartati; monolite `Trade_Analysis_Agent_Kit_v3_1_.md` rimosso |

---

## 11. Questioni aperte (da chiudere nei prossimi giri di intervista)

- [x] ~~**Nome-metodo proibito**~~: il kit v3 reale è pulito. Identità pubblica = **Aware Trader** (nome interno del kit: *Trade Analysis Agent*). GoldenTrend = plugin di terzi, citabile come tale.
- [x] ~~**Auth demo**~~: deciso 2026-06-30 → **su invito / a mano** (no registrazione aperta).
- [x] ~~**Freno costi**~~: nessun tetto al numero di analisi; massimo 5 follow-up per chat e 3
  screenshot per analisi come vincoli di conversazione/contesto (L12, L20).
- [ ] **Deploy**: la demo si prova all'intervista in modo controllato (il cliente non riceve accesso) → può bastare locale o URL privato? Target di deploy da definire.
- [ ] **Migrazione modello AI**: `gemini-2.5-flash` e `gemini-2.5-pro` hanno shutdown annunciato
  per il **2026-10-16**. Scegliere e validare il successore con TEST VISTA prima del deploy cliente.
- [x] ~~**Modelli nello switcher**~~: lista curata M6 = `gemini-2.5-flash` (default) e
  `gemini-2.5-pro`; assegnazione admin-only per account, nessun selettore utente. Flash ha superato
  il test completo sui grafici mantenendo i requisiti già validati con Pro (L18).
- [x] ~~**Estetica**~~: deciso 2026-07-01 (L19) → dark slate + accento ciano, sobrio. La Home è
  l'eccezione animata documentata; la vecchia cartella di riferimento è stata rimossa.
- [x] ~~**Flussi dettagliati** per schermata~~: Chat, Auth, Sidebar/Storico, Impostazioni ed Estetica (M7) mappati.

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
