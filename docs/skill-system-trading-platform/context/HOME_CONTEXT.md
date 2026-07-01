# Home — file di contesto (M7-bis)

> Mappa della **pagina Home**: la landing che l'utente vede **dopo il login**, prima di entrare in
> analisi. Oggi non esiste: dopo il login si finisce dritti in Chat (`/`). Zona **deep** (nuovo
> componente + nuova rotta + ricablaggio del landing), ma **solo client**: non tocca catena agente,
> kit, DB, auth. Fonte prodotto: `docs/CONTESTO_PRODOTTO.md` · piano: `docs/PIANO_LAVORO.md` (M7-bis).
>
> **Trigger di routing:** «home», «landing», «pagina d'arrivo», «sfondo animato», «dashboard d'ingresso»
> → questo file (+ `ESTETICA_CONTEXT.md` per i token).
> Aggiornato: 2026-07-01 (intervista Senior).

---

## 1. Cos'è questa zona e perché

L'utente vuole una **porta d'ingresso** all'app: dopo il login non deve trovarsi subito nel form di
analisi, ma in una **Home moderna e immersiva** che comunichi "piattaforma di trading premium", da cui
lanciare le azioni. Nasce da un prompt descrittivo (app vecchia, non più disponibile come codice):
quel prompt descrive **molti** elementi (mercati, calendario, orologio, ecc.), ma **per ora si fa solo
la pagina + il tema + lo sfondo animato + l'hero con i CTA reali**. Tutto ciò che richiede **dati o
funzioni nuove** è rimandato a follow-up.

## 2. Decisioni d'intervista (2026-07-01)

| Tema | Deciso | Note |
|------|--------|------|
| **Palette** | **Slate + ciano dell'app (M7)**, non il verde-smeraldo del prompt. | Coerenza col resto dell'app. Lo sfondo animato è in tinta **ciano/slate**, non verde. Si **riusano i token** di `ESTETICA_CONTEXT §5`. |
| **Tema Home** | **Sempre scura, immersiva.** Ignora il toggle chiaro/scuro (M6). | Il toggle continua a valere nelle pagine app (Chat/Impostazioni). La Home forza la palette **scura** localmente anche se `<html>` non ha `.dark`. |
| **Font** | **Di sistema** (coerente con l'app). | Space Grotesk (dal prompt) NON incluso ora → **FU** (opzionale, solo titoli). |
| **Landing** | La Home diventa **`/`** (post-login). La Chat si sposta su una **rotta propria** (es. `/nuova-analisi`). | Va ricablata ogni navigazione che oggi assume `/` = Chat. |
| **Scope** | Solo **pagina + tema + sfondo animato + hero con CTA reali**. | Il resto (dati/funzioni) → §5 FU. |

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
- **Header minimale della Home:** logo/simbolo astratto (candele) + nome app. **Niente** orologio o
  stato mercati live ora (→ FU). Eventuale accesso a Impostazioni/Esci se comodo (riusa la Sidebar esistente).
- **Hero:** badge (es. "Trading Intelligence Workspace"), titolo grande, breve descrizione, disclaimer
  visibile, e **CTA solo verso rotte esistenti**:
  - **Nuova analisi** = CTA primario (gradiente ciano, bagliore discreto, hover raffinato) → apre la Chat/nuova analisi;
  - **Le mie analisi** → apre lo **storico** (Sidebar/drawer esistente).
  - *(Journal e Trading Live NON esistono → non messi ora, vedi FU.)*
- **Elemento decorativo a candele** (CSS/SVG) animato molto lentamente nella composizione dell'hero.
- **Interazioni:** entrata morbida/progressiva, leggero movimento delle card in hover, bordi più ciano
  in hover, transizioni 200–400ms, focus visibili (accessibilità). Niente animazioni lampeggianti.
- **Responsive:** desktop/tablet/smartphone; su mobile impila, CTA in griglia compatta, niente overflow
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
RULE      Ricablare il landing senza rompere i flussi: ogni redirect/navigazione a `/` che significava
          "Chat" va aggiornato alla nuova rotta. Verifica login→Home, Home→Chat, Chat↔Impostazioni, `*`.
RULE      Disclaimer sempre visibile e leggibile anche in Home. Test per ogni componente nuovo. Validate verde.
```

## 5. FUORI scope ORA → follow-up (tracciati in FOLLOW_UP.md)

Elementi del prompt che richiedono **dati** o **funzioni nuove** — si valutano insieme più avanti:

- **FU-018** MarketStatusBar: orologio live + stato mercati Londra/New York/Tokyo (aperto/chiuso).
- **FU-019** MarketOverview: griglia ~9 asset (BTC, ETH, Oro, S&P500, Nasdaq, EUR/USD, GBP/USD, Petrolio, DAX) con prezzo/variazione/sparkline + **fonte dati reale** (niente mock se ci sono dati veri).
- **FU-020** TradingCalendar: calendario mensile con giorno corrente evidenziato.
- **FU-021** FeatureCards "panoramica app" (Analisi assistita · Memoria sessioni · Journal · Monitoraggio mercati).
- **FU-022** ActiveSessionCard: card "riapri sessione" se esiste una sessione aperta.
- **FU-023** Pagina **Journal** (funzionalità nuova, non solo estetica).
- **FU-024** Pagina **Trading Live** (funzionalità nuova).
- **FU-025** Font **Space Grotesk** per i titoli della Home (opzionale, "premium").

> Quando una FU rientra in scope, i CTA/placeholder della Home si collegano riusando questa pagina.

## 6. File coinvolti (implementati 2026-07-01)

| File | Ruolo | Stato |
|------|-------|-------|
| `client/src/pages/Home.jsx` | Pagina Home: wrapper forzato `dark`, header minimale, hero, CTA reali, disclaimer. | **IMPLEMENTATO** |
| `client/src/components/home/AnimatedTradingBackground.jsx` | Sfondo animato (canvas+rAF, reduced-motion→statico, meno particelle su mobile). | **IMPLEMENTATO** |
| `client/src/components/home/{Hero,HomeCta}.jsx` | Sotto-componenti piccoli. | **IMPLEMENTATO** |
| `client/src/App.jsx` | Home su `/`, Chat su `/nuova-analisi`, redirect `*` e post-login aggiornati. | **IMPLEMENTATO** |
| `client/src/pages/Chat.jsx` | `useEffect` additivo: apre lo storico se arriva `location.state.openStorico` (CTA "Le mie analisi"). | **IMPLEMENTATO** |
| `client/src/pages/Settings.jsx` | Back-link → `/nuova-analisi`. | **IMPLEMENTATO** |
| `client/src/index.css` | Utility/keyframes per lo sfondo (riusa i token M7). | **IMPLEMENTATO** |

> **Manutenzione:** il canvas non può usare le classi Tailwind, quindi l'accento ciano è replicato come
> costante `ACCENT='#22d3ee'` in `AnimatedTradingBackground.jsx`. Se cambia il token `freedom.accent`,
> aggiornare anche lì. (Unica eccezione documentata alla regola "niente hardcoded".)

## 7. Come si verifica (il «fatto quando»)

- Dopo il login si arriva sulla **Home** (non più dritti in Chat); da lì "Nuova analisi" apre la Chat e
  "Le mie analisi" apre lo storico. I flussi esistenti (analisi, storico, impostazioni, esci) funzionano ancora.
- La Home è **scura e immersiva** anche se il toggle è su "chiaro"; palette **slate+ciano** coerente con l'app.
- Lo **sfondo animato** gira fluido dietro ai contenuti, non blocca i click; con `prefers-reduced-motion`
  attivo diventa **statico**; su mobile ha meno particelle e nessun overflow orizzontale.
- Disclaimer visibile. Accessibilità: focus visibili, contrasto adeguato.
- **Zero regressioni:** `npm run validate` verde (client+server) e `npm run build` OK.

## 8. Come estendere senza rompere

- Le sezioni dati (mercati/calendario/sessione) si aggiungono come **componenti separati** dentro la Home
  quando le rispettive FU entrano in scope; riusano `AnimatedTradingBackground` e i token.
- Nuove rotte (Journal, Trading Live) = pagine protette separate; i CTA della Home le collegano allora.
- Mai introdurre dati **mock** dove esistono dati reali; mai librerie pesanti per animazioni semplici.
</content>
