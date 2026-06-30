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

> Stati: `aperto` · `in corso` · `fatto` (con data di chiusura) · `scartato` (con motivo).
