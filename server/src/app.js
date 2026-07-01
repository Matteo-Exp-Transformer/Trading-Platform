// Express app factory. Separato da index.js per poterlo testare senza aprire una porta.
import express from 'express';
import { healthRouter } from './routes/health.js';
import { agentRouter } from './routes/agent.js';

export function createApp() {
  const app = express();
  // Le immagini (screenshot) viaggiano inline in base64 nel primo turno: alziamo il limite.
  app.use(express.json({ limit: '25mb' }));

  // Endpoint di servizio: verifica che il server sia vivo.
  app.use('/api', healthRouter);
  // Catena agente: prima analisi reale + follow-up.
  app.use('/api/agent', agentRouter);

  // Gestione errori centralizzata: mai un'eccezione non gestita verso l'utente (RULE prodotto).
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    if (err?.type === 'entity.too.large') {
      return res
        .status(413)
        .json({ error: 'Gli screenshot sono troppo grandi. Riduci la dimensione e riprova.' });
    }
    console.error('[server] errore non gestito:', err?.message);
    return res.status(500).json({ error: 'Errore interno del server.' });
  });

  return app;
}
