# VOCABOLARIO — la bibbia comunicativa e di orientamento

> **Una sola bibbia, due funzioni.** Sezione A = come ti comporti (lessico-comando). Sezione B =
> cosa intende l'utente quando nomina una zona dell'app (lessico-mappa → orientamento routing).
> Non esistono due vocabolari separati: il confine tra «parola di comunicazione» e «parola di
> codice» è sfumato (es. «finestra di conferma» è entrambe). Un file, due sezioni.

> **Regola d'oro:** qui entrano **solo voci approvate dall'utente**. L'agente non aggiunge mai
> nulla in autonomia. Le candidate vivono in [PROPOSTE.md](PROPOSTE.md) finché non sono approvate.

A inizio sessione l'agente legge questo file. Quando l'utente usa una voce mappata, l'agente si
comporta in base al **livello di libertà**.

---

## Livelli di libertà

| Liv. | Nome | Comportamento agente | Default |
|------|------|----------------------|---------|
| **1** | **Automatico** | Applica subito, senza chiedere. Regola consolidata. | agisce |
| **2** | **Con cautela** | Applica, **ma** se il contesto è ambiguo → una domanda preventiva breve. | agisce, salvo dubbio |
| **3** | **Conferma** | Chiedi **sempre** conferma, **a meno che** la frase sia identica a un caso già registrato come ok. | chiede |

**Liv. 2 vs 3:** al Liv. 2 parti da «agisco» e ti fermi solo se hai un dubbio reale. Al Liv. 3
parti da «chiedo» e procedi solo se il match è netto. Nel dubbio → metti 3, lo abbassi dopo.

### Le voci Liv. 2 raccolgono dati

Quando l'agente di lavoro applica una voce Liv. 2, **aggiorna il campo `Dati Liv.2`** con una riga
`GG-MM-AA · esito`:
- applicata e **andava bene** → segnale di promozione → Liv. 1;
- domanda preventiva **superflua** («sì ovvio») → segnale di promozione;
- applicata ma **corretta dall'utente** → segnale di regressione → Liv. 3.

L'agente di lavoro **non decide** promozione/regressione: scrive solo i dati. Decide l'agente
**Meta** in sessione separata (vedi `REVISIONE.md`).

---

## Formato di una voce

```
### «frase o parola chiave» — Liv. N
- **Intende:** l'intento implicito dell'utente
- **Comportamento agente:** cosa deve fare l'agente
- **Livello:** 1 | 2 | 3 (+ nota se in prova)
- **Casi identici già ok:** (Liv. 3) frasi esatte su cui procedere senza chiedere
- **Dati Liv.2:** (solo Liv. 2) righe `GG-MM-AA · esito`
- **Approvata il:** GG-MM-AA
- **Origine:** report/chat da cui è nata
```

---

# SEZIONE A — Lessico-comando (come ti comporti)

> Le parole ricorrenti dell'utente → comportamento dell'agente. Parti da poche voci e fai
> crescere il file dall'uso.

### «{{parola — es. lavoro ok}}» — Liv. {{N}}
- **Intende:** {{...}}
- **Comportamento agente:** {{...}}
- **Livello:** {{N}}
- **Casi identici già ok:** —
- **Approvata il:** {{GG-MM-AA}}
- **Origine:** {{...}}

<!-- Aggiungi qui le voci comando. Esempi tipici da coniare con l'utente:
     - GRILLETTI DI PROFILO (avvio chat): una parola per «esecuzione» (scrivi codice), una per
       «verifica» (controlla/testa), una per «prepara» (prompt ottimizzato, NON eseguire), una per
       «meta revisore» (rifinisci sistema) e una per «meta senior» (evolvi il sistema). Tienili in una
       Rule SEMPRE-ATTIVA della piattaforma (vedi sotto), non solo qui: vanno noti a inizio chat prima
       di sapere il task, altrimenti l'agente non li riconosce (problema cane-che-si-morde-la-coda).
     - DISTINZIONE scrittura-report vs chiusura (consigliata): una parola tipo «lavoro ok» = task
       accettato + SCRIVI il report COMPLETO (lavoro + comunicazione + dati qualità come versione
       dell'agente, NON voto sintetico). Una parola diversa tipo «report finale» = capitolo chiuso →
       controlla che il report sia allineato al codice, poi COMMIT + PUSH. Tenerle separate evita
       report «a metà» e confusione tra «ho finito di scrivere» e «pubblica».
     - una parola per «spiegamelo semplice, no gergo».
     - una parola per «passa il lavoro a un'altra chat» (prompt di proseguimento / follow-up).

     NOTA PIATTAFORMA — i grilletti vanno SEMPRE nel contesto, non on-demand:
     se la piattaforma distingue Rules (sempre caricate) da Skills (on-demand), metti i grilletti
     in una RULE always-on (es. Cursor: `.cursor/rules/*.mdc` con `alwaysApply: true`); il vocabolario
     completo resta una Skill caricata quando serve applicare le sfumature. Vedi EVOLUZIONE_SKILLS
     (leve di enforcement). -->

---

# SEZIONE B — Lessico-mappa (orientamento nell'app)

> Le parole dell'utente per le **zone del progetto** → quale file di contesto caricare. Queste
> voci **alimentano i trigger** della tabella di routing nella Bussola. Aiutano l'agente a non
> confondere zone simili.
>
> **Compito dell'agente Meta:** quando una zona è instradata solo da una frase-trigger lunga,
> coniare con l'utente una parola breve e registrarla qui, poi aggiornare la routing. Vedi
> `REVISIONE.md`.

### «{{parola-zona — es. pagina Home}}» — Liv. {{N}}
- **Punta a:** {{quale zona/route/componente}}
- **Comportamento agente:** carica `context/{{ZONA}}_CONTEXT.md` (+ eventuali skill d'area)
- **Livello:** {{N}}
- **Approvata il:** {{GG-MM-AA}}
- **Origine:** {{...}}

<!-- Una voce per ogni grande zona del progetto. Tieni l'allineamento con la tabella di routing
     della Bussola: ogni parola-mappa Liv.1 dovrebbe comparire come trigger lì. -->

---

## Regola di fallback lessico (salvaguardia fase di test)

<!-- Per disattivarla (sistema meno rigido) cancella questo blocco. -->

Quando il lessico non basta, catena a gradini:
1. C'è una voce **Liv. 1** pertinente → usala, senza chiedere.
2. C'è solo una **Liv. 2** → se hai dubbi sul contesto, chiedi; altrimenti applicala.
3. Resta solo una **Liv. 3** → chiedi sempre, salvo match identico a un caso già ok.
4. **Nessuna informazione** → fai domande per **definire parole nuove** (a opzioni/sì-no). Quando
   l'utente concorda una parola e il livello, **salvala subito** qui (è approvazione esplicita).

> ⚠️ TEMPORANEA (rimuovere quando il sistema è rodato e l'utente vuole un approccio meno rigido):
> questa regola di fallback.
