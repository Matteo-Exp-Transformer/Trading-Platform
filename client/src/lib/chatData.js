import { supabase } from './supabaseClient.js';

async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Utente non autenticato.');
  return user.id;
}

export async function createChat(title) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('chats')
    .insert({ title, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addMessage(chatId, content) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, user_id: userId, role: 'user', content })
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
