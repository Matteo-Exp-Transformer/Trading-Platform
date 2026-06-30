import { createClient } from '@supabase/supabase-js';

// Client service_role: accesso privilegiato. SOLO server.
// Mai passarlo ai percorsi di richiesta normali: usarlo solo per operazioni admin/test.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
