// Carica .env.local dalla root del monorepo per i test in locale.
// In CI le variabili arrivano dall'ambiente: il blocco catch è silenzioso.
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../..');
try {
  process.loadEnvFile(join(rootDir, '.env.local'));
} catch {
  // variabili già in process.env (CI) oppure .env.local assente
}
