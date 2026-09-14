// Providers sometimes wrap an otherwise complete JSON value in Markdown or prose.
// Extract only one balanced object/array; never evaluate code or repair truncated JSON.
export function normalizeStructuredResponse(text: string): string {
  const source = text.trim().replace(/^\uFEFF/, '');
  try {
    const parsed = JSON.parse(source);
    if (parsed === null || typeof parsed !== 'object') throw new Error('Expected an object or array');
    return JSON.stringify(parsed);
  } catch { /* Check for one complete structured value below. */ }
  const start = source.search(/[\[{]/);
  if (start < 0) throw new Error('AI response did not contain a JSON object or array');
  const stack: string[] = [];
  let quoted = false;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') { quoted = true; continue; }
    if (char === '{' || char === '[') stack.push(char);
    else if (char === '}' || char === ']') {
      if (stack.pop() !== (char === '}' ? '{' : '[')) throw new Error('Mismatched AI JSON delimiters');
      if (stack.length === 0) {
        const tail = source.slice(i + 1).trim();
        if (/[\[{]/.test(tail)) throw new Error('Ambiguous multiple AI JSON values');
        return JSON.stringify(JSON.parse(source.slice(start, i + 1)));
      }
    }
  }
  throw new Error('Incomplete AI JSON response');
}

export async function generateWithModelFallback(
  models: string[],
  generate: (model: string) => Promise<{ text?: string } & Record<string, any>>,
  structured: boolean,
): Promise<{ response: { text: string } & Record<string, any>; model: string }> {
  let lastError: unknown;
  for (const model of models) {
    try {
      const response = await generate(model);
      if (!response.text?.trim()) throw new Error('Empty AI response');
      const text = structured ? normalizeStructuredResponse(response.text) : response.text;
      return { response: { ...response, text }, model };
    } catch (error) {
      lastError = error;
      // Do not log provider payloads, prompts, credentials or profile content.
      console.warn(`[KONEXA] AI model ${model} could not provide a valid response; trying fallback.`);
    }
  }
  throw lastError || new Error('No Gemini model is configured');
}
