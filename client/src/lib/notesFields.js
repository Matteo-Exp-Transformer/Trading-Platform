export const FONT_OPTIONS = [
  {
    value: '',
    label: 'Predefinito',
    family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  { value: 'inter', label: 'Inter', family: '"Inter", sans-serif' },
  { value: 'poppins', label: 'Poppins', family: '"Poppins", sans-serif' },
  { value: 'lora', label: 'Lora', family: '"Lora", serif' },
  { value: 'merriweather', label: 'Merriweather', family: '"Merriweather", serif' },
  { value: 'roboto-mono', label: 'Roboto Mono', family: '"Roboto Mono", monospace' },
];

export const COLOR_OPTIONS = [
  { value: '', label: 'Predefinito' },
  { value: '#657891', label: 'Ardesia' },
  { value: '#1b8296', label: 'Ciano' },
  { value: '#3976cd', label: 'Blu' },
  { value: '#8e61bd', label: 'Viola' },
  { value: '#c44d74', label: 'Rosa' },
  { value: '#927215', label: 'Ambra' },
];

export function normalizeFont(value) {
  return FONT_OPTIONS.some((option) => option.value === value) ? value : '';
}

export function normalizeColor(value) {
  const normalized = String(value ?? '').toLowerCase();
  return COLOR_OPTIONS.some((option) => option.value === normalized) ? normalized : '';
}

export function emptyNote() {
  return {
    title: '',
    content: '',
    color: '',
    font: '',
  };
}

export function toDbFields(note = {}) {
  return {
    title: String(note.title ?? '').trim(),
    content: String(note.content ?? ''),
    color: normalizeColor(note.color),
    font: normalizeFont(note.font),
  };
}

export function toFormFields(note = {}) {
  return {
    title: String(note.title ?? ''),
    content: String(note.content ?? ''),
    color: normalizeColor(note.color),
    font: normalizeFont(note.font),
  };
}

export function noteTextStyle(note = {}) {
  const font = normalizeFont(note.font);
  const color = normalizeColor(note.color);
  const family = FONT_OPTIONS.find((option) => option.value === font)?.family
    ?? FONT_OPTIONS[0].family;

  return {
    fontFamily: family,
    ...(color ? { color } : {}),
  };
}
