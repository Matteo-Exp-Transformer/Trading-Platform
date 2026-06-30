#!/usr/bin/env node
/**
 * Hook `Stop` di Claude Code — Nudge fine-sessione SENIOR (gemello di `fine-sessione-nudge.mjs`).
 * ─────────────────────────────────────────────────────────────────────────
 * TEMPLATE v.0 — hook AVANZATO / OPZIONALE. Serve SOLO se il progetto adotta il ruolo
 * «Meta senior» (chi fa evolvere lo skill system). Per i progetti che usano solo gli agenti
 * di lavoro basta `fine-sessione-nudge.mjs` (Cursor). Questo è il gemello Claude Code, con
 * 2 promemoria in più specifici del senior. Se non usi il ruolo senior, NON installarlo.
 *
 * SCOPO: identico al nudge v4 — controllare la sezione «Domande di chiusura» (§11) dei report
 * freschi. Le domande a risposta obbligata sostituiscono il vecchio controllo sui titoli.
 *   - risposta mancante/placeholder → blocca con elenco mirato (quali R vuote).
 *   - sezione 11 assente → chiede l'intera sezione.
 *   - tutte presenti → rilancio LEGGERO 1× (verifica incongruenze) + 2 punti SENIOR.
 *   - nessun report fresco → silenzio.
 *
 * v5 (05-06-26) — l'hook murava l'AVVIO di una nuova chat per un report di un'ALTRA sessione ancora
 * "fresco" per mtime nella finestra di 20 min. Deve guardare SOLO un report NUOVO e recente di OGGI:
 *   1. DOPPIO FILTRO «report di questa sessione»: data di OGGI (cartella giorno `DD-MM-YY`) E mtime
 *      negli ultimi 20 min. Il mtime da solo è fragile (un vecchio report ri-toccato dal filesystem
 *      rientrava); il filtro giorno lo scarta a monte.
 *   2. SOLO IL REPORT PIÙ RECENTE tra quelli freschi di oggi = la chat che si sta chiudendo.
 *   3. MENO FALSI «risposta vuota»: una risposta vale se ha ≥3 caratteri alfanumerici (isSubstantive).
 *
 * DIFFERENZE da Cursor (sintassi piattaforma Claude Code):
 *  - guardia anti-loop: `stop_hook_active` (bool) invece di `loop_count`. true = già nel rilancio.
 *  - output: `{"decision":"block","reason":"…"}` (+ exit 0). Il reason torna come nuovo turno.
 *    exit 0 senza `decision` = lascia chiudere.
 *
 * INSTALLAZIONE: registralo in .claude/settings.local.json sotto hooks.Stop.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, sep, relative } from 'node:path'

// ╔══════════════════════════ CONFIG ══════════════════════════╗
const REPORTS_DIR = ['docs', 'Sessioni di lavoro']
const CHIUSURA_DOC = 'docs/comunicazione/CHIUSURA_SESSIONE.md'
const EVOLUZIONE_DOC = 'docs/comunicazione/EVOLUZIONE_SKILLS.md'
const TEMPLATE_V0_DIR = '_skill-system-v0/'
const RECENT_MINUTES = 20
// ╚═════════════════════════════════════════════════════════════╝

const QUESTION_RE = /^[\s>\-*]*❓\s*Q\s*(\d+)?/i
const ANSWER_RE = /^[\s>\-*]*✅\s*R\s*(\d+)?\s*:?(.*)/i
const PLACEHOLDER_RE = /^[\s\-–—_.·•]*$|^(todo|tbd|n\/?a|\.\.\.|_+)$/i
/** Una risposta vale se ha ≥3 caratteri alfanumerici: evita falsi «risposta vuota» su risposte
 *  brevi ma legittime. */
function isSubstantive(txt) {
  const alnum = (txt.match(/[\p{L}\p{N}]/gu) || []).length
  return alnum >= 3
}

/** Data di OGGI in `DD-MM-YY` = il nome delle cartelle giorno. Filtro su giorno + mtime: un report
 *  conta solo se è di oggi E toccato di recente, così un vecchio report ri-toccato non mura l'avvio. */
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

function parseInput(stdinRaw) {
  try {
    const p = JSON.parse(stdinRaw)
    return {
      root: typeof p.cwd === 'string' ? p.cwd : process.cwd(),
      alreadyActive: p.stop_hook_active === true,
    }
  } catch {
    return { root: process.cwd(), alreadyActive: false }
  }
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
    // oggi, anche se "fresco" per mtime. Primo dei due filtri.
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
      const full = join(dayPath, f.name)
      try {
        const mtimeMs = statSync(full).mtimeMs
        if (mtimeMs >= cutoff) out.push({ full, mtimeMs })
      } catch {
        /* sparito */
      }
    }
  }
  // Solo il report PIÙ RECENTE tra i freschi di oggi = la chat che si sta chiudendo.
  if (out.length === 0) return []
  out.sort((a, b) => b.mtimeMs - a.mtimeMs)
  return [out[0].full]
}

/** Identico al gemello: { hasSection, unanswered: [labels] }. */
function auditQuestions(content) {
  const lines = content.split(/\r?\n/)
  const questions = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(QUESTION_RE)
    if (m) questions.push({ idx: i, num: m[1] || String(questions.length + 1) })
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

function block(reason) {
  process.stdout.write(JSON.stringify({ decision: 'block', reason }))
  process.exit(0)
}
function pass() {
  process.exit(0)
}

async function main() {
  const stdinRaw = await readStdin().catch(() => '')
  const { root, alreadyActive } = parseInput(stdinRaw)

  if (alreadyActive) pass() // guardia anti-loop: già nel turno rilanciato → lascia chiudere

  const recentReports = findRecentReports(root)
  if (recentReports.length === 0) pass()

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

  // CASO A: risposte mancanti o sezione 11 assente → blocca con elenco mirato.
  if (missing.length || noSection.length) {
    const lines = ['⚠️ FINE-SESSIONE SENIOR — sezione «Domande di chiusura» (§11) incompleta:', '']
    for (const r of noSection) {
      lines.push(`  • ${relative(root, r.path).split(sep).join('/')}`)
      lines.push('    manca l\'INTERA sezione 11 (6 domande ❓Q + ✅R). Aggiungila e rispondi.')
    }
    for (const r of missing) {
      lines.push(`  • ${relative(root, r.path).split(sep).join('/')}`)
      lines.push(`    risposte vuote: ${r.unanswered.join(' · ')} — compilale (no «...», no «TODO», no vuoto).`)
    }
    lines.push('')
    lines.push(`Domande in ${CHIUSURA_DOC} §11 — formato \`❓ Q… / ✅ R…\`.`)
    lines.push('Per Q2 (dati=diff) e Q3 (file correlati) DEVI rileggere diff e file prima di rispondere.')
    lines.push('Compila le risposte mancanti, poi conferma in 1 riga.')
    block(lines.join('\n'))
  }

  // CASO B: tutte presenti → rilancio leggero (verifica incongruenze) + 2 punti SENIOR.
  const ok = [
    `📄 FINE-SESSIONE SENIOR — ${reports.length} report, domande compilate. Controllo a mente fredda:`,
    '',
    '  • I DATI del report corrispondono al DIFF reale? (no copie a memoria)',
    '  • I FILE CORRELATI (skill area, context, test, tipi) sono allineati? (caso E-A)',
    '  • Le risposte Q1-Q6 sono coerenti tra loro e col lavoro svolto?',
    '',
    'PRATICHE SENIOR (facili da dimenticare a fine chat lunga):',
    `  • Propagati gli upgrade STRUTTURALI nel template v.0 \`${TEMPLATE_V0_DIR}\`? (gitignored: NON committare, ma elenca nel report cosa hai toccato.)`,
    `  • Aggiornato il PLAYBOOK in ${EVOLUZIONE_DOC} se hai imparato un metodo nuovo?`,
    '',
    'Se hai già fatto tutto: confermalo punto per punto e chiudi.',
  ]
  block(ok.join('\n'))
}

main()
