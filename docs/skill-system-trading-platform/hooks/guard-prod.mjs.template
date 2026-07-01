#!/usr/bin/env node
/**
 * Hook `beforeMCPExecution` + `beforeShellExecution` di Cursor — GUARD PROD.
 * ─────────────────────────────────────────────────────────────────────────
 * TEMPLATE v.0 — versione GENERICA. Adatta i 4 valori in « CONFIG DA ADATTARE »
 * al tuo progetto prima di usarlo. Stessa logica del file reale, senza dati specifici.
 *
 * SCOPO: trasformare la regola di sicurezza prod da markdown (governance soft, dipende dalla
 * buona volontà dell'agente) a ENFORCEMENT vero. La macchina ferma l'azione e CHIEDE conferma
 * prima di una scrittura sul DB di PRODUZIONE.
 *
 * COSA RICONOSCE COME «PROD»:
 *  - Via MCP: il NOME del server MCP dice già l'ambiente (es. `…Supabase__*` = PROD vs
 *    `…Supabase_test__*` = TEST). Il nome del tool è la fonte di verità, non l'URL nel payload.
 *  - Via shell: comandi che applicano al remoto LINKATO (es. `supabase db push/reset`,
 *    `migration up`) — se il link locale punta a PROD, si chiede conferma per sicurezza.
 *
 * DECISIONE DI DESIGN: `permission: "ask"`, NON `deny`. Non vietare del tutto (a volte una
 * scrittura prod è legittima), ma non lasciarla passare silenziosa. `ask` ferma e mette la
 * palla all'utente.
 *
 * LIMITE NOTO: gli hook Cursor NON girano sui Cloud Agents (solo IDE locale). Sui Cloud Agent
 * resta la salvaguardia markdown (regola sicurezza PROD in comandi-base). Per Claude Code,
 * registra la stessa guardia come `PreToolUse` in settings.local.json.
 *
 * INSTALLAZIONE: referenzialo in hooks.json sotto "beforeMCPExecution" e "beforeShellExecution".
 */

import process from 'node:process'

// ╔══════════════════════════ CONFIG DA ADATTARE ══════════════════════════╗
// Sostituisci questi 4 valori con quelli del TUO progetto.
//
// 1) Come riconosci il server MCP di PRODUZIONE dal suo nome (regex).
//    Esempio progetto-madre: il server prod si chiamava «…Supabase__», il test «…Supabase_test__».
const PROD_MCP_RE = /(^|_)PROD_SERVER_NAME__/      // ⚠️ ADATTA: nome server MCP di produzione
const TEST_MCP_RE = /PROD_SERVER_NAME_test__/      // ⚠️ ADATTA: nome server MCP di test/staging
//
// 2) Comandi shell che applicano al DB remoto linkato (regex).
const SHELL_PROD_RE = /supabase\s+(db\s+(push|reset)|migration\s+up)/i   // ⚠️ ADATTA se usi altra CLI
//
// 3) (facoltativo) Etichetta dell'ambiente prod, solo per i messaggi.
const PROD_LABEL = 'PRODUZIONE'
// ╚═════════════════════════════════════════════════════════════════════════╝

/** Tool MCP che MUTANO dati o schema. Tutto il resto via MCP è lettura → passa. */
const MCP_WRITE_TOOLS = new Set([
  'apply_migration',
  'deploy_edge_function',
  'merge_branch',
  'reset_branch',
  'rebase_branch',
  'create_branch',
  'delete_branch',
])

/** execute_sql è ambiguo (lettura o scrittura). È scrittura se NON è un SELECT/EXPLAIN/SHOW puro. */
function sqlIsWrite(sql) {
  if (typeof sql !== 'string') return true // niente SQL leggibile → prudenza: trattalo come scrittura
  const head = sql.trimStart().slice(0, 12).toUpperCase()
  return !(head.startsWith('SELECT') || head.startsWith('EXPLAIN') || head.startsWith('SHOW') || head.startsWith('WITH'))
}

function readStdin() {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (c) => (data += c))
    process.stdin.on('end', () => resolve(data))
    setTimeout(() => resolve(data), 500) // fail-open
  })
}

/** Risposta che FERMA e chiede conferma. */
function ask(userMsg, agentMsg) {
  process.stdout.write(
    JSON.stringify({ permission: 'ask', user_message: userMsg, agent_message: agentMsg })
  )
  process.exit(0)
}

/** Risposta che lascia passare (nessun rumore). */
function allow() {
  process.stdout.write(JSON.stringify({ permission: 'allow' }))
  process.exit(0)
}

async function main() {
  let p
  try {
    p = JSON.parse(await readStdin())
  } catch {
    return allow() // payload illeggibile → fail-open: non bloccare il lavoro per un parse error.
  }

  // --- Ramo SHELL (beforeShellExecution) ---
  if (typeof p.command === 'string' && !p.tool_name) {
    if (SHELL_PROD_RE.test(p.command)) {
      return ask(
        `⛔ ${PROD_LABEL} — questo comando applica al DB remoto LINKATO (può essere produzione).\n` +
          `Comando: ${p.command}\n` +
          'Conferma solo se vuoi davvero scrivere in PRODUZIONE. In dubbio, annulla e verifica lo stato delle migrazioni.',
        `GUARD PROD: comando di scrittura sul DB remoto fermato. Conferma che la destinazione è quella voluta (PROD vs TEST) prima di procedere.`
      )
    }
    return allow()
  }

  // --- Ramo MCP (beforeMCPExecution) ---
  const tool = typeof p.tool_name === 'string' ? p.tool_name : ''
  if (!tool) return allow()

  if (TEST_MCP_RE.test(tool)) return allow()     // TEST → sempre ok, silenzio
  if (!PROD_MCP_RE.test(tool)) return allow()    // non è il MCP di PROD → non ci riguarda

  // Da qui: siamo sul MCP di PRODUZIONE. Scrittura?
  const bare = tool.split('__').pop() || ''

  if (bare === 'execute_sql') {
    const sql = p.tool_input && (p.tool_input.query || p.tool_input.sql)
    if (sqlIsWrite(sql)) {
      return ask(
        `⛔ ${PROD_LABEL} — stai per eseguire SQL che modifica il DB di PRODUZIONE.\n` +
          `SQL: ${typeof sql === 'string' ? sql.slice(0, 300) : '(non leggibile)'}\n` +
          'Conferma solo se è voluto su PROD. Per staging usa il MCP di test.',
        'GUARD PROD: SQL di scrittura su produzione fermato. Conferma o reindirizza sul MCP di test.'
      )
    }
    return allow() // SELECT puro → lettura, ok
  }

  if (MCP_WRITE_TOOLS.has(bare)) {
    return ask(
      `⛔ ${PROD_LABEL} — \`${bare}\` modifica il DB di PRODUZIONE.\n` +
        'Conferma solo se è voluto su PROD. Per staging usa il MCP di test.',
      `GUARD PROD: \`${bare}\` su produzione fermato. Conferma o reindirizza sul MCP di test.`
    )
  }

  // Lettura via MCP prod → ok.
  return allow()
}

main()
