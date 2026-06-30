---
name: bussola
description: >-
  Skill 0 — orienta qualsiasi agente sul progetto {{NOME_PROGETTO}}. Caricalo a inizio
  sessione, quando non sai quale skill usare, o quando il task attraversa più aree.
  Mappa il progetto, definisce gli invarianti globali e instrada al file corretto.
---

# Bussola — Skill 0 / orientamento agente

> Stack: {{STACK}}.
> File master: `CLAUDE.md` (root) — comandi, file critici, setup.

> **Questa è la bussola: smista, non spiega.** I dettagli di implementazione di ogni zona
> stanno nei file di `context/`. Tieni questo file **sotto ~250 righe**.

---

## 0. Prima cosa: scegli il profilo e instrada

### 0.0 Profilo di ingresso

Capisci **che tipo di task** stai per fare. Il profilo riduce il contesto che carichi:
non leggi skill fuori dal tuo profilo.

| Profilo | Tipo di task | Parole-trigger | Carica | Salta |
|---------|--------------|----------------|--------|-------|
| **Esecuzione** | feature, fix, lavoro UI | `{{parole_liv1_esecuzione}}` (vedi VOCABOLARIO) | file di `context/` della zona pertinente | testing/debug/meta |
| **Verifica** | debug, test, revisione | `{{parole_liv1_verifica}}` | skill testing + context della zona revisionata | meta |
| **Meta** | affinamento sistema/comunicazione | `{{parole_liv1_meta}}` | solo `comunicazione/` (+ `{{cartella_privata}}/{{PIANO_DIDATTICO}}` se il sottosistema didattico è attivo) | tutte le skill di codice |

> I profili non si sovrappongono. Discriminante: **cosa produce il task**. Esecuzione produce
> codice; Verifica controlla codice già prodotto (sempre coi test); Meta lavora sul sistema
> documentale e sulla comunicazione, non sul codice.

> ⚠️ **I LOCK battono il profilo.** Le righe marcate **OBBLIGATORIO** e gli invarianti §4
> valgono sempre, anche in un fix «piccolo».

### 0.0b Indice mini-pack (ingresso rapido per le aree molto usate)

Alcune aree hanno un **mini-pack** `{{AREA}}_MINI.md`: un ingresso ~1 schermata (trigger · carica
subito · divieti top-3 · mappa · LOCK solo-link). Chi conosce già l'area parte dal mini-pack; per il
testo pieno apre la skill d'area. I LOCK hanno **un solo master** (skill/context): il mini-pack li
cita per nome+link, non li duplica.

| Area | Mini-pack (ingresso) | Skill piena |
|------|----------------------|-------------|
| {{area}} | `aree/{{AREA}}_MINI.md` | `aree/{{AREA}}_SKILL.md` |

> Aggiungi una riga qui ogni volta che crei un mini-pack (vedi `MANUALE_AVVIO.md` passo 4-bis).
> Se nessuna area ha ancora un mini-pack, lascia la tabella vuota: è un tier opzionale.

### 0.1 Le parole battono le frasi

I trigger della tabella sotto sono il riferimento rapido. La **fonte autorevole** (con livello
di libertà e comportamento) è `comunicazione/VOCABOLARIO.md`.

- Dove esiste una **parola Liv. 1** che mappa una zona → usala come trigger (meno testo, meno
  fraintendimenti).
- Dove non c'è ancora una parola → si tiene la **frase-trigger descrittiva**, finché l'agente
  Meta non conia la parola (è un suo compito esplicito — vedi `comunicazione/REVISIONE.md`).

---

## 0.2 Tabella di routing

Leggi il task e applica questa tabella. Carica il file indicato **prima** di aprire qualsiasi
file da modificare.

| Il task riguarda… (parola di vocabolario o frase-trigger) | File da caricare |
|-----------------------------------------------------------|------------------|
| {{zona_1 — es. «pagina X»}} | `context/{{X}}_CONTEXT.md` ⚠️ {{OBBLIGATORIO se LOCK}} |
| {{zona_2}} | `context/{{Y}}_CONTEXT.md` |
| {{DB / schema / migrazioni}} | `aree/DB_SKILL.md` |
| {{Test / CI}} | `aree/TESTING_SKILL.md` |
| {{Come rispondere / report / vocabolario}} | `comunicazione/COMUNICAZIONE_SKILL.md` |
| {{Affinare il sistema / promuovere voci}} | `comunicazione/REVISIONE.md` (sessione dedicata) |
| **Non è chiaro di quale area si tratti** | **Fermati e chiedi — NON indovinare** (vedi §0.3) |

> **Regola sub-task:** ogni volta che scomponi il lavoro in sotto-task, **ripeti questa domanda**
> per ciascuno — rivalutando sia il profilo (§0.0) sia la riga di routing. «L'ho già letto
> all'inizio» non basta se il sotto-task cambia zona o profilo.

### 0.3 Regola anti-buco (la rete di sicurezza)

Se **nessuna riga** della tabella matcha il task, o matchano **più righe in conflitto**:
1. **Non indovinare** quale file caricare.
2. Fai una domanda breve all'utente per disambiguare la zona.
3. Se emerge una zona nuova non mappata → segnalala come candidata in `comunicazione/PROPOSTE.md`.

Questo elimina il rischio «agente sceglie male»: la scelta non è mai a giudizio libero, è un
match esplicito; in assenza di match, si chiede.

---

## 1. Mappa del progetto

{{Descrizione sintetica delle aree principali. Es. tabella area → entry point → note.}}

| Area | Entry point | Note |
|------|-------------|------|
| {{area}} | {{file}} | {{nota}} |

---

## 2. Invarianti globali — valgono in ogni task, in ogni file

```
LOCK  {{file_critico_1}}   — {{motivo}} — mai toccare senza permesso
LOCK  {{file_critico_2}}   — {{motivo}}
```

> Per i file LOCK l'agente DEVE: (1) leggere prima tutti i file collegati per capire l'impatto;
> (2) identificare i conflitti; (3) procedere solo se la modifica preserva l'integrità
> strutturale e i contratti esistenti. Se viola un invariante documentato → discutere con
> l'utente prima.

### RULE globali (valgono ovunque — non spostare nei context)

```
RULE  Leggere INTERO il file da toccare + i file collegati prima di editare.
      Mai editare avendo letto solo il frammento di una ricerca.
RULE  Anti-duplicazione: prima di scrivere un helper, cerca se esiste già. Se compare in 2+
      file → estrai in una utility condivisa.
RULE  Logger: usa il logger del progetto, mai console.log in codice di produzione.
RULE  {{altre RULE globali del progetto}}
```

---

## 3. Struttura cartelle

```
{{albero sintetico di src/ e docs/}}
```

> Regola: le **skill** stanno in {{casa skill}}. Il **privato** sta in {{cartella gitignored}}
> e NON è contesto obbligatorio per gli agenti. Vedi `REGOLE_ORGANIZZATIVE.md`.

---

## 4. Comandi principali

```bash
{{comando_dev}}        # dev server
{{comando_validate}}   # lint + typecheck + test (pre-PR)
{{...}}
```

---

## 5. Obbligo inizio e fine sessione

- **A inizio sessione**, l'agente carica `comunicazione/COMUNICAZIONE_SKILL.md` e — se userà il
  vocabolario o farà domande — mostra all'utente la **checklist di apertura** (per allinearsi
  entrambi allo skill system). Vedi quella skill, §«Checklist apertura».
- **A fine sessione** (se l'utente conferma successo), l'agente esegue il protocollo di chiusura
  **secondo la modalità del task** (§6): report in `sessioni/`, aggiornamento `SESSION_LOG.md` +
  `FOLLOW_UP.md`, raccolta dati comunicazione, e checklist di chiusura. **Fonte unica della fase
  fine-chat:** `comunicazione/CHIUSURA_SESSIONE.md` (Parte A = come compilare il report; Parte B =
  commit/push/branch/DB/terminali) — il §6 qui sopra dice il QUANDO, quella guida il COME. Lo stile
  di risposta sta in `comunicazione/COMUNICAZIONE_SKILL.md`; il modello in `sessioni/_TEMPLATE_REPORT.md`.
  Se il progetto ha installato l'hook `stop` (`hooks/`), a fine chat ti rilancia per completare il report.
- **(Opzionale, SOLO profilo Meta/senior) Sottosistema didattico:** se attivo, **prima** del report
  l'agente senior chiede la lezione all'utente — vedi `comunicazione/CHIUSURA_SESSIONE.md` §8-bis (fonte
  unica; questa riga rimanda, non duplica). È **governance soft**, non un hook. Gli agenti di lavoro
  normali (Esecuzione/Verifica) **non** danno lezioni.

> ⚠️ TEMPORANEA (rimuovere quando {{il sistema è rodato}}): {{eventuali regole iniziali di
> raccolta dati extra}}.

---

## 6. Peso della sessione: light / standard / deep

Non tutti i task meritano lo stesso protocollo. Senza questa distinzione il sistema diventa
**burocratico**: un fix da due righe paga lo stesso costo di chiusura di una feature strutturale.
Ogni task ha una **modalità** che decide quanto del § 5 (chiusura) si applica.

**Chi la decide:** se esiste un agente di consulto a monte (tipo «prepara prompt»), la classifica
lui e la scrive nel prompt come prima riga (`Modalità: standard`). Altrimenti la deduce l'agente di
lavoro all'avvio, dai trigger sotto. È una classificazione **interna**: l'utente non deve dire
nessuna parola.

| Modalità | Quando | Chiusura (§ 5) |
|----------|--------|----------------|
| **light** | fix piccolo, 1 file/zona, basso rischio, nessun trigger deep | **niente file report** → 1 riga in `SESSION_LOG.md`; no Dati comunicazione; aggiorni una skill solo se l'hai toccata |
| **standard** | feature o fix normale, una zona | report normale + Dati comunicazione; allinea le skill delle aree toccate |
| **deep** | vedi trigger | protocollo completo: report esaustivo + Derivazione errori + follow-up + allineamento skill |

**Trigger DEEP obbligatori** (basta uno, a prescindere dalla dimensione apparente):
- {{DB / migrazioni / produzione / sicurezza-RLS}} — dove un errore costa caro;
- **file LOCK / invarianti** (§4);
- **più di una view / un nuovo componente o comportamento**;
- {{auth / login / pagamenti}} — flussi identità e commerciali.

Se nessun trigger scatta: **light** se è davvero piccolo, altrimenti **standard**. Nel dubbio fra due
livelli, scegli il più alto.

> **L'agente di lavoro può solo ALZARE la modalità in corsa, mai abbassarla.** Se un task
> `light`/`standard` si rivela più rischioso (scopre un LOCK, tocca il DB, serve una seconda view),
> **sale** al livello superiore e lo segnala nel report. Nel dubbio ci si protegge.

> **Per gli agenti Meta** (chi mantiene questo skill system): la modalità è la **prima difesa contro
> la burocrazia**. Quando aggiungi una nuova procedura obbligatoria di apertura/chiusura, chiediti
> sempre «vale per tutte e tre le modalità o solo deep?» — la maggior parte va su deep, non su light.
> Adatta i trigger `{{...}}` alle zone sensibili del progetto reale al momento dell'avvio.
