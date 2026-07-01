// Entry point del server: avvia l'app Express sulla porta da .env (default 3001).
// Carica .env.local dalla root del monorepo (chiavi AI + Supabase: solo lato server).
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../..');
try {
  process.loadEnvFile(join(rootDir, '.env.local'));
} catch {
  // In produzione/CI le variabili arrivano già dall'ambiente: nessun file da caricare.
}

const PORT = process.env.PORT || 3001;

const app = createApp();

app.listen(PORT, () => {
  // Messaggio di avvio (boot). Il logger di progetto arriverà con il codice runtime.
  console.log(`[server] FREEDOM TRADING SYSTEM in ascolto su http://localhost:${PORT}`);
});
