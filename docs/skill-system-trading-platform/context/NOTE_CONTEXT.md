# Note — file di contesto

> Mappa della pagina **Note**: un taccuino personale con testo libero e stile scelto dall'utente.
> Zona **deep** perché aggiunge rotta, tabella Supabase e RLS, ma non tocca la catena agente né
> `kit/`. Schema e sicurezza: `../aree/DB_SUPABASE_SKILL.md`; stile: `ESTETICA_CONTEXT.md`.
>
> **Trigger di routing:** «note», «taccuino», «nota personale», «crea una nota» → questo file
> (+ `DB_SUPABASE_SKILL.md` per schema/RLS).
> Creato: 2026-07-02.

---

## 1. Scopo

La sezione `/note` permette a ogni utente autenticato di creare, rileggere, modificare ed eliminare
note personali. Ogni card mostra titolo e anteprima con il font e il colore salvati. La funzione è
indipendente dal Journal: il Journal registra il percorso di trading, mentre Note è testo libero.

## 2. Flusso approvato

- La card Home «Monitoraggio mercati» diventa **«Crea le tue note»** e apre `/note`.
  Il widget reale `MarketStatus` nell'header resta invariato.
- La Sidebar condivisa mostra **Note** accanto a **Journal**.
- La pagina elenca le note per `updated_at desc` e gestisce gli stati caricamento, errore e vuoto.
- «Nuova nota» apre una modale; la stessa modale modifica una nota esistente.
- L'editor contiene titolo, testo, font, colore e anteprima dal vivo.
- L'eliminazione richiede una conferma esplicita e ripristina la card se il salvataggio remoto fallisce.
- La pagina segue il tema chiaro/scuro dell'account e mostra il disclaimer globale.

## 3. Font e colori

Font ammessi, caricati da Google Fonts con licenze indicate dall'utente come compatibili con la
vendita dell'app:

- Predefinito di sistema (`font=''`);
- Inter (`inter`);
- Poppins (`poppins`);
- Lora (`lora`);
- Merriweather (`merriweather`);
- Roboto Mono (`roboto-mono`).

Il DB salva una **chiave font**, mai una stringa CSS arbitraria. Il client applica soltanto la
whitelist condivisa in `client/src/lib/notesFields.js`; valori sconosciuti tornano al sistema.

Il colore salva l'hex dello swatch scelto oppure `''` per il colore del tema. La palette è confinata
al contenuto scritto dall'utente, non cambia i colori strutturali dell'interfaccia. Gli swatch sono
selezionati per restare leggibili sia sul fondo chiaro sia su quello scuro; valori non presenti
nella whitelist tornano al colore del tema.

## 4. Modello dati

Tabella `public.notes`:

- `id uuid` PK, default `gen_random_uuid()`;
- `user_id uuid not null` → `auth.users(id) on delete cascade`;
- `title text not null default ''`;
- `content text not null default ''`;
- `color text not null default ''`;
- `font text not null default ''`;
- `created_at`, `updated_at timestamptz not null default now()`.

Indice: `(user_id, updated_at desc)`.

Trigger BEFORE UPDATE `set_notes_updated_at`: funzione trigger-only con `search_path=''` ed
`EXECUTE` revocato a `public`, `anon`, `authenticated`.

## 5. Invarianti / LOCK locali

```text
NO-TOUCH  catena agente · kit/ · auth · schema di chats/messages/journal_entries.
LOCK      Isolamento utente: RLS attiva e policy separate notes_*_own per select/insert/update/delete,
          limitate a `authenticated` e `user_id = (select auth.uid())`.
RULE      UPDATE ha SELECT, USING e WITH CHECK; user_id arriva dalla sessione, mai dal form.
RULE      Client via supabase-js con chiave pubblica e RLS; service_role mai nel client.
RULE      Font e colore passano dalle whitelist di notesFields; niente CSS arbitrario dal DB.
RULE      UI tramite token slate+ciano; gli hex dinamici sono soltanto colore del testo utente.
RULE      Header e Sidebar sono condivisi; nessuna copia locale della navigazione.
RULE      Disclaimer sempre visibile. Ogni funzione nuova ha almeno un test pertinente.
```

## 6. File previsti

- `supabase/migrations/*_m9_notes_rls.sql`: tabella, indice, trigger e policy.
- `client/src/lib/notesData.js`: lista, creazione, modifica, eliminazione owner-only.
- `client/src/lib/notesFields.js`: whitelist font/colori e normalizzazione campi.
- `client/src/components/notes/NoteEditor.jsx`: editor e anteprima dal vivo.
- `client/src/components/notes/NoteCard.jsx`: titolo, anteprima e azioni.
- `client/src/pages/Notes.jsx`: pagina, stati, modale e CRUD.
- `client/src/App.jsx`: rotta protetta `/note`.
- `client/src/components/home/FeatureCards.jsx`: card «Crea le tue note».
- `client/src/components/layout/Sidebar.jsx`: voce Note.
- test client delle aree sopra e test RLS live `server/test/notes-rls.test.js`.

## 7. Fatto quando

- Home e Sidebar aprono `/note`; `MarketStatus` continua a funzionare senza modifiche.
- L'utente crea, modifica ed elimina note e vede subito font/colore nell'anteprima e nelle card.
- Refresh e nuovo accesso rileggono le note ordinate dalla più recente.
- Un secondo utente non può leggere, modificare o eliminare note altrui.
- Advisor sicurezza senza finding riferiti a Note; lint, test client, test server non-RLS e build verdi.
