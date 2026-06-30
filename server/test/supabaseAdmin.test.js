import { vi, describe, it, expect } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { admin: {} },
    from: vi.fn(),
  })),
}));

import { supabaseAdmin } from '../src/lib/supabaseAdmin.js';

describe('supabaseAdmin', () => {
  it('esporta un client con accesso admin', () => {
    expect(supabaseAdmin).toBeDefined();
    expect(supabaseAdmin.auth).toBeDefined();
    expect(supabaseAdmin.auth.admin).toBeDefined();
  });
});
