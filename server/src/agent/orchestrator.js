// orchestrator — coordina la catena agente:
//   kit (system) -> storia da Supabase -> messaggi multimodali -> Gemini -> testo.
// La storia si legge dalle NOSTRE tabelle (chats/messages) tramite il client passato dalla
// route, vincolato al token utente: la RLS resta attiva (isolamento per utente, LOCK).
// Non salva nulla: la persistenza dei messaggi vive nel flusso client (chatData), vedi route.
import { loadSkillPrompt } from './skillLoader.js';
import { buildMessages } from './promptBuilder.js';
import { requestCompletion, parseCompletionResponse } from './providerClient.js';
import { buildImageCheckInstruction, buildTranscriptInstruction, splitTranscript } from './transcript.js';

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

// Ritorna { text, transcript }: `text` è la prosa mostrata all'utente; `transcript` è la scheda
// JSON dell'analisi (M4) da salvare in messages.attachments, oppure null (follow-up testuale, o
// scheda mancante/illeggibile — mai bloccante). La scheda si chiede solo nel turno con immagini.
export async function runAnalysis({ supabase, chatId, images = [] }) {
  const systemPrompt = await loadSkillPrompt();

  const history = await readHistory(supabase, chatId);
  if (history.length === 0) {
    throw new Error('Nessun messaggio da analizzare per questa chat.');
  }

  // Solo nel turno con immagini: controlla gli screenshot (segnala i non validi) + chiedi la scheda JSON.
  const instruction =
    images.length > 0
      ? `${buildImageCheckInstruction()}\n\n${buildTranscriptInstruction()}`
      : '';
  const { system, messages } = buildMessages(systemPrompt, history, images, instruction);

  const response = await requestCompletion({ system, messages });
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
