import { describe, expect, it } from 'vitest';
import {
  emptyNote,
  normalizeColor,
  normalizeFont,
  noteTextStyle,
  toDbFields,
  toFormFields,
} from './notesFields.js';

describe('notesFields', () => {
  it('emptyNote prepara una nota senza stile personalizzato', () => {
    expect(emptyNote()).toEqual({
      title: '',
      content: '',
      color: '',
      font: '',
    });
  });

  it('normalizeFont accetta solo le chiavi della whitelist', () => {
    expect(normalizeFont('lora')).toBe('lora');
    expect(normalizeFont('Comic Sans MS')).toBe('');
  });

  it('normalizeColor accetta solo gli swatch della whitelist', () => {
    expect(normalizeColor('#C44D74')).toBe('#c44d74');
    expect(normalizeColor('red')).toBe('');
  });

  it('toDbFields pulisce il titolo e scarta stili non ammessi', () => {
    expect(toDbFields({
      title: '  Piano settimanale  ',
      content: 'Riga 1\n  Riga 2',
      color: '#ffffff',
      font: 'serif',
    })).toEqual({
      title: 'Piano settimanale',
      content: 'Riga 1\n  Riga 2',
      color: '',
      font: '',
    });
  });

  it('toFormFields rende controllati anche i valori mancanti', () => {
    expect(toFormFields({ title: 'Idea', content: null })).toEqual({
      title: 'Idea',
      content: '',
      color: '',
      font: '',
    });
  });

  it('noteTextStyle traduce chiave font e colore in stile sicuro', () => {
    expect(noteTextStyle({ font: 'roboto-mono', color: '#3976cd' })).toEqual({
      fontFamily: '"Roboto Mono", monospace',
      color: '#3976cd',
    });
    expect(noteTextStyle({ font: 'sconosciuto', color: 'expression(alert(1))' }))
      .toEqual({
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      });
  });
});
