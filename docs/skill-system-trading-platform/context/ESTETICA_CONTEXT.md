# Estetica — file di contesto (M7)

> Mappa di dettaglio della zona **Estetica**: come deve apparire l'app. M7 è una **rifinitura
> additiva** sopra la base di M6: **non tocca** la catena agente, il kit, la persistenza o l'auth —
> cambia solo l'aspetto. Nessun LOCK del cuore, ma zona **deep** per protocollo (tocca **più di una
> view**: Chat, Login, Impostazioni, Sidebar), regola d'oro: **zero regressioni sui test** (è il
> «fatto quando» di M7). Fonte prodotto: `docs/CONTESTO_PRODOTTO.md`
> (L4, L19) · piano: `docs/PIANO_LAVORO.md` (M7).
>
> **Trigger di routing:** «estetica», «stile», «look», «palette», «colori», «tema visivo», «restyle»,
> «aspetto app», «slate», «ciano» → questo file.
> Aggiornato: 2026-07-01 (intervista M7, Senior).

---

## 1. Cos'è questa zona

Il **vestito** dell'app. In M6 abbiamo costruito la **base sobria e leggibile** con una **palette
semantica centralizzata** (token in `index.css` + `tailwind.config.js`): tutte le superfici usano
token (`app · surface · content · muted · faint · line`), non colori hardcoded. M7 **riusa quella
base** e le dà l'aspetto definitivo, cambiando **i valori dei token** — non i componenti uno a uno.

**La svolta d'intervista (2026-07-01):** l'estetica definitiva **non** è più il "verde-scuro con
sfondo animato" ipotizzato nei vecchi doc. Si **replica fedelmente** lo stile della vecchia app che
l'utente ha fornito in `Esempio/`: **dark su slate + accento ciano, sobrio, statico, font di
sistema**. Niente sfondo animato, niente font custom, niente restyle strutturale.

## 2. La fonte: la cartella `Esempio/`

`Esempio/` (root del repo) contiene il **codice sorgente** della vecchia app: è la fonte di verità
visiva di M7. Non si copiano le schermate 1:1 (l'app d'esempio ha Dashboard/Workspace/Journal, la
nostra ha Login/Chat/Sidebar/Impostazioni): si estrae e si applica il **linguaggio visivo** alle
schermate esistenti.

Lo stile che quei file definiscono:

| Aspetto | Cosa fa Esempio |
|---------|-----------------|
| **Sfondo app** | `bg-slate-950` (blu-grigio molto scuro) |
| **Pannelli / card** | `bg-slate-900`, bordo `border-slate-800`, `rounded-3xl`, `shadow-xl` |
| **Card interne** | `bg-slate-950` dentro i pannelli, bordo `border-slate-700`, `rounded-2xl` |
| **Accento** | **ciano** `cyan-500`, hover `cyan-400`; testo scuro sull'accento (`text-slate-950`) |
| **Bolle chat** | utente `bg-slate-800`, agente `bg-slate-700`, `rounded-xl` |
| **Testo** | principale `text-slate-100`, secondario `text-slate-400`, tenue `text-slate-500` |
| **Bottoni** | `rounded-xl`/`rounded-2xl`, `font-semibold`, transizioni su hover |
| **Chip / pill** | `rounded-full bg-slate-800`, label uppercase con `tracking` |
| **Dropzone** | bordo tratteggiato `border-dashed`, evidenzia in ciano al drag |
| **Tipografia** | **font di sistema** (nessun font custom); titoli `text-3xl font-semibold` |
| **Forme** | angoli morbidi ovunque (`rounded-3xl`/`2xl`/`xl`/`full`), bordi sottili, `shadow-xl` |

## 3. Decisioni d'intervista (2026-07-01)

| Tema | Deciso | Note |
|------|--------|------|
| **Direzione** | **Replica fedele di `Esempio/`** (dark slate + ciano, sobrio, statico). | Supera «verde-scuro + sfondo animato» dei vecchi doc (→ CONTESTO L19). |
| **Tema chiaro/scuro** | **Si mantengono entrambi** (il toggle di M6 resta). | Esempio è solo scuro → il tema **scuro** replica Esempio; il tema **chiaro** si **deriva** dagli stessi token (variante slate-light). |
| **Accento** | **Ciano** (`cyan-500` / hover `cyan-400`). | **Sostituisce** l'accento verde attuale (`freedom.accent` = `#2dd4a7`) **ovunque**. |
| **Sfondo animato** | **No.** Statico come Esempio. | Anti-scope M7. Eventuale ripensamento = follow-up, non ora. |
| **Font** | **Di sistema** (come Esempio e come già l'app). | Nessun font custom da importare. |
| **Scope** | Solo **valori** dei token + accento + rifinitura forme. Non si toccano struttura, componenti logici, catena, DB. | Rifinitura additiva. |

## 4. Invarianti / LOCK locali

```
RULE  Zero regressioni: i test client (137+) e server restano verdi. `npm run validate` verde prima di chiudere.
RULE  Un solo punto-verità dei colori: si cambiano i VALORI dei token (index.css) e l'accento
      (tailwind.config.js), NON si reintroducono colori hardcoded nei componenti. Se un componente
      ha ancora colori fissi (es. legacy), o lo si porta ai token o lo si lascia se non instradato.
RULE  Disclaimer sempre visibile e leggibile in entrambi i temi (RULE globale di prodotto).
RULE  Il tema chiaro deve restare leggibile (contrasto AA) tanto quanto lo scuro: la variante light
      si deriva, non si trascura.
NO-TOUCH  kit/ · catena agente (server) · DB/RLS · auth. M7 è puramente lato client/estetica.
NO-TOUCH  lib/theme.js e il meccanismo di persistenza tema (M6): il toggle funziona già, M7 cambia
      solo i colori che il toggle attiva.
```

## 5. Mappatura token (autorità per l'esecutore M7)

Si riscrivono i **valori** in `client/src/index.css`. I nomi dei token e la struttura restano
identici a M6 (così i componenti non cambiano). Valori come terne `R G B` (per le utility con opacità).

**Tema SCURO (`.dark`) — replica Esempio (slate):**

```css
--color-app:              2 6 23;      /* slate-950  #020617 — sfondo app */
--color-surface:          15 23 42;    /* slate-900  #0f172a — pannelli/card */
--color-surface-strong:   30 41 59;    /* slate-800  #1e293b — bolla utente, chip */
--color-surface-stronger: 51 65 85;    /* slate-700  #334155 — bolla agente */
--color-content:          241 245 249; /* slate-100  #f1f5f9 — testo principale */
--color-muted:            148 163 184; /* slate-400  #94a3b8 — testo secondario */
--color-faint:            100 116 139; /* slate-500  #64748b — testo tenue */
--color-line:             30 41 59;    /* slate-800  #1e293b — bordi */
color-scheme: dark;
```

**Tema CHIARO (`:root`) — variante slate-light derivata:**

```css
--color-app:              255 255 255; /* bianco */
--color-surface:          241 245 249; /* slate-100 */
--color-surface-strong:   226 232 240; /* slate-200 */
--color-surface-stronger: 203 213 225; /* slate-300 */
--color-content:          15 23 42;    /* slate-900 */
--color-muted:            71 85 105;    /* slate-600 */
--color-faint:            148 163 184;  /* slate-400 */
--color-line:             226 232 240;  /* slate-200 */
color-scheme: light;
```

**Accento (`client/tailwind.config.js`):** cambiare **il valore**, non il nome (così i 9 file che
usano `freedom-accent` diventano ciano senza rinominare nulla):

```js
freedom: {
  bg: '#020617',       // allineato allo sfondo slate (era #0b1f1a)
  accent: '#06b6d4',   // cyan-500 (era #2dd4a7 verde)
  accentHover: '#22d3ee', // cyan-400 — per gli hover (nuovo, opzionale)
}
```

> **Testo sull'accento:** Esempio usa **testo scuro** sui bottoni ciano (`text-slate-950`). Dove oggi
> un bottone accento ha testo bianco, valutare il passaggio a testo scuro per fedeltà + contrasto.

## 6. File coinvolti (implementati 2026-07-01)

| File | Ruolo | Stato |
|------|-------|-------|
| `client/src/index.css` | Riscrittura **valori** dei token chiaro/scuro (§5). | **IMPLEMENTATO** |
| `client/tailwind.config.js` | Accento verde → ciano (`freedom.accent = #06b6d4`); `freedom.accentHover = #22d3ee`. | **IMPLEMENTATO** |
| `client/src/components/chat/MessageBubble.jsx` | Bolle su `surface-strong` (utente) / `surface-stronger` (agente) — non più `accent` sulla bolla utente, per fedeltà a `Esempio/`. `rounded-xl shadow-sm`. | **IMPLEMENTATO** |
| `client/src/components/chat/ChatPanel.jsx` | Bolla streaming allineata a MessageBubble; bottone invio `text-slate-950` + hover `accentHover`. | **IMPLEMENTATO** |
| `client/src/components/chat/NewAnalysisForm.jsx` | Raggi `rounded`→`rounded-xl`/`rounded-2xl` su bottoni/input/select/textarea/riquadri; testo `text-slate-950` sui bottoni accento. | **IMPLEMENTATO** |
| `client/src/components/layout/Sidebar.jsx` | Righe storico e voce Impostazioni `rounded-xl`; bottone "+ Nuova chat" `text-slate-950`. Il drawer resta superficie opaca (`.sidebar-panel`). | **IMPLEMENTATO** |
| `client/src/pages/{Login,Settings}.jsx` | Input `rounded-xl`, bottoni principali `rounded-2xl` + `text-slate-950`. | **IMPLEMENTATO** |
| `client/src/pages/Chat.jsx` | Nessuna modifica necessaria: nessuna classe di colore/forma hardcoded, eredita tutto dai token. | **verificato, invariato** |

> Le 9 occorrenze di `freedom-accent` (grep): `Login.jsx · Settings.jsx · NewAnalysisForm.jsx ·
> Sidebar.jsx · MessageBubble.jsx · ChatPanel.jsx · Chat.jsx · index.css · Home.jsx`. Il valore in
> config è ora ciano ovunque (verificato nel CSS di produzione compilato). `Home.jsx` è legacy non
> instradato: non toccato, come previsto.

## 7. Come si verifica M7 (il «fatto quando»)

- L'app in tema **scuro** ha l'aspetto di `Esempio/` (sfondo slate-950, pannelli slate-900 arrotondati,
  accento ciano su bottoni/focus/hover, bolle chat slate-800/700).
- L'app in tema **chiaro** è coerente e leggibile (variante slate-light, stesso accento ciano).
- Il toggle tema (M6) continua a funzionare e a persistere per utente; nessun flash all'avvio.
- Disclaimer visibile e leggibile in entrambi i temi.
- **Nessuna regressione:** `npm run validate` verde (client + server); build produzione OK.

> **Stato verifica (2026-07-01):** i primi 5 punti sono verificati **da codice** (token/valori
> corretti, confermato anche nel CSS compilato) ma **non ancora da uno screenshot/uso reale in
> browser** — in questo ambiente di lavoro non era disponibile uno strumento di automazione browser
> (`chromium-cli`/Playwright). L'ultimo punto (validate + build) è verificato: 137 test client + 78
> server verdi, build produzione OK. Vedi `FOLLOW_UP.md` **FU-017** per il controllo visivo live
> ancora dovuto.

## 8. Come estendere senza rompere / follow-up collegati

- Nuovi colori → **token semantici**, mai hardcoded. Un colore che serve in 2+ posti = un token.
- Sfondo animato / font custom / restyle strutturale = **fuori M7** (anti-scope). Se un giorno servono,
  sono un follow-up dedicato, sopra questi token.
- Se si aggiunge una schermata, riusa i token esistenti: eredita il tema (chiaro/scuro) senza lavoro extra.
</content>
</invoke>
