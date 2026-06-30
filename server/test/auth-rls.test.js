// Test d'isolamento M1: due utenti non vedono i dati l'uno dell'altro.
// Richiede SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY in .env.local.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../src/lib/supabaseAdmin.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const EMAIL_A = 'test-a-rls@test.internal';
const EMAIL_B = 'test-b-rls@test.internal';
const PWD_A = 'TestRls-A-2026!';
const PWD_B = 'TestRls-B-2026!';

async function deleteUserByEmail(email) {
  const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const user = data?.users?.find((u) => u.email === email);
  if (user) await supabaseAdmin.auth.admin.deleteUser(user.id);
}

beforeAll(async () => {
  // Pulizia da runs precedenti fallite.
  await deleteUserByEmail(EMAIL_A);
  await deleteUserByEmail(EMAIL_B);
});

afterAll(async () => {
  await deleteUserByEmail(EMAIL_A);
  await deleteUserByEmail(EMAIL_B);
});

describe('RLS — isolamento utenti su profiles', () => {
  it('ogni utente legge solo la propria riga e non quella altrui', async () => {
    // --- Creazione utenti con service_role ---
    const { data: dataA, error: errA } = await supabaseAdmin.auth.admin.createUser({
      email: EMAIL_A,
      password: PWD_A,
      email_confirm: true,
      user_metadata: { display_name: 'Test RLS A' },
    });
    expect(errA, `createUser A: ${errA?.message}`).toBeNull();

    const { data: dataB, error: errB } = await supabaseAdmin.auth.admin.createUser({
      email: EMAIL_B,
      password: PWD_B,
      email_confirm: true,
      user_metadata: { display_name: 'Test RLS B' },
    });
    expect(errB, `createUser B: ${errB?.message}`).toBeNull();

    // --- Login come utente A (client anon) ---
    const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error: loginErrA } = await clientA.auth.signInWithPassword({
      email: EMAIL_A,
      password: PWD_A,
    });
    expect(loginErrA, `login A: ${loginErrA?.message}`).toBeNull();

    // --- Login come utente B (client anon separato) ---
    const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error: loginErrB } = await clientB.auth.signInWithPassword({
      email: EMAIL_B,
      password: PWD_B,
    });
    expect(loginErrB, `login B: ${loginErrB?.message}`).toBeNull();

    // --- A legge solo la propria riga ---
    const { data: profilesA } = await clientA.from('profiles').select('*');
    expect(profilesA).toHaveLength(1);
    expect(profilesA[0].id).toBe(dataA.user.id);

    // --- B legge solo la propria riga ---
    const { data: profilesB } = await clientB.from('profiles').select('*');
    expect(profilesB).toHaveLength(1);
    expect(profilesB[0].id).toBe(dataB.user.id);

    // --- A NON vede la riga di B (RLS blocca) ---
    const { data: aSeesB } = await clientA
      .from('profiles')
      .select('*')
      .eq('id', dataB.user.id);
    expect(aSeesB).toHaveLength(0);

    // --- B NON vede la riga di A ---
    const { data: bSeesA } = await clientB
      .from('profiles')
      .select('*')
      .eq('id', dataA.user.id);
    expect(bSeesA).toHaveLength(0);
  });
});
