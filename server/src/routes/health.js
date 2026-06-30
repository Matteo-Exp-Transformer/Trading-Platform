// Rotta di health-check. Nessun segreto, nessuna dipendenza esterna.
import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'freedom-trading-system', ts: new Date().toISOString() });
});
