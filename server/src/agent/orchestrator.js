// orchestrator — coordina la catena agente:
//   kit (system) -> storia da Supabase -> messaggi multimodali -> Gemini -> testo.
// La storia si legge dalle NOSTRE tabelle (chats/messages) tramite il client passato dalla
// route, vincolato al token utente: la RLS resta attiva (isolamento per utente, LOCK).
// Non salva nulla: la persistenza dei messaggi vive nel flusso client (chatData), vedi route.
import { loadSkillPrompt } from './skillLoader.js';
import { buildMessages } from './promptBuilder.js';
import { requestCompletion, parseCompletionResponse } from './providerClient.js';

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

export async function runAnalysis({ supabase, chatId, images = [] }) {
  const systemPrompt = await loadSkillPrompt();

  const history = await readHistory(supabase, chatId);
  if (history.length === 0) {
    throw new Error('Nessun messaggio da analizzare per questa chat.');
  }

  const { system, messages } = buildMessages(systemPrompt, history, images);

  const response = await requestCompletion({ system, messages });
  const text = parseCompletionResponse(response);
  if (!text) {
    throw new Error('Il modello non ha restituito una risposta valida.');
  }
  return text;
}
