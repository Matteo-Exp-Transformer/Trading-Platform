---
name: {{nome-area}}
description: >-
  Skill per qualsiasi lavoro su {{area}} in {{progetto}}. Caricala quando il task riguarda
  {{parole-trigger}}. {{Una frase su cosa copre.}}
---

# {{AREA}} — Skill di area (entry point)

> **Strato centrale del pattern a 3 strati** (vedi `MANUALE_AVVIO.md` passo 4-bis):
> **SKILL d'area** (questo file: senso + attori + flusso + divieti + mappa) → **MINI-pack**
> (`{{AREA}}_MINI.md`, ingresso ~1 schermata, opzionale per aree molto usate) → **file di
> `context/*_CONTEXT.md`** (dettaglio per sotto-funzione). Questo file cattura il **SENSO** e
> rimanda al `context/` per i dettagli granulari. I valori (limiti, soglie) vivono nel **codice**;
> i `.md` li specchiano.
>
> Stack/strumenti dell'area: {{...}}.

---

## 0. Quando caricare questo skill (vs altri)

| Il task riguarda… | Skill da usare |
|-------------------|----------------|
| {{caso}} | **questo** |
| {{caso fuori area}} | {{altro skill}} |

## 1. A che serve {{AREA}} (il senso)

{{2-3 frasi: cosa fa questa parte del progetto dal punto di vista dell'utente finale, e perché
esiste. È il pezzo che dà all'agente gli appigli per giudicare se un upgrade «ha senso» — non
duplicarlo nei file di context.}}

## 2. Chi fa cosa (attori)

{{Elenco degli attori concreti (es. l'utente «Mario» che usa la pagina; l'admin «Anna» che la
configura) e cosa ciascuno può fare. Immagini concrete, non nomi-file isolati.}}

## 2-bis. Il flusso completo (percorso utente + flusso dati affiancati)

{{Il percorso dell'utente passo per passo, affiancato a cosa succede nei dati/nel codice a ogni
passo. È la mappa che fa scoprire codice morto o divergenze quando la rileggi sul codice reale.}}

## 3. Limiti e regole VOLUTE — NON «aggiustarle»

> ⚠️ Questi NON sono bug: sono scelte. Un agente che li «sistema» rompe il prodotto. Stato + divieto,
> niente cronologia (la storia sta nei report — `REGOLE_ORGANIZZATIVE.md` §6).

- **{{limite voluto n.1}}** — perché è così, cosa NON fare.
- **{{limite voluto n.2}}** — {{...}}.

## 4. Questioni aperte (decise, da implementare)

| Questione | Decisione presa | Stato |
|-----------|-----------------|-------|
| {{questione}} | {{cosa si è deciso}} | {{aperto/in corso}} |

## 5. LOCK di area (invarianti locali)

```
LOCK  {{file/struttura da non toccare}} — {{perché}} — mai senza permesso
RULE  {{regola che vale dentro quest'area}}
```

> I LOCK battono il profilo: valgono anche in un fix «piccolo». Per il testo pieno di un LOCK
> trasversale rimanda alla Bussola §4, non copiarlo.

## 6. Mappa: tocchi X → apri il file Y

| Se il task tocca… | Apri (intero) |
|-------------------|---------------|
| {{sotto-funzione 1}} | `context/{{FILE_1}}_CONTEXT.md` |
| {{sotto-funzione 2}} | `context/{{FILE_2}}_CONTEXT.md` |
| {{area diversa}} | `../{{Altra-Area}}/{{skill}}.md` |

## 7. Principio di lettura (vale per tutta l'area)

Leggi **INTERO** il file di `context/` mappato e il pezzo di codice prima di editare (tranne
micro-fix). Il codice è la verità per i numeri; i `.md` li specchiano. Se un file di context supera
~250 righe o si legge a fatica, spaccalo per sotto-funzione (`REGOLE_ORGANIZZATIVE.md` §5).

<!--
ISTRUZIONI (cancellare in uso):
- §1-§2-§2bis = il SENSO (perché esiste, chi la usa, come scorre). È ciò che manca di solito ai
  file «scritti da agenti per agenti», pieni di COME e vuoti di PERCHÉ.
- §3 = i limiti VOLUTI: l'elenco che impedisce all'agente di «aggiustare» scelte di prodotto.
- §4 = le questioni decise ma non ancora implementate (memoria di progetto, non cronologia).
- Affianca un `{{AREA}}_MINI.md` (template `_TEMPLATE_MINI.md`) se l'area è molto usata, e
  indicizzalo nella Bussola §0.0b.
- Regola di taglio: area piccola = 1 file context due sezioni; area grande = 1 file per sotto-funzione.
-->
