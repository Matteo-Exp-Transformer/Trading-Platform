// orchestrator — coordina la catena agente:
//   kit (system) -> storia da Supabase -> messaggi multimodali -> Gemini -> testo.
// La storia si legge dalle NOSTRE tabelle (chats/messages) tramite il client passato dalla
// route, vincolato al token utente: la RLS resta attiva (isolamento per utente, LOCK).
// Non salva nulla: la persistenza dei messaggi vive nel flusso client (chatData), vedi route.
import { loadSkillPrompt } from './skillLoader.js';
import { buildMessages } from './promptBuilder.js';
import { requestCompletion, parseCompletionResponse, streamGeminiText } from './providerClient.js';
import {
  buildImageCheckInstruction,
  buildTranscriptInstruction,
  splitTranscript,
  createProseStreamer,
} from './transcript.js';

// Legge la storia testuale della chat (role + content) ordinata cronologicamente.
export async function readHistory(supabase, chatId) {
  const { data, error } = await supabase
    .from('messages')
    .select('role, content')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Impossibile leggere la cronologia: ${error.message}`);
  return data || [];
}

// Prepara system + messaggi per un turno d'analisi. Solo nel turno con immagini si aggiunge
// l'istruzione (controllo screenshot + richiesta scheda JSON), in coda al turno utente (kit intatto).
async function prepareTurn(supabase, chatId, images) {
  const systemPrompt = await loadSkillPrompt();
  const history = await readHistory(supabase, chatId);
  if (history.length === 0) {
    throw new Error('Nessun messaggio da analizzare per questa chat.');
  }
  const instruction =
    images.length > 0
      ? `${buildImageCheckInstruction()}\n\n${buildTranscriptInstruction()}`
      : '';
  return buildMessages(systemPrompt, history, images, instruction);
}

// Ritorna { text, transcript }: `text` è la prosa mostrata all'utente; `transcript` è la scheda
// JSON dell'analisi (M4) da salvare in messages.attachments, oppure null (follow-up testuale, o
// scheda mancante/illeggibile — mai bloccante). Percorso NON-streaming (fallback).
// `model` (M6): modello AI per-account risolto dalla route; inoltrato tale e quale a providerClient
//   (LOCK catena: il modello si innesta SOLO passando `model` giù). undefined → default .env.
export async function runAnalysis({ supabase, chatId, images = [], model }) {
  const { system, messages } = await prepareTurn(supabase, chatId, images);

  const response = await requestCompletion({ system, messages, model });
  const text = parseCompletionResponse(response);
  if (!text) {
    throw new Error('Il modello non ha restituito una risposta valida.');
  }

  const { prose, transcript } = splitTranscript(text);
  if (!prose) {
    throw new Error('Il modello non ha restituito una risposta valida.');
  }
  return { text: prose, transcript };
}

// Percorso STREAMING (M5): async generator che emette eventi
//   { type: 'delta', text }  — pezzi di PROSA (marcatore/scheda già nascosti dal prose-streamer)
//   { type: 'done', transcript } — a fine risposta, la scheda JSON (o null)
// Lancia se il modello non produce alcuna prosa (la route lo traduce in evento d'errore).
// `model` (M6): modello AI per-account risolto dalla route, inoltrato a providerClient (LOCK catena).
export async function* runAnalysisStream({ supabase, chatId, images = [], model }) {
  const { system, messages } = await prepareTurn(supabase, chatId, images);

  const streamer = createProseStreamer();
  let emittedLen = 0;
  for await (const delta of streamGeminiText({ system, messages, model })) {
    const prose = streamer.push(delta);
    if (prose) {
      emittedLen += prose.length;
      yield { type: 'delta', text: prose };
    }
  }
  const { remaining, transcript } = streamer.finish();
  if (remaining) {
    emittedLen += remaining.length;
    yield { type: 'delta', text: remaining };
  }
  if (emittedLen === 0) {
    throw new Error('Il modello non ha restituito una risposta valida.');
  }
  yield { type: 'done', transcript };
}
