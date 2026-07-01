import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockUpdate, mockEq } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockEq: vi.fn(),
}));

vi.mock('./supabaseClient.js', () => ({
  supabase: {
    from: vi.fn(() => ({ update: mockUpdate })),
  },
}));

import { THEMES, DEFAULT_THEME, normalizeTheme, applyTheme, saveTheme } from './theme.js';

beforeEach(() => {
  vi.clearAllMocks();
  document.documentElement.classList.remove('dark');
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockResolvedValue({ error: null });
});

describe('normalizeTheme', () => {
  it('mantiene i temi validi', () => {
    expect(normalizeTheme('dark')).toBe('dark');
    expect(normalizeTheme('light')).toBe('light');
  });
  it('cade sul default per valori nulli o errati', () => {
    expect(normalizeTheme(null)).toBe(DEFAULT_THEME);
    expect(normalizeTheme('viola')).toBe(DEFAULT_THEME);
    expect(THEMES).toEqual(['dark', 'light']);
    expect(DEFAULT_THEME).toBe('dark');
  });
});

describe('applyTheme', () => {
  it("dark → aggiunge la classe 'dark' su <html>", () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
  it("light → toglie la classe 'dark'", () => {
    document.documentElement.classList.add('dark');
    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
  it('valore errato → applica il default (dark)', () => {
    applyTheme('inesistente');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
  it('è idempotente (due dark di fila lasciano una sola classe)', () => {
    applyTheme('dark');
    applyTheme('dark');
    expect(document.documentElement.className).toBe('dark');
  });
});

describe('saveTheme', () => {
  it('salva sul profilo dell’utente e applica il tema', async () => {
    const out = await saveTheme('user-1', 'light');
    expect(mockUpdate).toHaveBeenCalledWith({ theme: 'light' });
    expect(mockEq).toHaveBeenCalledWith('id', 'user-1');
    expect(out).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('normalizza un tema errato prima di salvare', async () => {
    await saveTheme('user-1', 'fucsia');
    expect(mockUpdate).toHaveBeenCalledWith({ theme: 'dark' });
  });

  it('lancia un messaggio chiaro se il salvataggio fallisce (mai crash a vista)', async () => {
    mockEq.mockResolvedValue({ error: { message: 'boom' } });
    await expect(saveTheme('user-1', 'light')).rejects.toThrow(/Impossibile salvare il tema/);
  });
});
