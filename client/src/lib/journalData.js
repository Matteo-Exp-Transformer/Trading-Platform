import { supabase } from './supabaseClient.js';

// Data access del Journal (FU-023). Stampo di chatData.js: il client usa supabase-js con anon key,
// la RLS filtra alle sole voci dell'utente (vedi DB_SUPABASE_SKILL / JOURNAL_CONTEXT). Il server e la
// service key non c'entrano: qui è tutto lato client, protetto dalle policy journal_*_own.

async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Utente non autenticato.');
  return user.id;
}

// Campi che l'utente può scrivere/modificare su una voce. user_id lo mette getUserId (mai dal client
// come dato arbitrario); id/created_at/updated_at li gestisce il DB. Whitelist esplicita così una
// chiamata non può iniettare colonne impreviste.
const WRITABLE_FIELDS = [
  'chat_id',
  'asset',
  'timeframe',
  'traded_at',
  'direction',
  'outcome',
  'entry_price',
  'exit_price',
  'stop_price',
  'rr',
  'pnl',
  'emotion',
  'tags',
  'note',
  'lesson',
];

function pickWritable(fields) {
  const row = {};
  for (const key of WRITABLE_FIELDS) {
    if (fields[key] !== undefined) row[key] = fields[key];
  }
  return row;
}

export async function listEntries() {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('traded_at', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getEntry(id) {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createEntry(fields = {}) {
  const userId = await getUserId();
  const row = { ...pickWritable(fields), user_id: userId };
  const { data, error } = await supabase
    .from('journal_entries')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEntry(id, fields = {}) {
  const { data, error } = await supabase
    .from('journal_entries')
    .update(pickWritable(fields))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEntry(id) {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
