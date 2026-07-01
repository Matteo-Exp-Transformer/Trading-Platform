// skillLoader — carica il kit Aware Trader (kit/ nella root del repo) come UNICO system prompt.
// Il kit è la parte FISSA e IDENTICA in testa alla chiamata: così il caching automatico di
// Gemini 2.5 si attiva da sé (la parte variabile — storia + domanda — arriva sempre dopo).
// LOCK: il kit è l'autorità del metodo, vive solo lato server, mai esposto al client.
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// server/src/agent -> server/src -> server -> root, poi /kit
const kitPath = path.resolve(__dirname, '..', '..', '..', 'kit');

let cache = null;

export async function loadSkillPrompt() {
  if (cache) return cache;

  const files = await fs.readdir(kitPath);
  const markdownFiles = files.filter((f) => f.toLowerCase().endsWith('.md')).sort();
  if (markdownFiles.length === 0) {
    throw new Error('Kit del metodo non trovato: nessun file .md in kit/.');
  }

  const blocks = [];
  for (const file of markdownFiles) {
    const text = await fs.readFile(path.join(kitPath, file), 'utf8');
    blocks.push(text.trim());
  }
  // Blocco fisso e identico: i singoli file hanno già i propri titoli "# NN — ...".
  cache = blocks.join('\n\n---\n\n');
  return cache;
}

// Solo per i test: azzera la cache del kit fra un caso e l'altro.
export function _resetSkillCache() {
  cache = null;
}
