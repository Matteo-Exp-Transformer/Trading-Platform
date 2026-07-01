# Sidebar / Storico chat — file di contesto

> Mappa di dettaglio della zona **Sidebar/Storico**: lista delle chat passate dell'utente, apertura di
> una chat esistente, rinomina, avvio di una nuova chat. Riusa DB e RLS già pronti da M2 slice 2a/2b
> (`aree/DB_SUPABASE_SKILL.md`); qui sta solo la **UI/flusso** lato client.
>
> **Trigger di routing:** «sidebar», «storico», «storico chat», «riapri chat», «rinomina chat»,
> «nuova chat» → questo file.
> Creato: 2026-06-30 (intervista slice 2c, M2). Aggiornato: 2026-07-01
> (navigazione autenticata condivisa).

---

## 1. Cos'è questa zona

Un pannello **a comparsa** (drawer, non sempre visibile) condiviso da Home, Chat e Impostazioni.
Contiene la navigazione principale, elenca le chat passate dell'utente (più recenti prima) e raccoglie
le azioni account. Da lì l'utente torna alla Home, avvia una nuova analisi, riapre o rinomina una chat,
apre Impostazioni oppure esce.

La voce globale «Nuova analisi» vive nella Sidebar, fuori dal flusso di conversazione. Convive con il
CTA contestuale della Home approvato in `HOME_CONTEXT.md`; `ChatPanel` non contiene un terzo ingresso.

## 2. File coinvolti (previsti)

| File | Ruolo |
|------|-------|
| `client/src/components/layout/AppHeader.jsx` | Header condiviso: hamburger + nome app cliccabile verso Home |
| `client/src/components/layout/useStorico.js` | Stato, caricamento, rinomina e navigazioni del drawer condivisi |
| `client/src/components/layout/Sidebar.jsx` | Drawer: Home, Nuova analisi, lista chat, Impostazioni, Esci |
| `client/src/components/layout/SidebarChatRow.jsx` *(nuovo, opzionale)* | Singola riga: titolo + data + menu rinomina |
| `client/src/pages/Home.jsx` | Apre il drawer dall’hamburger; la hero non duplica l’ingresso allo storico |
| `client/src/pages/Chat.jsx` | Usa header/drawer condivisi e gestisce selezione/nuova analisi in-place |
| `client/src/pages/Settings.jsx` | Usa header/drawer condivisi; da qui una chat apre `/nuova-analisi` |
| `client/src/components/chat/ChatPanel.jsx` | **Rimuove** il bottone «+ Nuova analisi» (riga 70-76) e la prop `onNuovaAnalisi` |
| `client/src/lib/chatData.js` | **Aggiunge** `listChats()` e `updateChatTitle(chatId, title)` |

## 3. Invarianti / LOCK locali

```
LOCK  isolamento per utente (RLS) — listChats/updateChatTitle passano SEMPRE per le policy esistenti
      su `chats` (select/update già coperte, vedi DB_SUPABASE_SKILL §RLS). Mai bypassare con query dirette.
RULE  Ingressi approvati per "nuova analisi": voce globale nella Sidebar + CTA contestuale nella Home.
      Nessun ingresso aggiuntivo dentro ChatPanel.
RULE  Mai crash a vista: lista vuota (nessuna chat) → messaggio semplice, non errore.
RULE  Impostazioni ed Esci vivono solo nella Sidebar, mai negli header autenticati.
RULE  Il nome app nell'header riporta sempre alla Home. Nessuna freccia indietro in questa fase.
```

## 4. Decisioni d'intervista (slice 2c, 2026-06-30)

| Domanda | Decisione |
|---------|-----------|
| Dove sta la sidebar | **A comparsa**: l’hamburger nell’header condiviso di Home, Chat e Impostazioni apre/chiude lo stesso drawer a sinistra. Non sempre visibile. |
| Cosa mostra ogni riga | **Titolo + data ultima modifica** (`chats.updated_at`, formattata leggibile — es. `gg/mm` o relativa "oggi", "ieri") |
| Ordinamento | `updated_at desc` (più recenti in cima) — già deciso in handoff, confermato |
| Click su una riga | Apre quella chat: `setCurrentChatId(chat.id)` + carica messaggi (riusa `loadMessages` già in `Chat.jsx`), poi **chiude il drawer** |
| Rinomina | **Icona/menu dedicato** accanto alla riga (es. icona matita) → titolo diventa editabile sul posto → invio/blur salva con `updateChatTitle` |
| Bottone «nuova analisi» | **Voce globale nella Sidebar**, rimossa da `ChatPanel`; convive con il CTA della Home. In Chat resetta lo stato in-place, da Home/Impostazioni naviga a `/nuova-analisi`; poi chiude il drawer. Nessuna conferma: i messaggi sono già persistiti. |
| Selezione da Home/Impostazioni | Naviga a `/nuova-analisi` passando l’ID della chat; Chat la carica all’ingresso. |
| Navigazione account | Impostazioni ed Esci sono ancorati in fondo e separati dallo storico; Esci riusa il logout esistente. |

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
