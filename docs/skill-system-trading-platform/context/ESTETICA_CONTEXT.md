# Estetica — contesto operativo

> Aggiornato: 2026-07-02. Linguaggio visivo reale: slate + ciano, token semantici centralizzati,
> tema chiaro/scuro nelle pagine app; Home sempre scura con animazione propria.

## 1. Fonte attuale

La vecchia cartella `Esempio/` ha guidato M7 ma è stata rimossa dopo il restyle. Non è più una
dipendenza né un path da aprire. La fonte effettiva è:

- token CSS in `client/src/index.css`;
- mapping Tailwind in `client/tailwind.config.js`;
- componenti reali e test;
- `HOME_CONTEXT.md` per l'eccezione della landing.

## 2. Token

Tema scuro:

```css
--color-app:              2 6 23;
--color-surface:          15 23 42;
--color-surface-strong:   30 41 59;
--color-surface-stronger: 51 65 85;
--color-content:          241 245 249;
--color-muted:            148 163 184;
--color-faint:            100 116 139;
--color-line:             30 41 59;
```

Tema chiaro:

```css
--color-app:              255 255 255;
--color-surface:          241 245 249;
--color-surface-strong:   226 232 240;
--color-surface-stronger: 203 213 225;
--color-content:          15 23 42;
--color-muted:            71 85 105;
--color-faint:            148 163 184;
--color-line:             226 232 240;
```

Accento:

```js
freedom: {
  bg: '#020617',
  accent: '#06b6d4',
  accentHover: '#22d3ee',
}
```

## 3. Regole

```
RULE  Colori di UI tramite token; niente nuovi hardcoded per componente.
RULE  Testo scuro sui bottoni ciano per contrasto.
RULE  Chat/Login/Impostazioni seguono il tema profilo.
RULE  Home forza la palette scura localmente, indipendente dal toggle.
RULE  Disclaimer leggibile in ogni pagina e tema.
RULE  Focus visibile, contrasto adeguato, nessun overflow 375/834/1280.
RULE  prefers-reduced-motion disattiva il movimento non essenziale.
NO-TOUCH  una modifica estetica non cambia auth, DB, kit o comportamento agente.
```

Eccezioni autorizzate:

- `AnimatedTradingBackground.jsx` replica `#22d3ee` perché il canvas non usa classi Tailwind;
- `MarketStatus.jsx` usa verde soltanto per il micro-indicatore “mercato aperto”;
- la Home ha sfondo animato, mentre il resto dell'app resta statico.

## 4. Superfici reali

| Superficie | Stato |
|------------|-------|
| Login | form centrato, token tema; disclaimer attualmente mancante (bug) |
| Home | sempre scura, canvas/griglia/vignetta, hero e card |
| Chat | header/drawer, form, bolle, composer, footer disclaimer |
| Sidebar | drawer opaco con navigazione e storico |
| Impostazioni | tema/password; disclaimer attualmente mancante (bug) |

## 5. Verifica

- temi chiaro/scuro su Login, Chat, Sidebar e Impostazioni;
- Home scura con entrambi i valori del profilo;
- 375 / 834 / 1280 e contenuti lunghi;
- focus tastiera e contrasto;
- reduced motion;
- disclaimer;
- build senza regressioni e controllo del warning bundle.

Il QA browser completo resta distinto dalla lettura del codice. Non dichiararlo eseguito senza
prova reale tramite la skill `avvia-app`.
