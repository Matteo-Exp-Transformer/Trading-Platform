#!/usr/bin/env node
/**
 * Hook `stop` di Cursor — Nudge fine-sessione per lo skill system comunicazione.
 * ─────────────────────────────────────────────────────────────────────────
 * TEMPLATE v.0 — versione GENERICA (v5). Funziona così com'è se segui la struttura
 * cartelle del template: report in `docs/Sessioni di lavoro/GG-MM-AA/Report-*.md`,
 * sezione 11 «Domande di chiusura» in `docs/comunicazione/CHIUSURA_SESSIONE.md`.
 * Se cambi quei percorsi, aggiorna le costanti in « CONFIG » sotto.
 *
 * SCOPO: i report di fine chat erano superficiali — sezioni presenti ma vuote, dati non allineati al
 * diff reale. Le versioni v1-v3 controllavano la PRESENZA DEL TITOLO di una sezione: un titolo con
 * sotto il vuoto passava. Debole.
 *
 * v4 — DA «titolo presente» A «risposta presente». Il report contiene la sezione 11 «Domande di
 * chiusura»: 6 domande marcate `❓ Q…` con una riga risposta `✅ R…`. L'hook estrae ogni coppia e
 * verifica che la risposta NON sia vuota/placeholder.
 *   - risposta mancante → rilancia un turno MIRATO (quali R sono vuote) e CHIEDE di compilarle.
 *     BLOCCA la chiusura finché non sono compilate (loop_limit in hooks.json è la rete dura).
 *   - tutte presenti → rilancio LEGGERO 1× : rileggi a mente fredda, verifica dati e file correlati.
 *   - nessun report fresco → silenzio.
 *
 * PERCHÉ le domande-a-risposta invece del titolo: per rispondere a Q2 (dati=diff?) e Q3 (file
 * correlati) l'agente DEVE rileggere il diff e i file → la verifica intelligente la fa lui (l'hook
 * non vede il diff), l'hook controlla solo che abbia risposto. Meccanismo forte senza agente-revisore.
 *
 * GUARDIA ANTI-LOOP: `loop_count` (Cursor, parte da 0). Caso «tutte presenti»: 1 rilancio basta
 * (loop_count>=1 → tace). Caso «mancanti»: ricontrolla lo stato — se l'agente ha compilato si passa
 * al ramo leggero; se ignora, `loop_limit` in hooks.json impedisce il loop infinito.
 *
 * v5 — tre tarature per non insistere troppo e su troppi report:
 *   1. SOLO IL REPORT PIÙ RECENTE (`findRecentReports` ritorna 1 solo file): non blocca la chiusura
 *      di questa chat per una R vuota in un report di un'altra sessione toccato nella stessa finestra.
 *   2. TETTO DURO A 3 NUDGE (`if (loopCount >= 3) return`), su qualsiasi ramo.
 *   3. MENO FALSI «mancante»: `PLACEHOLDER_RE` non scarta le risposte brevi fra parentesi; una
 *      risposta vale se ha ≥3 alfanumerici (`isSubstantive`). La revisione del CONTENUTO la fa
 *      l'agente (self-review §12 di CHIUSURA_SESSIONE + sub-agente CONTROVERIFICA), non l'hook.
 *
 * LIMITE NOTO: gli hook `stop` NON girano sui Cloud Agents (solo IDE locale). Fallback Cloud =
 * checklist-di-chiusura nel prompt esecutore.
 *
 * INSTALLAZIONE: referenzialo in hooks.json sotto "stop" (con `loop_limit: 3`).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, sep, relative } from 'node:path'

// ╔══════════════════════════ CONFIG ══════════════════════════╗
/** Cartella dei report di sessione (relativa alla root del repo). */
const REPORTS_DIR = ['docs', 'Sessioni di lavoro']
/** File che contiene le «Domande di chiusura» (citato nei messaggi). */
const CHIUSURA_DOC = 'docs/comunicazione/CHIUSURA_SESSIONE.md'
/** Finestra entro cui un report è «di questa sessione» (minuti). */
const RECENT_MINUTES = 20
// ╚═════════════════════════════════════════════════════════════╝

const EXCLUDE_REPORT = null

/** Marca una domanda di chiusura: `❓ Q1 — …` a INIZIO riga (con eventuale spazio o bullet markdown).
 *  L'ancora `^[\s>\-*]*` evita che un `❓Q` CITATO in mezzo a una risposta venga scambiato per nuova domanda. */
const QUESTION_RE = /^[\s>\-*]*❓\s*Q\s*(\d+)?/i
const ANSWER_RE = /^[\s>\-*]*✅\s*R\s*(\d+)?\s*:?(.*)/i
/** Placeholder secco (vuoto, soli trattini, todo/tbd/n.a./puntini). NON conta come vuota una risposta
 *  breve fra parentesi tipo «nessuno (nessuna skill copre il componente)» — era un falso «mancante». */
const PLACEHOLDER_RE = /^[\s\-–—_.·•]*$|^(todo|tbd|n\/?a|\.\.\.|_+)$/i
/** Una risposta vale se ha almeno qualche carattere di sostanza (≥3 alfanumerici). */
function isSubstantive(txt) {
  return (txt.match(/[\p{L}\p{N}]/gu) || []).length >= 3
}

/** Data di OGGI in `DD-MM-YY` = il nome delle cartelle giorno. Secondo filtro accanto al mtime:
 *  un report conta solo se è di oggi E recente. Il mtime da solo non basta — un vecchio report
 *  ri-toccato dal filesystem rientrava nella finestra e murava l'AVVIO di una chat di un altro giorno. */
function todayFolder() {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${dd}-${mm}-${yy}`
}

function readStdin() {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (c) => (data += c))
    process.stdin.on('end', () => resolve(data))
    setTimeout(() => resolve(data), 500)
  })
}

function resolveRoot(stdinRaw) {
  try {
    const p = JSON.parse(stdinRaw)
    const r = p.workspace_root || p.workspaceRoot || p.cwd || p.root
    if (r && typeof r === 'string') return r
  } catch {
    /* cwd */
  }
  return process.cwd()
}

function resolveLoopCount(stdinRaw) {
  try {
    const p = JSON.parse(stdinRaw)
    if (typeof p.loop_count === 'number') return p.loop_count
  } catch {
    /* 0 */
  }
  return 0
}

function findRecentReports(root) {
  const base = join(root, ...REPORTS_DIR)
  const cutoff = Date.now() - RECENT_MINUTES * 60_000
  const today = todayFolder()
  const out = []
  let dayDirs
  try {
    dayDirs = readdirSync(base, { withFileTypes: true })
  } catch {
    return out
  }
  for (const day of dayDirs) {
    if (!day.isDirectory()) continue
    // Solo la cartella di OGGI: un report di un altro giorno non scatta all'avvio di una chat di
    // oggi, anche se "fresco" per mtime. Primo dei due filtri (v5.1, 05-06-26).
    if (day.name !== today) continue
    const dayPath = join(base, day.name)
    let files
    try {
      files = readdirSync(dayPath, { withFileTypes: true })
    } catch {
      continue
    }
    for (const f of files) {
      if (!f.isFile() || !/^Report-.*\.md$/i.test(f.name)) continue
      if (EXCLUDE_REPORT && EXCLUDE_REPORT.test(f.name)) continue
      const full = join(dayPath, f.name)
      try {
        const mtimeMs = statSync(full).mtimeMs
        if (mtimeMs >= cutoff) out.push({ full, mtimeMs })
      } catch {
        /* sparito */
      }
    }
  }
  // Solo il report PIÙ RECENTE = la chat che si sta chiudendo. Evita che una R vuota in un report di
  // un'altra sessione (toccato nella stessa finestra di 20 min) blocchi la chiusura di questa.
  if (out.length === 0) return []
  out.sort((a, b) => b.mtimeMs - a.mtimeMs)
  return [out[0].full]
}

/** Estrae lo stato delle domande di chiusura di un report. Ritorna { hasSection, unanswered: [labels] }. */
function auditQuestions(content) {
  const lines = content.split(/\r?\n/)
  const questions = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(QUESTION_RE)
    if (m) {
      const num = m[1] || String(questions.length + 1)
      const label = lines[i].replace(/❓\s*/, '').trim().slice(0, 60)
      questions.push({ idx: i, num, label })
    }
  }
  if (questions.length === 0) return { hasSection: false, unanswered: [] }

  const unanswered = []
  for (let q = 0; q < questions.length; q++) {
    const start = questions[q].idx
    const end = q + 1 < questions.length ? questions[q + 1].idx : lines.length
    let answerText = null
    for (let i = start; i < end; i++) {
      const a = lines[i].match(ANSWER_RE)
      if (!a) continue
      let txt = (a[2] || '').trim()
      if (!txt) {
        for (let j = i + 1; j < end; j++) {
          if (QUESTION_RE.test(lines[j]) || ANSWER_RE.test(lines[j])) break
          if (lines[j].trim()) {
            txt = lines[j].trim()
            break
          }
        }
      }
      answerText = txt
      break
    }
    if (answerText === null || PLACEHOLDER_RE.test(answerText) || !isSubstantive(answerText)) {
      unanswered.push(`Q${questions[q].num}`)
    }
  }
  return { hasSection: true, unanswered }
}

function send(obj) {
  process.stdout.write(JSON.stringify(obj))
  process.exit(0)
}

async function main() {
  const stdinRaw = await readStdin().catch(() => '')
  const root = resolveRoot(stdinRaw)
  const loopCount = resolveLoopCount(stdinRaw)

  // Tetto DURO: max 3 nudge in assoluto, su QUALSIASI ramo. Anche se restano risposte vuote, dopo
  // 3 rilanci l'hook tace e non muri la chiusura all'infinito (rende vero il limite anche sul ramo
  // «mancanti», che altrimenti dipenderebbe solo da loop_limit in hooks.json).
  if (loopCount >= 3) return send({})

  const recentReports = findRecentReports(root)
  if (recentReports.length === 0) return send({})

  const reports = recentReports.map((path) => {
    let content = ''
    try {
      content = readFileSync(path, 'utf8')
    } catch {
      /* vuoto */
    }
    return { path, ...auditQuestions(content) }
  })

  const missing = reports.filter((r) => r.hasSection && r.unanswered.length)
  const noSection = reports.filter((r) => !r.hasSection)

  // CASO A: risposte MANCANTI o sezione 11 ASSENTE → blocca/insiste.
  if (missing.length || noSection.length) {
    const lines = ['⚠️ FINE-SESSIONE — la sezione «Domande di chiusura» (§11) non è completa:', '']
    for (const r of noSection) {
      lines.push(`  • ${relative(root, r.path).split(sep).join('/')}`)
      lines.push('    manca l\'INTERA sezione 11 «Domande di chiusura» (le 6 domande ❓Q + ✅R). Aggiungila e rispondi.')
    }
    for (const r of missing) {
      lines.push(`  • ${relative(root, r.path).split(sep).join('/')}`)
      lines.push(`    risposte vuote: ${r.unanswered.join(' · ')} — compilale (no «...», no «TODO», no risposta vuota).`)
    }
    lines.push('')
    lines.push(`Le domande sono in ${CHIUSURA_DOC} §11 — formato \`❓ Q… / ✅ R…\`.`)
    lines.push('Per Q2 (dati=diff) e Q3 (file correlati) DEVI rileggere il diff e i file prima di rispondere: è il punto.')
    lines.push('Compila TUTTE le risposte mancanti, poi conferma in 1 riga che le hai scritte.')
    return send({ followup_message: lines.join('\n') })
  }

  // CASO B: tutte presenti. Rilancio LEGGERO una volta sola.
  if (loopCount >= 1) return send({})

  const ok = [
    `📄 FINE-SESSIONE — ${reports.length} report, domande di chiusura compilate. Ultimo controllo a mente fredda:`,
    '',
    '  • I DATI del report (numeri, file, valori) corrispondono al DIFF reale? (no copie a memoria)',
    '  • I FILE CORRELATI (skill area, context, test, tipi) sono allineati alla modifica? (caso E-A)',
    '  • Le risposte Q1-Q6 sono coerenti tra loro e col lavoro svolto?',
    '',
    'Se trovi un disallineamento → correggilo ora. Poi conferma in 2 righe cosa hai verificato/corretto e chiudi.',
  ]
  return send({ followup_message: ok.join('\n') })
}

main()
