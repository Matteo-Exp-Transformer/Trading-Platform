// Express app factory. Separato da index.js per poterlo testare senza aprire una porta.
import express from 'express';
import { healthRouter } from './routes/health.js';

export function createApp() {
  const app = express();
  app.use(express.json());

  // Endpoint di servizio: verifica che il server sia vivo.
  app.use('/api', healthRouter);

  return app;
}
