# Home — file di contesto (M7-bis)

> Mappa della **pagina Home** implementata su `/`: la landing che l'utente vede **dopo il login**,
> prima di entrare in analisi. Zona client: non tocca catena agente,
> kit, DB, auth. Fonte prodotto: `docs/CONTESTO_PRODOTTO.md` · piano: `docs/PIANO_LAVORO.md` (M7-bis).
>
> **Trigger di routing:** «home», «landing», «pagina d'arrivo», «sfondo animato», «dashboard d'ingresso»
> → questo file (+ `ESTETICA_CONTEXT.md` per i token).
> Aggiornato: 2026-07-02.

---

## 1. Cos'è questa zona e perché

L'utente vuole una **porta d'ingresso** all'app: dopo il login non deve trovarsi subito nel form di
analisi, ma in una **Home moderna e immersiva** che comunichi "piattaforma di trading premium", da cui
lanciare le azioni. Nasce da un prompt descrittivo (app vecchia, non più disponibile come codice):
la pagina è poi cresciuta con stato piazze, ultima sessione e card descrittive. Dati di mercato
live, calendario e funzioni senza backend restano fuori scope.

## 2. Decisioni d'intervista (2026-07-01)

| Tema | Deciso | Note |
|------|--------|------|
| **Palette** | **Slate + ciano dell'app (M7)**, non il verde-smeraldo del prompt. | Coerenza col resto dell'app. Lo sfondo animato è in tinta **ciano/slate**, non verde. Si **riusano i token** di `ESTETICA_CONTEXT §5`. |
| **Tema Home** | **Sempre scura, immersiva.** Ignora il toggle chiaro/scuro (M6). | Il toggle continua a valere nelle pagine app (Chat/Impostazioni). La Home forza la palette **scura** localmente anche se `<html>` non ha `.dark`. |
| **Font** | **Di sistema** (coerente con l'app). | Space Grotesk (dal prompt) NON incluso ora → **FU** (opzionale, solo titoli). |
| **Landing** | La Home diventa **`/`** (post-login). La Chat si sposta su una **rotta propria** (es. `/nuova-analisi`). | Va ricablata ogni navigazione che oggi assume `/` = Chat. |
| **Scope attuale** | pagina + tema + sfondo + hero/CTA + stato piazze + ultima sessione + card descrittive | Niente quotazioni live o dati mock. |
| **Navigazione autenticata** | Header condiviso con hamburger + nome app cliccabile verso Home; Sidebar disponibile su Home, Chat e Impostazioni. | Impostazioni ed Esci vivono solo nella Sidebar. Nessuna freccia indietro ora: arriverà con future pagine secondarie. |

## 3. Cosa si costruisce ORA (dentro scope)

- **Rotta e landing:** nuova pagina protetta **Home** su `/`; Chat spostata su `/nuova-analisi` (o `/chat`).
  Aggiornare `App.jsx`, il redirect `*`, il redirect post-login (`LoginRoute`) e **ogni** `navigate('/')`
  che oggi significa "vai in Chat".
- **`AnimatedTradingBackground`** (componente riutilizzabile, client-only):
  - particelle **ciano** che si muovono lente + linee sottili che collegano le vicine;
  - griglia finanziaria leggera; gradienti ciano/slate sfocati in lento movimento; **vignettatura** scura;
  - sagome astratte di candele/linea prezzo quasi invisibili (decorativo);
  - **dietro** a tutto (`fixed`/assoluto, `-z`, `pointer-events:none`), non intercetta i click;
  - **performante** (canvas + `requestAnimationFrame`, niente librerie pesanti);
  - **`prefers-reduced-motion`** → versione **statica** (gradiente + griglia, nessuna animazione);
  - su **mobile**: meno particelle.
- **Header condiviso:** hamburger nella posizione della precedente icona decorativa + nome
  **FREEDOM TRADING SYSTEM** cliccabile verso `/`. Lo stesso header è usato da Home, Chat e
  Impostazioni. **Impostazioni ed Esci non compaiono nell’header**: vivono solo nella Sidebar.
- **Hero:** badge (es. "Trading Intelligence Workspace"), titolo **«Il tuo agente di analisi
  tecnica»**, descrizione breve **«Studia i mercati con FREEDOM TRADING SYSTEM.»**, disclaimer
  visibile e un solo CTA:
  - **Nuova analisi** = CTA primario (gradiente ciano, bagliore discreto, hover raffinato) → apre la Chat/nuova analisi.
  - Lo **storico non ha più un CTA nella hero** e resta accessibile dal menu laterale condiviso.
  - *(Journal e Trading Live NON esistono → non messi ora, vedi FU.)*
- **Elemento decorativo a candele** (CSS/SVG) animato molto lentamente nella composizione dell'hero.
- **Interazioni:** entrata morbida/progressiva, leggero movimento delle card in hover, bordi più ciano
  in hover, transizioni 200–400ms, focus visibili (accessibilità). Niente animazioni lampeggianti.
- **Responsive:** desktop/tablet/smartphone; su mobile il CTA resta ben dimensionato, niente overflow
  orizzontale, meno particelle, nascondi solo i decori non essenziali.

## 4. Invarianti / LOCK locali

```
NO-TOUCH  catena agente (server) · kit/ · DB/RLS · auth (AuthProvider/ProtectedRoute logica) · store Zustand.
          La Home è pura UI: non cambia comportamento delle funzioni esistenti, non tocca API/route server.
RULE      Riusa i token di ESTETICA_CONTEXT §5 (slate+ciano). Nessuna terza palette, nessun verde-smeraldo,
          nessun colore hardcoded fuori dai token (l'accento è `freedom-accent` = ciano).
RULE      Home SEMPRE scura: forza la palette scura sul contenitore Home a prescindere dal toggle globale.
RULE      Sfondo animato dietro ai contenuti, `pointer-events:none`, mai blocca i click né la leggibilità.
          Supporta `prefers-reduced-motion` (versione statica). Niente librerie di animazione pesanti.
RULE      I CTA collegano SOLO rotte esistenti. Non creare pagine/finte funzioni (Journal/Trading Live = FU).
RULE      Header e Sidebar sono condivisi tra le pagine autenticate: niente copie locali della stessa
          navigazione. Il nome app torna sempre alla Home; Impostazioni ed Esci vivono solo nel drawer.
RULE      Nessuna freccia indietro in questa fase. Sarà introdotta con future pagine secondarie.
RULE      Ricablare il landing senza rompere i flussi: ogni redirect/navigazione a `/` che significava
          "Chat" va aggiornato alla nuova rotta. Verifica login→Home, Home→Chat, Chat↔Impostazioni, `*`.
RULE      Disclaimer sempre visibile e leggibile anche in Home. Test per ogni componente nuovo. Validate verde.
```

## 5. FUORI scope ORA → follow-up (tracciati in FOLLOW_UP.md)

Elementi del prompt che richiedono **dati** o **funzioni nuove** — si valutano insieme più avanti:

- **FU-018** MarketStatusBar: ~~stato mercati Londra/New York/Tokyo (aperto/chiuso)~~ **fatto (2026-07-01)** — stato mercati in alto a destra nella Home (vedi §6). **Orologio live** non incluso (utente: solo stato mercati) → eventuale FU futura.
- **FU-019** MarketOverview: griglia ~9 asset con prezzo/variazione/sparkline. **PARCHEGGIATA (2026-07-01)** — fuori dalla demo per **licenze commerciali**: dati azioni/indici real-time richiedono licenze di display delle borse (costose/per-utente); crypto/forex integrabili solo con piano commerciale a pagamento (CoinGecko ~$35/mese + attribuzione). Regola utente = niente licenze commerciali → non integrata. La card "Monitoraggio mercati" (in FU-021) resta **descrittiva**, senza ticker. Dettaglio in `FOLLOW_UP.md` FU-019.
- **FU-020** TradingCalendar: calendario mensile con giorno corrente evidenziato. *(Aperta, non in scope demo: decorativa senza dati dietro.)*
- **FU-021** FeatureCards "panoramica app" (Analisi assistita · Memoria sessioni · Journal · Monitoraggio mercati). **FATTO (2026-07-01)** — sezione introdotta dal titolo **«Cosa puoi fare»**, con 4 card statiche descrittive (nessun link), sotto l'hero (vedi §6). Journal = "in arrivo".
- **FU-022** ActiveSessionCard: card "riapri sessione" (chat più recente dell'utente). **FATTO (2026-07-01)** — dati interni via `listChats()` (RLS), sopra le FeatureCards. **Se non c'è sessione (o loading/errore) → la card non compare** (vedi §6).
- **FU-023** Pagina **Journal** (funzionalità nuova). **FATTO (2026-07-02)** — pagina `/journal`
  (diario di trading integrato con le analisi). In Home la card *Journal* di `FeatureCards` è ora un
  **link reale** verso `/journal` (non più "in arrivo"). Dettaglio in `context/JOURNAL_CONTEXT.md`.
- **FU-024** Pagina **Trading Live** (funzionalità nuova).
- **FU-025** Font **Space Grotesk** per i titoli della Home (opzionale, "premium").

> Quando una FU rientra in scope, i CTA/placeholder della Home si collegano riusando questa pagina.

## 6. File coinvolti (implementati 2026-07-01)

| File | Ruolo | Stato |
|------|-------|-------|
| `client/src/pages/Home.jsx` | Pagina Home: wrapper forzato `dark`, header minimale, hero, CTA reali, disclaimer. | **IMPLEMENTATO** |
| `client/src/components/layout/AppHeader.jsx` | Header autenticato condiviso: hamburger + nome app cliccabile verso Home. | **IMPLEMENTATO** |
| `client/src/components/layout/useStorico.js` | Stato e azioni condivise del drawer; da Home/Impostazioni apre la Chat corretta. | **IMPLEMENTATO** |
| `client/src/components/layout/Sidebar.jsx` | Navigazione Home/Nuova analisi, storico, Impostazioni ed Esci. | **IMPLEMENTATO** |
| `client/src/components/home/AnimatedTradingBackground.jsx` | Sfondo animato (canvas+rAF, reduced-motion→statico, meno particelle su mobile). | **IMPLEMENTATO** |
| `client/src/components/home/{Hero,HomeCta}.jsx` | Hero centrata sull’agente di analisi tecnica e unico CTA «Nuova analisi»; storico nel menu laterale. | **IMPLEMENTATO** |
| `client/src/components/home/ActiveSessionCard.jsx` + `useActiveSession.js` | Card "Riprendi sessione" (FU-022): chat più recente via `listChats()` (RLS); sparisce se nessuna sessione/loading/errore. | **IMPLEMENTATO (FU-022)** |
| `client/src/components/home/FeatureCards.jsx` | Sezione «Cosa puoi fare» e panoramica app (FU-021): 4 card (icone SVG inline, hover ciano). La card *Journal* è un **link** verso `/journal` (FU-023, 2026-07-02); le altre restano descrittive. | **IMPLEMENTATO (FU-021 · link Journal FU-023)** |
| `client/src/lib/dateFormat.js` | `relativeDayLabel()`: etichetta "oggi/ieri/N giorni fa/data breve" per l'ultimo aggiornamento della sessione. | **IMPLEMENTATO (FU-022)** |
| `client/src/components/home/useMarketStatus.js` | Stato aperto/chiuso di Londra/New York/Tokyo: orari **locali** per piazza via `Intl`+fuso IANA (DST-safe, solo lun–ven), refresh 60s. | **IMPLEMENTATO (FU-018)** |
| `client/src/components/home/MarketStatus.jsx` | Stato mercati nella Home; pallino **verde** aperto / grigio chiuso. Desktop: inline a destra dell'header. Mobile: riga orizzontale a tutta larghezza **sopra** il nome app. | **IMPLEMENTATO (FU-018)** |
| `client/src/App.jsx` | Home su `/`, Chat su `/nuova-analisi`, redirect `*` e post-login aggiornati. | **IMPLEMENTATO** |
| `client/src/pages/Chat.jsx` | Header/Sidebar condivisi; apre una chat indicata da `location.state.openChatId`. | **IMPLEMENTATO** |
| `client/src/pages/Settings.jsx` | Header/Sidebar condivisi; nessuna freccia indietro. | **IMPLEMENTATO** |
| `client/src/index.css` | Utility/keyframes per lo sfondo (riusa i token M7). | **IMPLEMENTATO** |

> **Manutenzione:** il canvas non può usare le classi Tailwind, quindi l'accento ciano è replicato come
> costante `ACCENT='#22d3ee'` in `AnimatedTradingBackground.jsx`. Se cambia il token `freedom.accent`,
> aggiornare anche lì. (Unica eccezione documentata alla regola "niente hardcoded".)
>
> **Verde stato mercati (FU-018):** il LOCK §4 dice "niente verde". Il pallino "aperto" di
> `MarketStatus.jsx` usa **verde** (`bg-green-500`) per **scelta esplicita dell'utente** (2026-07-01):
> eccezione autorizzata e confinata al micro-indicatore di stato. "Chiuso" resta grigio (token `faint`).

> **Gap audit 2026-07-02:** Tokyo è codificata 09:00–15:00 continuativo, ma la sessione cash TSE è
> 09:00–11:30 e 12:30–15:30. Tutte e tre le piazze ignorano festività/chiusure speciali: finché
> non corretto, descrivere il widget come indicativo e non come calendario ufficiale.

## 7. Come si verifica (il «fatto quando»)

- Dopo il login si arriva sulla **Home** (non più dritti in Chat); da lì "Nuova analisi" apre la Chat.
  Lo storico resta accessibile dal menu laterale aperto con l’hamburger. Hamburger e nome app restano
  coerenti su Home, Chat e Impostazioni; una chat scelta dal drawer si apre correttamente.
  Impostazioni ed Esci compaiono solo lì.
- La Home è **scura e immersiva** anche se il toggle è su "chiaro"; palette **slate+ciano** coerente con l'app.
- Lo **sfondo animato** gira fluido dietro ai contenuti, non blocca i click; con `prefers-reduced-motion`
  attivo diventa **statico**; su mobile ha meno particelle e nessun overflow orizzontale.
- Disclaimer visibile. Accessibilità: focus visibili, contrasto adeguato.
- **Zero regressioni:** `npm run validate` verde (client+server) e `npm run build` OK.

## 8. Come estendere senza rompere

- Le sezioni dati (mercati/calendario/sessione) si aggiungono come **componenti separati** dentro la Home
  quando le rispettive FU entrano in scope; riusano `AnimatedTradingBackground` e i token.
- Nuove rotte richiedono pagina protetta e context dedicato prima di collegare CTA.
- Mai introdurre dati **mock** dove esistono dati reali; mai librerie pesanti per animazioni semplici.
