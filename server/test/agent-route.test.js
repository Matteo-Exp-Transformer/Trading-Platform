import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const {
  mockRun,
  mockRunStream,
  mockMaybeSingle,
  mockProfileMaybeSingle,
  mockMessagesCount,
  mockLastUserMsg,
  mockClassifica,
  mockCreateClient,
} = vi.hoisted(() => ({
  mockRun: vi.fn(),
  mockRunStream: vi.fn(),
  mockMaybeSingle: vi.fn(), // ownership chat: from('chats').select('id').eq('id',id).maybeSingle()
  mockProfileMaybeSingle: vi.fn(), // modello M6: from('profiles').select('ai_model').maybeSingle()
  mockMessagesCount: vi.fn(), // limite FU: from('messages').select(id,{count}).eq().eq() → {count}
  mockLastUserMsg: vi.fn(), // classificatore: ultimo msg utente .order().limit().maybeSingle()
  mockClassifica: vi.fn(), // classificatore d'ingresso (Strato 2)
  mockCreateClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }));
vi.mock('../src/agent/orchestrator.js', () => ({
  runAnalysis: mockRun,
  runAnalysisStream: mockRunStream,
}));
vi.mock('../src/agent/topicGuard.js', () => ({ classificaTesto: mockClassifica }));

// Finto runAnalysisStream: async generator sugli eventi passati.
function asEventStream(events) {
  return (async function* () {
    for (const e of events) yield e;
  })();
}
// Parsa il corpo NDJSON in array di eventi.
function parseNdjson(text) {
  return text
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

import { createApp } from '../src/app.js';
import { messaggioErrore } from '../src/routes/agent.js';

beforeEach(() => {
  vi.clearAllMocks();
  // Il client per-richiesta è usato per due letture RLS distinte:
  //  - from('chats').select('id').eq('id', id).maybeSingle()  → ownership della chat
  //  - from('profiles').select('ai_model').maybeSingle()      → modello per-account (M6)
  const from = vi.fn((table) => {
    if (table === 'profiles') {
      return { select: vi.fn(() => ({ maybeSingle: mockProfileMaybeSingle })) };
    }
    if (table === 'messages') {
      // Due query distinte su 'messages':
      //  - limite follow-up: select(id,{count}).eq('chat_id').eq('role')      → mockMessagesCount
      //  - ultimo msg utente: select('content').eq().eq().order().limit().maybeSingle() → mockLastUserMsg
      const secondEq = vi.fn(() => {
        // Restituisce un oggetto che è SIA thenable (conteggio) SIA con .order (ultimo msg).
        const chain = {
          order: vi.fn(() => ({ limit: vi.fn(() => ({ maybeSingle: mockLastUserMsg })) })),
          then: (resolve) => Promise.resolve(mockMessagesCount()).then(resolve),
        };
        return chain;
      });
      return { select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: secondEq })) })) };
    }
    return { select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })) })) };
  });
  mockCreateClient.mockReturnValue({ from });
  mockMaybeSingle.mockResolvedValue({ data: { id: 'chat-1' }, error: null });
  mockProfileMaybeSingle.mockResolvedValue({ data: { ai_model: null }, error: null });
  // Default: 1 messaggio utente (solo la prima analisi) → nessun follow-up usato, sempre entro il limite.
  mockMessagesCount.mockResolvedValue({ count: 1, error: null });
  // Default: ultimo messaggio utente leggibile + classificatore che consente (in-tema).
  mockLastUserMsg.mockResolvedValue({ data: { content: 'Analizza XAU/USD' }, error: null });
  mockClassifica.mockResolvedValue({ consentito: true, motivo: 'ok' });
  mockRun.mockResolvedValue({ text: 'Analisi in prosa', transcript: null });
  mockRunStream.mockReturnValue(
    asEventStream([
      { type: 'delta', text: 'Analisi ' },
      { type: 'delta', text: 'in prosa.' },
      { type: 'done', transcript: { asset: 'XAU/USD' } },
    ]),
  );
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

  it('passa il modello per-account all’orchestrator quando valido (M6)', async () => {
    mockProfileMaybeSingle.mockResolvedValue({ data: { ai_model: 'gemini-2.5-flash' }, error: null });
    await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [] });
    expect(mockRun).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-2.5-flash' }),
    );
  });

  it('modello fuori lista → undefined (fallback al default .env, mai crash)', async () => {
    mockProfileMaybeSingle.mockResolvedValue({ data: { ai_model: 'modello-inventato' }, error: null });
    await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [] });
    expect(mockRun.mock.calls[0][0].model).toBeUndefined();
  });

  it('se la lettura del profilo fallisce, l’analisi procede col default (fallback mai-crash)', async () => {
    mockProfileMaybeSingle.mockRejectedValue(new Error('profilo non leggibile'));
    const res = await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [] });
    expect(res.status).toBe(200);
    expect(mockRun.mock.calls[0][0].model).toBeUndefined();
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

  it('400 se il formato di uno screenshot non è ammesso (validazione server)', async () => {
    const res = await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [{ mimeType: 'application/pdf', data: 'AAAA' }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Formato screenshot non supportato/);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('429 rate limit: oltre il tetto per minuto la richiesta è respinta', async () => {
    vi.stubEnv('MAX_ANALISI_PER_MINUTO', '2');
    try {
      // Token dedicato: il registro del limitatore è condiviso dentro questo file di test.
      const call = () =>
        request(app)
          .post('/api/agent/analyze')
          .set('Authorization', 'Bearer tok-rate-limit')
          .send({ chatId: 'chat-1', images: [] });
      expect((await call()).status).toBe(200);
      expect((await call()).status).toBe(200);
      const res = await call();
      expect(res.status).toBe(429);
      expect(res.body.error).toMatch(/Troppe richieste ravvicinate/);
      expect(mockRun).toHaveBeenCalledTimes(2);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('429 se superato il limite di follow-up (prima analisi esclusa + 5)', async () => {
    // 7 messaggi utente = 1 analisi + 6 follow-up → oltre il limite di 5.
    mockMessagesCount.mockResolvedValue({ count: 7, error: null });
    const res = await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [] });
    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/limite di 5 approfondimenti/i);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('consente il follow-up al 5° (entro il limite)', async () => {
    // 6 messaggi utente = 1 analisi + 5 follow-up → l'ultimo è ancora ammesso.
    mockMessagesCount.mockResolvedValue({ count: 6, error: null });
    const res = await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [] });
    expect(res.status).toBe(200);
    expect(mockRun).toHaveBeenCalled();
  });

  it('la prima analisi (con immagini) non è mai limitata', async () => {
    mockMessagesCount.mockResolvedValue({ count: 99, error: null });
    const res = await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [{ mimeType: 'image/png', data: 'A' }] });
    expect(res.status).toBe(200);
    expect(mockRun).toHaveBeenCalled();
  });

  it('se il conteggio messaggi fallisce, non blocca (fallback mai-crash)', async () => {
    mockMessagesCount.mockResolvedValue({ count: null, error: new Error('db down') });
    const res = await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [] });
    expect(res.status).toBe(200);
    expect(mockRun).toHaveBeenCalled();
  });

  it('classificatore FUORI-TEMA: rifiuto sul canale risposta, l’analisi non parte', async () => {
    mockClassifica.mockResolvedValue({ consentito: false, motivo: 'fuori_tema' });
    const res = await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [] });
    expect(res.status).toBe(200);
    expect(res.body.text).toMatch(/analisi dei mercati e trading/);
    expect(res.body.transcript).toBeNull();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('classificatore ESTRAZIONE: rifiuto dedicato sul canale risposta', async () => {
    mockClassifica.mockResolvedValue({ consentito: false, motivo: 'estrazione' });
    const res = await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [] });
    expect(res.status).toBe(200);
    expect(res.body.text).toMatch(/come sono costruito/);
    expect(res.body.transcript).toBeNull();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('classificatore IN-TEMA: l’analisi procede normalmente', async () => {
    mockClassifica.mockResolvedValue({ consentito: true, motivo: 'ok' });
    const res = await request(app)
      .post('/api/agent/analyze')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [] });
    expect(res.status).toBe(200);
    expect(mockRun).toHaveBeenCalled();
  });
});

describe('POST /api/agent/analyze/stream (M5)', () => {
  const app = createApp();

  it('401 senza token (auth prima dello stream)', async () => {
    const res = await request(app).post('/api/agent/analyze/stream').send({ chatId: 'chat-1' });
    expect(res.status).toBe(401);
    expect(mockRunStream).not.toHaveBeenCalled();
  });

  it('404 se la chat non è dell’utente', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await request(app)
      .post('/api/agent/analyze/stream')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-altrui' });
    expect(res.status).toBe(404);
    expect(mockRunStream).not.toHaveBeenCalled();
  });

  it('429 se superato il limite di follow-up (auth prima dello stream)', async () => {
    mockMessagesCount.mockResolvedValue({ count: 7, error: null });
    const res = await request(app)
      .post('/api/agent/analyze/stream')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [] });
    expect(res.status).toBe(429);
    expect(mockRunStream).not.toHaveBeenCalled();
  });

  it('200 stream NDJSON: delta di prosa poi done con transcript', async () => {
    const res = await request(app)
      .post('/api/agent/analyze/stream')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [] });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/ndjson/);
    const events = parseNdjson(res.text);
    const prose = events.filter((e) => e.type === 'delta').map((e) => e.text).join('');
    const done = events.find((e) => e.type === 'done');
    expect(prose).toBe('Analisi in prosa.');
    expect(done.transcript).toEqual({ asset: 'XAU/USD' });
  });

  it('classificatore FUORI-TEMA in streaming: delta col rifiuto + done, analisi non parte', async () => {
    mockClassifica.mockResolvedValue({ consentito: false, motivo: 'fuori_tema' });
    const res = await request(app)
      .post('/api/agent/analyze/stream')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [] });
    expect(res.status).toBe(200);
    const events = parseNdjson(res.text);
    const prose = events.filter((e) => e.type === 'delta').map((e) => e.text).join('');
    const done = events.find((e) => e.type === 'done');
    expect(prose).toMatch(/analisi dei mercati e trading/);
    expect(done.transcript).toBeNull();
    expect(mockRunStream).not.toHaveBeenCalled();
  });

  it('classificatore ESTRAZIONE in streaming: rifiuto dedicato + done', async () => {
    mockClassifica.mockResolvedValue({ consentito: false, motivo: 'estrazione' });
    const res = await request(app)
      .post('/api/agent/analyze/stream')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1', images: [] });
    expect(res.status).toBe(200);
    const events = parseNdjson(res.text);
    const prose = events.filter((e) => e.type === 'delta').map((e) => e.text).join('');
    expect(prose).toMatch(/come sono costruito/);
    expect(mockRunStream).not.toHaveBeenCalled();
  });

  it('errore in-band (evento error) se l’analisi fallisce a stream avviato', async () => {
    mockRunStream.mockReturnValue(
      (async function* () {
        yield { type: 'delta', text: 'Inizio…' };
        throw new Error('Errore Gemini 500: down');
      })(),
    );
    const res = await request(app)
      .post('/api/agent/analyze/stream')
      .set('Authorization', 'Bearer tok')
      .send({ chatId: 'chat-1' });
    expect(res.status).toBe(200); // header già inviati: l'errore è in-band
    const events = parseNdjson(res.text);
    const err = events.find((e) => e.type === 'error');
    expect(err.error).toMatch(/non è raggiungibile/);
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
