import { supabase } from './supabaseClient.js';

const WRITABLE_FIELDS = ['title', 'content', 'color', 'font'];

async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Utente non autenticato.');
  return user.id;
}

function pickWritable(fields) {
  const row = {};
  for (const key of WRITABLE_FIELDS) {
    if (fields[key] !== undefined) row[key] = fields[key];
  }
  return row;
}

export async function listNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createNote(fields = {}) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('notes')
    .insert({ ...pickWritable(fields), user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNote(id, fields = {}) {
  const { data, error } = await supabase
    .from('notes')
    .update(pickWritable(fields))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNote(id) {
  const { data, error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .select('id')
    .single();
  if (error) throw error;
  return data;
}
