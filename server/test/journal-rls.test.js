// Test d'isolamento (FU-023): due utenti non vedono le voci di journal l'uno dell'altro, e il
// link chat_id non permette di agganciarsi a chat altrui (check sul padre, come per messages).
// Richiede SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY in .env.local.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../src/lib/supabaseAdmin.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const EMAIL_A = 'test-a-journal-rls@test.internal';
const EMAIL_B = 'test-b-journal-rls@test.internal';
const PWD_A = 'TestJournalRls-A-2026!';
const PWD_B = 'TestJournalRls-B-2026!';

async function deleteUserByEmail(email) {
  const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const user = data?.users?.find((u) => u.email === email);
  if (user) await supabaseAdmin.auth.admin.deleteUser(user.id);
}

beforeAll(async () => {
  await deleteUserByEmail(EMAIL_A);
  await deleteUserByEmail(EMAIL_B);
});

afterAll(async () => {
  await deleteUserByEmail(EMAIL_A);
  await deleteUserByEmail(EMAIL_B);
});

describe('RLS — isolamento utenti su journal_entries', () => {
  it('A crea e legge le proprie voci; B non le vede né può linkarsi alle chat di A', async () => {
    const { data: dataA, error: errA } = await supabaseAdmin.auth.admin.createUser({
      email: EMAIL_A,
      password: PWD_A,
      email_confirm: true,
      user_metadata: { display_name: 'Journal RLS A' },
    });
    expect(errA, `createUser A: ${errA?.message}`).toBeNull();

    const { data: dataB, error: errB } = await supabaseAdmin.auth.admin.createUser({
      email: EMAIL_B,
      password: PWD_B,
      email_confirm: true,
      user_metadata: { display_name: 'Journal RLS B' },
    });
    expect(errB, `createUser B: ${errB?.message}`).toBeNull();

    const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error: loginErrA } = await clientA.auth.signInWithPassword({ email: EMAIL_A, password: PWD_A });
    expect(loginErrA, `login A: ${loginErrA?.message}`).toBeNull();

    const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error: loginErrB } = await clientB.auth.signInWithPassword({ email: EMAIL_B, password: PWD_B });
    expect(loginErrB, `login B: ${loginErrB?.message}`).toBeNull();

    // (a) A crea una voce manuale (chat_id null)
    const { data: entryA, error: entryErrA } = await clientA
      .from('journal_entries')
      .insert({ user_id: dataA.user.id, asset: 'EURUSD', timeframe: '5m', outcome: 'win' })
      .select()
      .single();
    expect(entryErrA, `insert entry A: ${entryErrA?.message}`).toBeNull();
    expect(entryA.user_id).toBe(dataA.user.id);

    // (b) A legge la propria voce
    const { data: entriesA } = await clientA.from('journal_entries').select('*');
    expect(entriesA).toHaveLength(1);
    expect(entriesA[0].id).toBe(entryA.id);

    // (c) B NON vede le voci di A — lista vuota
    const { data: entriesBall } = await clientB.from('journal_entries').select('*');
    expect(entriesBall).toHaveLength(0);

    // (c) B NON vede la voce di A nemmeno con filtro esplicito sull'id
    const { data: entriesBfiltered } = await clientB
      .from('journal_entries')
      .select('*')
      .eq('id', entryA.id);
    expect(entriesBfiltered).toHaveLength(0);

    // (d) A crea una chat; B non può creare una voce linkata alla chat di A (check sul padre)
    const { data: chatA } = await clientA
      .from('chats')
      .insert({ user_id: dataA.user.id, title: 'Chat di A' })
      .select()
      .single();
    const { data: intruderEntry } = await clientB
      .from('journal_entries')
      .insert({ user_id: dataB.user.id, chat_id: chatA.id, asset: 'HACK' })
      .select();
    expect(intruderEntry ?? []).toHaveLength(0);

    // (e) A non può spostare la propria voce sotto una chat di B (UPDATE WITH CHECK sul padre)
    const { data: chatB } = await clientB
      .from('chats')
      .insert({ user_id: dataB.user.id, title: 'Chat di B' })
      .select()
      .single();
    const { data: movedEntry } = await clientA
      .from('journal_entries')
      .update({ chat_id: chatB.id })
      .eq('id', entryA.id)
      .select();
    expect(movedEntry ?? []).toHaveLength(0);

    // (f) B non può eliminare la voce di A
    await clientB.from('journal_entries').delete().eq('id', entryA.id);
    const { data: stillThere } = await clientA
      .from('journal_entries')
      .select('id')
      .eq('id', entryA.id);
    expect(stillThere).toHaveLength(1);
  });
});
