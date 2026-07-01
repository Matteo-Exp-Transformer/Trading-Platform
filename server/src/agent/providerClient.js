// providerClient — SWITCHER di provider AI. In M3 è implementato Google Gemini (modello con
// vista). Modello e chiave arrivano da .env, MAI hardcoded. Lo switcher resta: per aggiungere
// un provider si estende qui, senza toccare orchestrator/promptBuilder.
//
// LOCK segreti: la chiave (GOOGLE_API_KEY) vive solo lato server, mai nel client/bundle.

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-pro';

// Traduce i messaggi neutri nel formato `contents` di Gemini.
// role 'assistant' -> 'model'; le immagini diventano part `inline_data` (multimodale).
export function toGeminiContents(messages = []) {
  return messages.map((m) => {
    const parts = [];
    if (m.content && m.content.trim()) parts.push({ text: m.content });
    for (const img of m.images || []) {
      if (img?.data && img?.mimeType) {
        parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
      }
    }
    // Gemini richiede almeno una part per ogni content.
    if (parts.length === 0) parts.push({ text: '' });
    return { role: m.role === 'assistant' ? 'model' : 'user', parts };
  });
}

// Gemini 2.5 Pro "ragiona" (thinking) e i token di pensiero CONDIVIDONO maxOutputTokens:
// un budget basso fa finire la risposta in MAX_TOKENS lasciando il testo vuoto. Diamo un tetto
// al thinking e una riserva ampia all'output (i costi non sono un freno in demo, qualità prima).
const DEFAULT_MAX_OUTPUT_TOKENS = 8192;
const DEFAULT_THINKING_BUDGET = 4096;

export function buildGeminiPayload({
  system,
  messages,
  temperature = 0.3,
  maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS,
  thinkingBudget = DEFAULT_THINKING_BUDGET,
}) {
  const generationConfig = { temperature, maxOutputTokens };
  // Tetto al ragionamento: lascia spazio garantito alla prosa di risposta.
  if (thinkingBudget != null) {
    generationConfig.thinkingConfig = { thinkingBudget };
  }
  const payload = {
    contents: toGeminiContents(messages),
    generationConfig,
  };
  // systemInstruction = blocco fisso (kit) in testa: precede sempre i contents variabili.
  if (system && system.trim()) {
    payload.systemInstruction = { parts: [{ text: system }] };
  }
  return payload;
}

export async function requestCompletion({
  system,
  messages,
  model,
  temperature,
  maxOutputTokens,
  thinkingBudget,
  provider = process.env.AI_PROVIDER || 'google',
}) {
  if (provider !== 'google') {
    throw new Error(`Provider AI non supportato: "${provider}". In M3 è disponibile solo "google" (Gemini).`);
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Chiave AI mancante: imposta GOOGLE_API_KEY in .env.local.');
  }

  const resolvedModel = model || process.env.AI_MODEL || DEFAULT_MODEL;
  const payload = buildGeminiPayload({ system, messages, temperature, maxOutputTokens, thinkingBudget });
  const url = `${GEMINI_BASE}/${resolvedModel}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Errore Gemini ${response.status}: ${body.slice(0, 500)}`);
  }

  return response.json();
}

// Estrae il testo dalla risposta Gemini (candidates[0].content.parts[].text).
export function parseCompletionResponse(data) {
  if (!data) return null;
  const parts = data?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const text = parts.map((p) => p?.text || '').join('').trim();
    if (text) return text;
  }
  return null;
}
