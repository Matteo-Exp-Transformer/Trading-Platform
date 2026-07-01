# Sidebar / Storico chat — file di contesto

> Mappa di dettaglio della zona **Sidebar/Storico**: lista delle chat passate dell'utente, apertura di
> una chat esistente, rinomina, avvio di una nuova chat. Riusa DB e RLS già pronti da M2 slice 2a/2b
> (`aree/DB_SUPABASE_SKILL.md`); qui sta solo la **UI/flusso** lato client.
>
> **Trigger di routing:** «sidebar», «storico», «storico chat», «riapri chat», «rinomina chat»,
> «nuova chat» → questo file.
> Creato: 2026-06-30 (intervista slice 2c, M2). Codice da costruire: i path sono **previsti**.

---

## 1. Cos'è questa zona

Un pannello **a comparsa** (drawer, non sempre visibile) che elenca le chat passate dell'utente,
più recenti prima. Da lì l'utente riapre una chat esistente, la rinomina, o avvia una nuova analisi.
Sostituisce l'attuale bottone «+ Nuova analisi» dentro `ChatPanel` (slice 2b): quel bottone **si
rimuove da dentro la chat** e vive **solo qui**, fuori dal flusso di conversazione.

## 2. File coinvolti (previsti)

| File | Ruolo |
|------|-------|
| `client/src/components/layout/Sidebar.jsx` *(nuovo)* | Drawer: lista chat, rinomina, bottone «nuova chat» |
| `client/src/components/layout/SidebarChatRow.jsx` *(nuovo, opzionale)* | Singola riga: titolo + data + menu rinomina |
| `client/src/pages/Chat.jsx` | Aggiunge stato apertura/chiusura sidebar, icona toggle in header, wiring `onSelectChat`/`onNuovaChat` |
| `client/src/components/chat/ChatPanel.jsx` | **Rimuove** il bottone «+ Nuova analisi» (riga 70-76) e la prop `onNuovaAnalisi` |
| `client/src/lib/chatData.js` | **Aggiunge** `listChats()` e `updateChatTitle(chatId, title)` |

## 3. Invarianti / LOCK locali

```
LOCK  isolamento per utente (RLS) — listChats/updateChatTitle passano SEMPRE per le policy esistenti
      su `chats` (select/update già coperte, vedi DB_SUPABASE_SKILL §RLS). Mai bypassare con query dirette.
RULE  Mai un secondo punto di ingresso per "nuova chat": il bottone vive SOLO in Sidebar, non in ChatPanel.
RULE  Mai crash a vista: lista vuota (nessuna chat) → messaggio semplice, non errore.
```

## 4. Decisioni d'intervista (slice 2c, 2026-06-30)

| Domanda | Decisione |
|---------|-----------|
| Dove sta la sidebar | **A comparsa**: icona (hamburger) nell'header di `Chat.jsx` apre/chiude un drawer a sinistra. Non sempre visibile. |
| Cosa mostra ogni riga | **Titolo + data ultima modifica** (`chats.updated_at`, formattata leggibile — es. `gg/mm` o relativa "oggi", "ieri") |
| Ordinamento | `updated_at desc` (più recenti in cima) — già deciso in handoff, confermato |
| Click su una riga | Apre quella chat: `setCurrentChatId(chat.id)` + carica messaggi (riusa `loadMessages` già in `Chat.jsx`), poi **chiude il drawer** |
| Rinomina | **Icona/menu dedicato** accanto alla riga (es. icona matita) → titolo diventa editabile sul posto → invio/blur salva con `updateChatTitle` |
| Bottone «nuova chat» | **Vive solo nella sidebar**, rimosso da dentro `ChatPanel`. Click → reset stato (`currentChatId=null`, `showForm=true`, riusa `handleNuovaAnalisi` esistente) e **chiude il drawer**. **Nessuna conferma richiesta**: ogni messaggio è già persistito al momento dell'invio (`addMessage` in `chatData.js`), quindi non esiste mai "lavoro non salvato" da perdere passando a una nuova chat. |

> **Titolo chat:** già risolto in slice 2b — `buildTitle()` in `formUtils.js` usa l'idea utente (troncata)
> o `asset · obiettivo` come fallback. La rinomina qui descritta è una **modifica manuale successiva**,
> non sostituisce quella logica. Chiude la questione aperta in `CHAT_ANALISI_CONTEXT.md §6`.

## 5. Comportamento drawer (default proposto, non richiesto esplicitamente — verificare in revisione)

- Chiude automaticamente dopo ogni azione che porta a una chat (apertura o nuova chat), per non
  restare aperto sopra la conversazione.
- Si apre/chiude anche con un secondo click sull'icona toggle nell'header.
- Lista vuota (utente senza chat pregresse): messaggio tipo «Nessuna chat ancora» invece di lista vuota muta.

## 6. Come estendere senza rompere

- `listChats()`/`updateChatTitle()` in `chatData.js` seguono lo stesso pattern di `createChat`/`addMessage`
  (helper `getUserId()`, `.select().single()` dove serve, propagano l'errore Supabase al chiamante).
- Eliminazione chat, ricerca/filtro nello storico: **fuori scope 2c**, non in FU-008/FU-009 — se richiesti,
  prima si aggiorna questo file.
- Se la sidebar deve mostrare un'anteprima dell'ultimo messaggio (oltre a titolo+data): è un'estensione,
  non assunta qui — va decisa esplicitamente prima di implementarla.

## 7. Report di sessione collegati

- `_sessioni-lavoro/2026-06-30/Report-M2-sidebar-storico.md` — slice 2c: `Sidebar.jsx` (drawer a
  comparsa), `listChats()`/`updateChatTitle()` in `chatData.js`, bottone "nuova chat" rimosso da
  `ChatPanel.jsx`, 14 nuovi test. Chiude FU-008/FU-009.
