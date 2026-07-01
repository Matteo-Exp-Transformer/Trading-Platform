import { supabase } from './supabaseClient.js';

async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Utente non autenticato.');
  return user.id;
}

export async function createChat(title, formContext = {}) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('chats')
    .insert({ title, user_id: userId, form_context: formContext })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// role generalizzato: 'user' (default) per i messaggi del trader, 'assistant' per le
// risposte dell'agente AI (salvate dal client dopo la chiamata alla route, vedi agentApi).
export async function addMessage(chatId, content, role = 'user') {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, user_id: userId, role, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function loadMessages(chatId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function listChats() {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateChatTitle(chatId, title) {
  const { data, error } = await supabase
    .from('chats')
    .update({ title })
    .eq('id', chatId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
