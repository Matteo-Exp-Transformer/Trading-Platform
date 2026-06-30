# FOLLOW_UP — debiti tecnici e controlli differiti

> Cose rimandate a dopo: polish UI fuori scope, controlli da fare, refactor differiti. Ogni voce
> ha un ID `FU-NNN` citabile dai report. L'agente prepara-prompt cerca qui i follow-up rilevanti
> quando prepara un nuovo prompt.

| ID | Aperto il | Descrizione | Origine (report) | Stato |
|----|-----------|-------------|------------------|-------|
| FU-001 | 2026-06-30 | **M1 — Auth & RLS**: creare progetto Supabase, popolare `.env.local` reale, intervista → `context/AUTH_CONTEXT.md`, poi Login + policy RLS. (Supabase rimandato da M0.) | `_sessioni-lavoro/2026-06-30/Report-completamento-init-e-M0.md` | **fatto** (2026-06-30) — codice M1 completo, `npm run validate` verde, test RLS passato |
| FU-002 | 2026-06-30 | **Recupero password self-service**: «password dimenticata» via email. Rimandato a **dopo l'intervista cliente**. In demo il reset lo fa l'admin a mano. Richiede SMTP + email reali. | intervista M1 (giro 2) | aperto |
| FU-003 | 2026-06-30 | **Validazione email reale**: conferma email all'iscrizione/creazione. In demo disattivata (email finte/interne ammesse). Da attivare con FU-002 dopo l'intervista cliente. | intervista M1 (giro 2) | aperto |
| FU-004 | 2026-06-30 | **Leaked password protection** (Supabase Auth → HaveIBeenPwned): attivare l'interruttore nel pannello Auth. Unico advisor security residuo dopo l'hardening M1; bassa priorità in demo (account a mano, password deboli ammesse), da valutare prima del prodotto finale. | revisione M1 (advisor Supabase) | aperto |
| FU-005 | 2026-06-30 | **Policy Storage per allegati (M4)**: quando `messages.attachments` inizierà a contenere riferimenti a file su Supabase Storage, definire le policy RLS su Storage (bucket privato per utente). Predisposto ora con la colonna jsonb; policy da scrivere a M4 prima di caricare file. | chiusura M2 (Report-M2-db-chats-messages-rls.md) | aperto |
| FU-006 | 2026-06-30 | **RULE mancante in DB_SUPABASE_SKILL**: le policy INSERT su tabelle figlie (es. messages) devono verificare anche l'ownership della tabella padre (es. chats), non solo `user_id`. Aggiungere come RULE esplicita nel §5 prima del prossimo task DB. | chiusura M2 — falla rilevata dal test chat-rls.test.js caso (d) | **fatto** (2026-06-30, revisione M2) — RULE §5 presente ed estesa anche a UPDATE |
| FU-007 | 2026-06-30 | **Policy UPDATE simmetrica a INSERT su messages**: la UPDATE non verificava l'ownership della chat padre → un utente poteva spostare un proprio messaggio in una chat altrui (impatto solo d'integrità, nessuna fuga dati: il messaggio resta filtrato per `user_id`). Chiusa con migrazione `m2_hardening_messages_update_parent_check` + test caso (e). | revisione M2 (questa sessione) | **fatto** (2026-06-30) — migrazione applicata, advisor pulito, test verde |

| FU-008 | 2026-06-30 | **M2 slice 2c — Sidebar/storico chat**: lista delle proprie chat ordinate per `updated_at desc`, click su riga → apre quella chat con i suoi messaggi. Esplicitamente fuori scope 2b. | chiusura M2 slice 2b | aperto |
| FU-009 | 2026-06-30 | **M2 slice 2c — Rinomina chat**: l'utente può cambiare il titolo di una chat esistente (`update chats.title`). Esplicitamente fuori scope 2b. | chiusura M2 slice 2b | aperto |
| FU-010 | 2026-06-30 | **M3 — Persistenza strutturata del contesto-form per l'AI**: in 2b il contesto del form (asset/stile/obiettivo/posizione) è salvato solo come riepilogo testuale nel primo messaggio (`buildSummary`). A M3 l'agente ha bisogno del contesto **strutturato** valido per tutta la chat (CHAT_ANALISI_CONTEXT §5/§6): decidere dove persisterlo (colonna su `chats` o tabella dedicata) prima di collegare il cervello. | chiusura M2 slice 2b (revisione Senior) | aperto |

> Stati: `aperto` · `in corso` · `fatto` (con data di chiusura) · `scartato` (con motivo).
