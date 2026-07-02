// Test live sul progetto demo: ogni utente può leggere e mutare soltanto le proprie note.
// Richiede SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY in .env.local.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../src/lib/supabaseAdmin.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const EMAIL_A = 'test-a-notes-rls@test.internal';
const EMAIL_B = 'test-b-notes-rls@test.internal';
const PWD_A = 'TestNotesRls-A-2026!';
const PWD_B = 'TestNotesRls-B-2026!';

async function deleteUserByEmail(email) {
  const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const user = data?.users?.find((candidate) => candidate.email === email);
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

describe('RLS — isolamento utenti su notes', () => {
  it('consente il CRUD al proprietario e nega lettura/scrittura all’altro utente', async () => {
    const { data: dataA, error: createErrorA } = await supabaseAdmin.auth.admin.createUser({
      email: EMAIL_A,
      password: PWD_A,
      email_confirm: true,
      user_metadata: { display_name: 'Notes RLS A' },
    });
    expect(createErrorA, `createUser A: ${createErrorA?.message}`).toBeNull();

    const { data: dataB, error: createErrorB } = await supabaseAdmin.auth.admin.createUser({
      email: EMAIL_B,
      password: PWD_B,
      email_confirm: true,
      user_metadata: { display_name: 'Notes RLS B' },
    });
    expect(createErrorB, `createUser B: ${createErrorB?.message}`).toBeNull();

    const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error: loginErrorA } = await clientA.auth.signInWithPassword({
      email: EMAIL_A,
      password: PWD_A,
    });
    expect(loginErrorA, `login A: ${loginErrorA?.message}`).toBeNull();

    const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error: loginErrorB } = await clientB.auth.signInWithPassword({
      email: EMAIL_B,
      password: PWD_B,
    });
    expect(loginErrorB, `login B: ${loginErrorB?.message}`).toBeNull();

    const { data: noteA, error: insertErrorA } = await clientA
      .from('notes')
      .insert({
        user_id: dataA.user.id,
        title: 'Nota privata di A',
        content: 'Contenuto riservato',
        color: '#3976cd',
        font: 'lora',
      })
      .select()
      .single();
    expect(insertErrorA, `insert note A: ${insertErrorA?.message}`).toBeNull();
    expect(noteA.user_id).toBe(dataA.user.id);

    const { data: notesA, error: selectErrorA } = await clientA
      .from('notes')
      .select('*');
    expect(selectErrorA, `select notes A: ${selectErrorA?.message}`).toBeNull();
    expect(notesA).toHaveLength(1);
    expect(notesA[0].id).toBe(noteA.id);

    const { data: notesB, error: selectErrorB } = await clientB
      .from('notes')
      .select('*');
    expect(selectErrorB, `select notes B: ${selectErrorB?.message}`).toBeNull();
    expect(notesB).toHaveLength(0);

    const { data: filteredByB, error: filteredErrorB } = await clientB
      .from('notes')
      .select('*')
      .eq('id', noteA.id);
    expect(filteredErrorB, `filtered select B: ${filteredErrorB?.message}`).toBeNull();
    expect(filteredByB).toHaveLength(0);

    const { data: forgedInsert, error: forgedInsertError } = await clientB
      .from('notes')
      .insert({
        user_id: dataA.user.id,
        title: 'Tentativo di B',
      })
      .select();
    expect(forgedInsert ?? []).toHaveLength(0);
    expect(forgedInsertError).not.toBeNull();

    const { data: updatedByB, error: updateErrorB } = await clientB
      .from('notes')
      .update({ title: 'Modificata da B' })
      .eq('id', noteA.id)
      .select('id');
    expect(updateErrorB, `update note A by B: ${updateErrorB?.message}`).toBeNull();
    expect(updatedByB).toHaveLength(0);

    const { data: deletedByB, error: deleteErrorB } = await clientB
      .from('notes')
      .delete()
      .eq('id', noteA.id)
      .select('id');
    expect(deleteErrorB, `delete note A by B: ${deleteErrorB?.message}`).toBeNull();
    expect(deletedByB).toHaveLength(0);

    const { data: updatedByA, error: updateErrorA } = await clientA
      .from('notes')
      .update({ title: 'Nota aggiornata da A' })
      .eq('id', noteA.id)
      .select()
      .single();
    expect(updateErrorA, `update note A: ${updateErrorA?.message}`).toBeNull();
    expect(updatedByA.title).toBe('Nota aggiornata da A');
    expect(new Date(updatedByA.updated_at).getTime())
      .toBeGreaterThanOrEqual(new Date(noteA.updated_at).getTime());

    const { data: deletedByA, error: deleteErrorA } = await clientA
      .from('notes')
      .delete()
      .eq('id', noteA.id)
      .select('id')
      .single();
    expect(deleteErrorA, `delete note A: ${deleteErrorA?.message}`).toBeNull();
    expect(deletedByA.id).toBe(noteA.id);

    expect(dataB.user.id).not.toBe(dataA.user.id);
  });
});
