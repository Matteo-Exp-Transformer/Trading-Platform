# Journal — file di contesto (FU-023)

> Mappa della **pagina Journal**: il diario di trading dell'utente. Non è un diario manuale come i
> concorrenti: è **integrato con le analisi AI** (una voce può nascere da una chat/analisi). Zona
> **deep** (nuova rotta + nuova tabella DB + RLS + client), ma **non tocca** catena agente né `kit/`.
> Fonte prodotto: `docs/CONTESTO_PRODOTTO.md` · piano: `docs/PIANO_LAVORO.md` · schema dati:
> `../aree/DB_SUPABASE_SKILL.md`.
>
> **Trigger di routing:** «journal», «diario», «diario di trading», «voce di journal», «salva nel
> journal», «esito trade», «lezione appresa» → questo file (+ `DB_SUPABASE_SKILL.md` per lo schema).
> Aggiornato: 2026-07-02 (**MVP implementato** — vedi §6). Decisioni fondanti: §2.

---

## 1. Cos'è questa zona e perché

L'utente vuole un **diario di trading** dentro l'app. Il differenziatore rispetto alla concorrenza
(Tradezella, TraderSync, Edgewonk): l'agente Aware Trader **produce già un'analisi strutturata** di
ogni grafico. Quindi il journal è per metà **automatico** — parte dall'analisi già ragionata — e
l'utente aggiunge ciò che l'AI non può sapere: **com'è andato il trade e come si è sentito**.

Obiettivo: chiudere il cerchio *analisi → decisione → esito → lezione*, così il trader vede i propri
pattern (ricorrenze, errori, emozioni) nel tempo. Coerente con lo scopo del prodotto: **supporto
all'analisi tecnica**, non consulenza.

## 2. Decisioni d'intervista (2026-07-01)

| Tema | Deciso | Note |
|------|--------|------|
| **Rapporto Journal↔Analisi** | **Ibrido.** Una voce può nascere da un'analisi (bottone «Salva nel journal» in Chat, pre-compilato con asset/timeframe/link) **oppure** essere creata a mano da zero. | È il differenziatore. Il link all'analisi è **opzionale**. |
| **Contenuto voce** | **Con numeri trade**: direzione, entry/exit/stop, R:R, P&L opzionale — **oltre** a esito qualitativo, emozione, nota, lezione, tag. | ⚠️ Sfiora il «tracker finanziario»: vedi §4 disclaimer. I numeri sono **inseriti dall'utente**, l'app li **registra** e basta (non li calcola come consiglio). |
| **Scope prima release** | **MVP completo**: lista + crea/modifica/elimina voce + card Home attiva + voce Sidebar + bottone «Salva nel journal» dalla Chat. | Il giro intero, usabile davvero. |
| **Palette / tema** | Slate + ciano dell'app; segue il **toggle chiaro/scuro** (M6) come Chat/Impostazioni (a differenza della Home che è sempre scura). | Riusa i token `ESTETICA_CONTEXT §5`. |
| **Statistiche** | **Fase 2**, non ora. Win rate, ricorrenza errori, R:R medio arrivano quando c'è abbastanza storico. | MVP = registrare + rileggere + filtrare. |

## 3. Cosa si costruisce ORA (dentro scope)

- **Tabella DB `journal_entries`** con **RLS per utente** (§5) — nuova migrazione via MCP `apply_migration`.
- **Rotta protetta `/journal`**: pagina lista voci, con filtri semplici (asset, esito, tag) e ordinamento per data.
- **CRUD voce**: crea / modifica / elimina, form dedicato. Dettaglio voce (modale o `/journal/:id` — da
  decidere in implementazione; preferenza modale per restare leggeri).
- **Card Home**: la card *Journal* in `FeatureCards.jsx` (oggi "in arrivo") diventa un **CTA reale** verso `/journal`.
- **Voce Sidebar**: *Journal* accanto a «Nuova analisi» e allo storico, nel drawer condiviso.
- **Aggancio dalla Chat**: bottone «Salva nel journal» dentro un'analisi → apre il form pre-compilato
  con `chat_id`, asset e timeframe presi dal `form_context` della chat.
- **Disclaimer** «non è consulenza finanziaria» visibile anche in Journal (§4).
- **Client data lib** `journalData.js` sullo stampo di `chatData.js` (list/create/get/update/delete).
- **Test** per ogni funzione nuova (client) + **test d'isolamento RLS** lato server (stampo `chat-rls.test.js`).

### Modello dati proposto (`journal_entries`)

| Colonna | Tipo | Note |
|---------|------|------|
| `id` | uuid pk default `gen_random_uuid()` | |
| `user_id` | uuid not null → `auth.users(id) on delete cascade` | proprietario; base della RLS |
| `chat_id` | uuid null → `chats(id) on delete set null` | link **opzionale** all'analisi; se la chat si cancella la voce **resta** (è il diario dell'utente) |
| `asset` | text | es. `EURUSD` |
| `timeframe` | text | es. `5m` |
| `traded_at` | date not null default `current_date` | data del trade/osservazione (base ordinamento) |
| `direction` | text check in (`long`,`short`,`none`) default `none` | |
| `outcome` | text check in (`win`,`loss`,`breakeven`,`no_trade`) | esito qualitativo |
| `entry_price` / `exit_price` / `stop_price` | numeric null | inseriti dall'utente |
| `rr` | numeric null | R:R inserito |
| `pnl` | numeric null | P&L **opzionale**, inserito dall'utente (nessuna valuta forzata nell'MVP) |
| `emotion` | text null | es. calmo/impulsivo/FOMO/esitante |
| `tags` | text[] default `'{}'` | tag liberi |
| `note` | text default `''` | nota libera |
| `lesson` | text default `''` | lezione appresa |
| `created_at` / `updated_at` | timestamptz default `now()` | trigger su update per `updated_at` |

**Indici:** `journal_entries(user_id, traded_at desc)`.

## 4. Disclaimer e confine col «tracker finanziario»

La scelta «con numeri trade» avvicina il journal a un tracker. Confine da tenere fermo:
- I numeri (entry/exit/pnl/R:R) sono **dati inseriti dall'utente**, l'app li **registra e mostra**;
  **non** li elabora in consigli operativi, **non** dice «compra/vendi».
- Il **disclaimer non rimovibile** («non è consulenza finanziaria, supporto all'analisi tecnica»)
  è **visibile anche in Journal**, come nel resto dell'app.
- Le statistiche aggregate (fase 2) resteranno **descrittive** (specchio del passato), mai predittive.

## 5. Invarianti / LOCK locali

```
NO-TOUCH  catena agente (server) · kit/ · auth (AuthProvider/ProtectedRoute) · schema di chats/messages.
          Il Journal aggiunge una tabella nuova e UI nuova; non cambia le funzioni esistenti.
LOCK      Isolamento per utente (RLS) — journal_entries nasce con RLS ON + policy separate
          (select/insert/update/delete) con user_id = (select auth.uid()). Nessuna tabella utente
          senza policy. Verificato con test d'isolamento. (DB_SUPABASE_SKILL §5)
RULE      chat_id è FK verso chats: la policy INSERT/UPDATE verifica ANCHE che la chat referenziata sia
          dell'utente quando chat_id non è null (lezione M2 messages→chats), altrimenti un utente
          potrebbe linkare la propria voce a una chat altrui. ON DELETE SET NULL (non cascade).
RULE      Riusa i token slate+ciano (ESTETICA_CONTEXT §5). Nessuna terza palette, nessun colore hardcoded.
RULE      Journal segue il toggle chiaro/scuro (come Chat/Impostazioni), NON è forzato scuro come la Home.
RULE      Disclaimer «non è consulenza finanziaria» visibile in Journal. I numeri si registrano, non si consigliano.
RULE      Header e Sidebar condivisi: aggiungere la voce Journal nel drawer, niente navigazione duplicata.
RULE      Client via supabase-js (anon key, RLS). Service key MAI nel client. Test per ogni funzione. Validate verde.
```

## 6. File coinvolti (implementati 2026-07-02)

| File | Ruolo | Stato |
|------|-------|-------|
| Migrazioni `m8_journal_entries_rls` + `m8_hardening_journal_fn_search_path` (MCP) | Tabella `journal_entries` + indice `(user_id, traded_at desc)` + trigger `set_journal_updated_at` (search_path fisso) + RLS ON + policy separate `journal_*_own` con check sul padre per `chat_id` | **IMPLEMENTATO** |
| `client/src/lib/journalData.js` | Data access `listEntries/getEntry/createEntry/updateEntry/deleteEntry`; whitelist dei campi scrivibili (`user_id` da sessione, mai dal client) | **IMPLEMENTATO** |
| `client/src/lib/journalFields.js` | Opzioni (direzione/esito/emozioni), `emptyEntry`, `prefillFromChat` (mappa `form_context`→voce), `toDbFields`/`toFormFields` (normalizzazione numeri/tag) | **IMPLEMENTATO** |
| `client/src/pages/Journal.jsx` | Pagina lista + filtri (asset/esito) + modale crea/modifica + elimina (ottimistico + rollback); header/sidebar condivisi; disclaimer; `filterEntries` pura esportata | **IMPLEMENTATO** |
| `client/src/components/journal/JournalEntryForm.jsx` | Form crea/modifica (numeri opzionali + esito + emozione + note + lezione + tag); asset obbligatorio | **IMPLEMENTATO** |
| `client/src/components/journal/JournalEntryCard.jsx` | Card voce in lista (asset·TF·data·badge esito·numeri·nota·tag·azioni) | **IMPLEMENTATO** |
| `client/src/components/home/FeatureCards.jsx` | Card *Journal* ora **link reale** verso `/journal` (altre card restano descrittive) | **IMPLEMENTATO** |
| `client/src/components/layout/Sidebar.jsx` | Voce *Journal* nella nav principale del drawer | **IMPLEMENTATO** |
| `client/src/lib/chatData.js` (`getChat`) + `client/src/pages/Chat.jsx` | `getChat` per leggere il `form_context`; bottone «Salva nel journal» → `/journal` con `state.newEntry` pre-compilato | **IMPLEMENTATO** |
| `client/src/App.jsx` | Rotta protetta `/journal` | **IMPLEMENTATO** |
| `server/test/journal-rls.test.js` | Test isolamento RLS (A/B: lettura, filtro id, insert/update con chat_id altrui, delete altrui) | **IMPLEMENTATO** |
| `*.test.jsx/js` (journalData, journalFields, Journal, FeatureCards, Chat, chatData) | Un test per ogni funzione nuova | **IMPLEMENTATO** |

> `/journal/:id` (dettaglio a rotta) non è stato necessario: crea/modifica avvengono in **modale**
> sulla pagina lista. Resta un'estensione possibile se servirà un permalink alla singola voce.

## 7. Come si verifica (il «fatto quando»)

- Dalla Home la card *Journal* apre `/journal`; la voce *Journal* è nel drawer da Home/Chat/Impostazioni.
- Posso **creare** una voce a mano, **modificarla**, **eliminarla**; ricompare correttamente nella lista.
- Da un'analisi in Chat il bottone «Salva nel journal» apre il form **pre-compilato** (asset/timeframe/link).
- Un utente vede **solo** le proprie voci (test RLS verde); nessuna voce altrui, mai.
- Disclaimer visibile in Journal. Palette coerente, segue il tema chiaro/scuro.
- **Zero regressioni:** `npm run validate` verde (client+server) e `npm run build` OK.

## 8. FUORI scope ORA → follow-up

- **Statistiche/analytics** (win rate, R:R medio, ricorrenza errori/emozioni, calendario P&L). → Fase 2.
- **Import CSV / sync broker / P&L automatico da conto reale**. → fuori demo (dati reali + confine consulenza).
- **Screenshot annotato dedicato** nella voce (oltre agli screenshot già nell'analisi linkata). → FU.
- **Export** (PDF/CSV del diario). → FU.
