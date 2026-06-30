# SESSION_LOG — indice cronologico delle sessioni

> Una riga per sessione, in ordine cronologico (più recente in alto). Ogni riga punta al report
> completo in `_sessioni-lavoro/AAAA-MM-GG/` — cartella **gitignored** (i report sono lavoro locale,
> non su GitHub). Questo indice invece è **committato**: è la storia leggera che un agente legge per
> capire il passato recente senza aprire i report.

| Data | Profilo | Tema (one-liner) | Report (locale) |
|------|---------|------------------|-----------------|
| 2026-06-30 | Esecuzione | Completamento init repo + M0 (scaffold, tooling, test verdi), ambiente Node | `_sessioni-lavoro/2026-06-30/Report-completamento-init-e-M0.md` |
| 2026-06-30 | Esecuzione (deep) | M1 Auth & RLS: Login, AuthProvider, ProtectedRoute, profiles+RLS su Supabase, test isolamento | `_sessioni-lavoro/2026-06-30/Report-M1-auth-rls.md` |
| {{AAAA-MM-GG}} | {{Esecuzione}} | {{cosa fatto in breve}} | `_sessioni-lavoro/{{AAAA-MM-GG}}/Report-{{tema}}.md` |
