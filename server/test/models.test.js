import { describe, it, expect } from 'vitest';
import { CURATED_MODELS, resolveUserModel } from '../src/agent/models.js';

describe('CURATED_MODELS', () => {
  it('contiene i due modelli decisi a M6 (Pro default + Flash)', () => {
    expect(CURATED_MODELS).toEqual(['gemini-2.5-pro', 'gemini-2.5-flash']);
  });
});

describe('resolveUserModel', () => {
  it('ritorna il modello se è nella lista curata', () => {
    expect(resolveUserModel('gemini-2.5-pro')).toBe('gemini-2.5-pro');
    expect(resolveUserModel('gemini-2.5-flash')).toBe('gemini-2.5-flash');
  });

  it('tollera spazi ai bordi', () => {
    expect(resolveUserModel('  gemini-2.5-flash  ')).toBe('gemini-2.5-flash');
  });

  it('ritorna undefined per null/undefined (→ fallback default .env)', () => {
    expect(resolveUserModel(null)).toBeUndefined();
    expect(resolveUserModel(undefined)).toBeUndefined();
  });

  it('ritorna undefined per un valore fuori lista (mai crash, degrada al default)', () => {
    expect(resolveUserModel('gpt-4')).toBeUndefined();
    expect(resolveUserModel('gemini-2.5-flash-lite')).toBeUndefined();
    expect(resolveUserModel('')).toBeUndefined();
  });

  it('ritorna undefined per tipi non-stringa', () => {
    expect(resolveUserModel(42)).toBeUndefined();
    expect(resolveUserModel({})).toBeUndefined();
  });
});
