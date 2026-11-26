const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("AI features are not configured. Set GEMINI_API_KEY.");
  return key;
}

async function postGemini<T>(model: string, method: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_ROOT}/${model}:${method}?key=${apiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return response.json() as Promise<T>;
}

export async function embedText(text: string): Promise<number[]> {
  const result = await postGemini<{ embedding?: { values?: number[] } }>(
    process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
    "embedContent",
    { content: { parts: [{ text }] } },
  );
  const values = result.embedding?.values;
  if (!values?.length) throw new Error("Gemini returned an empty embedding.");
  return values;
}

export async function generateText(prompt: string): Promise<string> {
  const result = await postGemini<{
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  }>(process.env.GEMINI_MODEL || "gemini-2.5-flash", "generateContent", {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 1200 },
  });
  const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!text) throw new Error("Gemini returned no answer.");
  return text;
}

export async function generateJson<T>(prompt: string): Promise<T> {
  const text = await generateText(`${prompt}\n\nReturn only valid JSON, with no markdown fences.`);
  try {
    return JSON.parse(text) as T;
  } catch {
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) throw new Error("AI response was not valid JSON. Please try again.");
    return JSON.parse(json) as T;
  }
}

export function splitIntoChunks(text: string, maxLength = 1200): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of normalized.split(/\n{2,}/)) {
    let remaining = paragraph.trim();
    while (remaining.length > maxLength) {
      const cut = remaining.lastIndexOf(" ", maxLength);
      const index = cut > maxLength * 0.6 ? cut : maxLength;
      const part = remaining.slice(0, index).trim();
      if (current) chunks.push(current);
      chunks.push(part);
      current = "";
      remaining = remaining.slice(index).trim();
    }
    if (!remaining) continue;
    if ((current ? current.length + 2 : 0) + remaining.length > maxLength) {
      if (current) chunks.push(current);
      current = remaining;
    } else {
      current = current ? `${current}\n\n${remaining}` : remaining;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}
