import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const { mockRun, mockMaybeSingle, mockCreateClient } = vi.hoisted(() => ({
  mockRun: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockCreateClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }));
vi.mock('../src/agent/orchestrator.js', () => ({ runAnalysis: mockRun }));

import { createApp } from '../src/app.js';
import { messaggioErrore } from '../src/routes/agent.js';

beforeEach(() => {
  vi.clearAllMocks();
  // Catena ownership: from('chats').select('id').eq('id', id).maybeSingle()
  const eq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  mockCreateClient.mockReturnValue({ from });
  mockMaybeSingle.mockResolvedValue({ data: { id: 'chat-1' }, error: null });
  mockRun.mockResolvedValue({ text: 'Analisi in prosa', transcript: null });
});

describe('POST /api/agent/analyze', () => {
  const app = createApp();

  it('401 senza token', async () => {
    const res = await request(app).post('/api/agent/analyze').send({ chatId: 'chat-1' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Sessione/);
  });

  it('400 se manca chatId', async () => {
    const res = await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({});
    expect(res.status).toBe(400);
  });

  it('404 se la chat non è dell’utente (RLS torna vuoto)', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-altrui' });
    expect(res.status).toBe(404);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('200 happy path: restituisce testo + transcript dell’analisi', async () => {
    mockRun.mockResolvedValue({ text: 'Analisi in prosa', transcript: { asset: 'XAU/USD' } });
    const res = await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [] });
    expect(res.status).toBe(200);
    expect(res.body.text).toBe('Analisi in prosa');
    expect(res.body.transcript).toEqual({ asset: 'XAU/USD' });
    expect(mockRun).toHaveBeenCalledWith(
      expect.objectContaining({ chatId: 'chat-1', images: [] }),
    );
  });

  it('502 con messaggio gestito se l’analisi fallisce (mai eccezione a vista)', async () => {
    mockRun.mockRejectedValue(new Error('Errore Gemini 500: down'));
    const res = await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1' });
    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/non è raggiungibile/);
  });

  it('400 se troppi screenshot', async () => {
    const many = Array.from({ length: 9 }, () => ({ mimeType: 'image/png', data: 'A' }));
    const res = await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: many });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Troppi screenshot/);
  });
});

describe('messaggioErrore', () => {
  it('chiave/provider AI → messaggio di configurazione', () => {
    expect(messaggioErrore(new Error('Chiave AI mancante'))).toMatch(/non è configurata/);
  });
  it('errore Gemini/rete → riprova più tardi', () => {
    expect(messaggioErrore(new Error('Errore Gemini 503'))).toMatch(/non è raggiungibile/);
  });
  it('default generico', () => {
    expect(messaggioErrore(new Error('qualcosa'))).toMatch(/Qualcosa è andato storto/);
  });
});
