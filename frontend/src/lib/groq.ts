export const GROQ_DEFAULT_MODEL = 'qwen/qwen3.6-27b';
export const GROQ_MODELS = ['qwen/qwen3.6-27b', 'qwen/qwen3.8-27b'];
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const LS_KEY = 'groq_api_key';
const LS_MODEL = 'groq_model';

export interface AiChunk {
  title: string;
  duration_mins: number;
  difficulty: number;
}

export function getSavedGroqKey(): string {
  try {
    return localStorage.getItem(LS_KEY) || import.meta.env.VITE_GROQ_API_KEY || '';
  } catch {
    return '';
  }
}
export function saveGroqKey(k: string) {
  try { localStorage.setItem(LS_KEY, k); } catch { /* ignore */ }
}
export function getSavedGroqModel(): string {
  try {
    return localStorage.getItem(LS_MODEL) || GROQ_DEFAULT_MODEL;
  } catch {
    return GROQ_DEFAULT_MODEL;
  }
}
export function saveGroqModel(m: string) {
  try { localStorage.setItem(LS_MODEL, m); } catch { /* ignore */ }
}

function clampChunk(t: unknown, goal: string, fallbackDiff: number): AiChunk {
  const o = (t ?? {}) as Record<string, unknown>;
  const title = typeof o.title === 'string' && o.title.trim() ? o.title.trim().slice(0, 120) : `${goal}: Study block`;
  const durRaw = typeof o.duration_mins === 'number' ? o.duration_mins : 40;
  const diffRaw = typeof o.difficulty === 'number' ? o.difficulty : fallbackDiff;
  return {
    title,
    duration_mins: Math.max(25, Math.min(60, Math.round(durRaw))),
    difficulty: Math.max(1, Math.min(5, Math.round(diffRaw))),
  };
}

export async function decomposeWithQwen(
  apiKey: string,
  model: string,
  goal: string,
  subjectName: string,
  difficulty: number,
): Promise<{ chunks: AiChunk[]; model: string }> {
  const sys = `You are a study-plan decomposer. Break the student's goal into exactly 4 sequential micro-tasks with progressive difficulty and chained prerequisites. Reply with ONLY a JSON object of shape {"tasks":[{"title":string,"duration_mins":number (25-60),"difficulty":number (1-5)}]}. Keep titles short (under 12 words), concrete, and subject-specific. No markdown, no extra text.`;
  const user = `Goal: "${goal}". Subject: ${subjectName}. Target difficulty: ${difficulty}/5.`;

  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
        temperature: 0.4,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });
  } catch {
    throw new Error('Could not reach Groq API (network error). Check your connection.');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 401) throw new Error('Groq rejected the API key (401). Paste a valid key from console.groq.com.');
    if (res.status === 429) throw new Error('Groq rate limit hit (429). Wait a minute and retry.');
    throw new Error(`Groq error ${res.status}: ${body.slice(0, 160) || 'request failed'}`);
  }
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content ?? '';
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Qwen returned non-JSON output. Try again.');
    parsed = JSON.parse(m[0]);
  }
  const arr = (parsed as { tasks?: unknown }).tasks;
  if (!Array.isArray(arr) || arr.length === 0) throw new Error('Qwen returned no tasks. Try again.');
  const chunks = arr.slice(0, 4).map(t => clampChunk(t, goal, difficulty));
  while (chunks.length < 4) chunks.push({ title: `${goal}: Review & self-test`, duration_mins: 30, difficulty });
  return { chunks, model };
}
