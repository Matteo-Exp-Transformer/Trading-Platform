// Test d'isolamento M2: due utenti non vedono chat né messaggi l'uno dell'altro.
// Richiede SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY in .env.local.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../src/lib/supabaseAdmin.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Email dedicate M2 — diverse da quelle M1 (test-a/b-rls@test.internal)
const EMAIL_A = 'test-a-chat-rls@test.internal';
const EMAIL_B = 'test-b-chat-rls@test.internal';
const PWD_A = 'TestChatRls-A-2026!';
const PWD_B = 'TestChatRls-B-2026!';

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

describe('RLS — isolamento utenti su chats e messages', () => {
  it('utente A crea e legge chat+messaggi; B non vede nulla di A né può scrivere nella sua chat', async () => {
    // --- Creazione utenti con service_role ---
    const { data: dataA, error: errA } = await supabaseAdmin.auth.admin.createUser({
      email: EMAIL_A,
      password: PWD_A,
      email_confirm: true,
      user_metadata: { display_name: 'Chat RLS A' },
    });
    expect(errA, `createUser A: ${errA?.message}`).toBeNull();

    const { data: dataB, error: errB } = await supabaseAdmin.auth.admin.createUser({
      email: EMAIL_B,
      password: PWD_B,
      email_confirm: true,
      user_metadata: { display_name: 'Chat RLS B' },
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

    // (a) Utente A crea una chat
    const { data: chatA, error: chatErrA } = await clientA
      .from('chats')
      .insert({ user_id: dataA.user.id, title: 'Chat di A' })
      .select()
      .single();
    expect(chatErrA, `insert chat A: ${chatErrA?.message}`).toBeNull();
    expect(chatA.user_id).toBe(dataA.user.id);

    // (a) Utente A crea un messaggio nella propria chat
    const { data: msgA, error: msgErrA } = await clientA
      .from('messages')
      .insert({
        chat_id: chatA.id,
        user_id: dataA.user.id,
        role: 'user',
        content: 'Messaggio di A',
      })
      .select()
      .single();
    expect(msgErrA, `insert message A: ${msgErrA?.message}`).toBeNull();
    expect(msgA.chat_id).toBe(chatA.id);

    // (b) A legge la propria chat
    const { data: chatsA } = await clientA.from('chats').select('*');
    expect(chatsA).toHaveLength(1);
    expect(chatsA[0].id).toBe(chatA.id);

    // (b) A legge il proprio messaggio
    const { data: msgsA } = await clientA.from('messages').select('*');
    expect(msgsA).toHaveLength(1);
    expect(msgsA[0].id).toBe(msgA.id);

    // (c) B NON vede le chat di A — lista vuota
    const { data: chatsBall } = await clientB.from('chats').select('*');
    expect(chatsBall).toHaveLength(0);

    // (c) B NON vede la chat di A nemmeno con filtro esplicito sull'id
    const { data: chatsBfiltered } = await clientB
      .from('chats')
      .select('*')
      .eq('id', chatA.id);
    expect(chatsBfiltered).toHaveLength(0);

    // (c) B NON vede i messaggi di A — lista vuota
    const { data: msgsBall } = await clientB.from('messages').select('*');
    expect(msgsBall).toHaveLength(0);

    // (c) B NON vede il messaggio di A nemmeno con filtro esplicito
    const { data: msgsBfiltered } = await clientB
      .from('messages')
      .select('*')
      .eq('id', msgA.id);
    expect(msgsBfiltered).toHaveLength(0);

    // (d) B non può inserire un messaggio nella chat di A (RLS WITH CHECK blocca)
    const { data: intruderMsg } = await clientB
      .from('messages')
      .insert({
        chat_id: chatA.id,
        user_id: dataB.user.id,
        role: 'user',
        content: 'Tentativo di B nella chat di A',
      })
      .select();
    // PostgREST con RLS restituisce errore o array vuoto; in entrambi i casi nessuna riga inserita
    const inserted = intruderMsg ?? [];
    expect(inserted).toHaveLength(0);

    // (e) A non può spostare un proprio messaggio in una chat di B (UPDATE WITH CHECK sul padre)
    const { data: chatB } = await clientB
      .from('chats')
      .insert({ user_id: dataB.user.id, title: 'Chat di B' })
      .select()
      .single();
    const { data: movedMsg } = await clientA
      .from('messages')
      .update({ chat_id: chatB.id })
      .eq('id', msgA.id)
      .select();
    // WITH CHECK blocca: nessuna riga aggiornata
    expect(movedMsg ?? []).toHaveLength(0);
    // Il messaggio resta nella chat originale di A
    const { data: msgStill } = await clientA
      .from('messages')
      .select('chat_id')
      .eq('id', msgA.id)
      .single();
    expect(msgStill.chat_id).toBe(chatA.id);

    // (f) B non può eliminare la chat di A: la policy DELETE la filtra senza errori generici
    const { data: deletedByB, error: deleteErrB } = await clientB
      .from('chats')
      .delete()
      .eq('id', chatA.id)
      .select('id');
    expect(deleteErrB, `delete chat A by B: ${deleteErrB?.message}`).toBeNull();
    expect(deletedByB).toHaveLength(0);
    const { data: chatAStill } = await clientA
      .from('chats')
      .select('id')
      .eq('id', chatA.id)
      .single();
    expect(chatAStill.id).toBe(chatA.id);

    // (g) A elimina la propria chat e il DB elimina in cascata i suoi messaggi
    const { data: deletedByA, error: deleteErrA } = await clientA
      .from('chats')
      .delete()
      .eq('id', chatA.id)
      .select('id')
      .single();
    expect(deleteErrA, `delete chat A: ${deleteErrA?.message}`).toBeNull();
    expect(deletedByA.id).toBe(chatA.id);
    const { data: messagesAfterDelete, error: messagesAfterDeleteError } = await clientA
      .from('messages')
      .select('id')
      .eq('id', msgA.id);
    expect(
      messagesAfterDeleteError,
      `select message after chat delete: ${messagesAfterDeleteError?.message}`,
    ).toBeNull();
    expect(messagesAfterDelete).toHaveLength(0);
  });
});
