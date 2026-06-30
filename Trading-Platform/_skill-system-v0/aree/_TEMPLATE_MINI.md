# {{AREA}} — Mini-pack d'area (ingresso rapido)

> **Cos'è.** Ingresso ~1 schermata per l'area **{{AREA}}**: trigger, cosa caricare subito, divieti
> frequenti, mappa file, LOCK (solo link). **Non duplica** i LOCK/RULE: per il testo pieno apri la
> skill d'area `{{SKILL_AREA}}.md` e i file di `context/`. Target lunghezza: **≤ 80 righe**.
>
> Pattern realizzato nel progetto-madre come «mini-pack»: dà ad agenti di ogni tier un ingresso
> leggero senza ripetere i LOCK. Indicizzato nella Bussola §0.0b.

## 1. Trigger
{{5-10 parole/frasi di Matteo che significano quest'area}}

## 2. Carica subito
- **`{{SKILL_AREA}}.md`** (skill d'area — leggila intera).
- **`context/{{FILE_OBBLIGATORIO}}.md`** se è LOCK/obbligatorio prima di modificare (max 2 context).

## 3. Divieti top-3
1. {{errore ricorrente n.1 — es. confondere quest'area con un'altra}}
2. {{limite VOLUTO da non «aggiustare» — con link alla skill piena}}
3. {{invariante di sicurezza/dati}}

## 4. Mappa file
| Se il task tocca… | Apri (intero) |
|---|---|
| {{caso}} | `context/{{file}}.md` |
| {{caso area diversa}} | `../{{Altra-Area}}/{{skill}}.md` |

## 5. LOCK (solo link)
- **{{LOCK}}** → `{{skill/context}}.md` §{{n}}.
- {{regola trasversale}} → `00_BUSSOLA_SKILL.md` §{{n}}.

<!--
ISTRUZIONI (cancellare in uso):
- 5 sezioni fisse: Trigger · Carica subito · Divieti top-3 · Mappa file · LOCK (solo link).
- MAI copiare paragrafi LOCK: solo NOME + LINK alla sezione nella skill/context piena.
- Attenzione ai path relativi: un MINI in `<Area>/` linka i context con `context/…`; se è in una
  sottocartella, conta i livelli (`../`). Un check-doc-paths in CI intercetta i link rotti.
- Registra il mini-pack nell'indice §0.0b della Bussola (Area → mini-pack → skill piena).
- Aggiungi il puntatore Cursor `.cursor/skills/{{progetto}}-{{area}}/SKILL.md` (15-25 righe → rimanda
  al MINI + skill piena).
-->
