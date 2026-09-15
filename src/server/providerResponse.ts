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

/** Allowlisted diagnostics only. Never return an error message or provider body. */
export function providerFailure(error: unknown) {
  const value = error as { status?: unknown; statusCode?: unknown; code?: unknown; name?: unknown; message?: unknown } | null;
  const status = Number(value?.status ?? value?.statusCode);
  const httpStatus = Number.isInteger(status) && status >= 400 && status <= 599 ? status : null;
  const message = typeof value?.message === 'string' ? value.message : '';
  const code = httpStatus === 429 ? 'AI_RATE_LIMITED'
    : httpStatus === 401 || httpStatus === 403 ? 'AI_PROVIDER_ACCESS'
    : httpStatus === 404 ? 'AI_MODEL_UNAVAILABLE'
    : httpStatus !== null && httpStatus >= 500 ? 'AI_PROVIDER_UNAVAILABLE'
    : value?.name === 'AbortError' || value?.name === 'TimeoutError' || /timeout|timed out|aborted/i.test(message) ? 'AI_TIMEOUT'
    : value?.code === 'AI_OUTPUT_LIMIT' ? 'AI_OUTPUT_LIMIT'
    : value?.code === 'AI_EMPTY_RESPONSE' ? 'AI_EMPTY_RESPONSE'
    : httpStatus === 400 ? 'AI_REQUEST_REJECTED'
    : error instanceof SyntaxError || /JSON|structured|assessment/i.test(message) ? 'AI_INVALID_RESPONSE'
    : 'AI_GENERATION_FAILED';
  return { code, httpStatus };
}

export async function generateWithModelFallback(
  models: string[],
  generate: (model: string) => Promise<{ text?: string } & Record<string, any>>,
  structured: boolean,
  validate?: (value: any) => void,
): Promise<{ response: { text: string } & Record<string, any>; model: string }> {
  let lastError: unknown;
  for (const [index, model] of models.entries()) {
    const started = Date.now();
    try {
      const response = await generate(model);
      if (response.candidates?.[0]?.finishReason === 'MAX_TOKENS') throw Object.assign(new Error('AI output limit reached'), { code: 'AI_OUTPUT_LIMIT' });
      if (!response.text?.trim()) throw Object.assign(new Error('Empty AI response'), { code: 'AI_EMPTY_RESPONSE' });
      const text = structured ? normalizeStructuredResponse(response.text) : response.text;
      // Validation belongs inside the retry boundary, not after choosing a model.
      if (validate) validate(structured ? JSON.parse(text) : text);
      return { response: { ...response, text }, model };
    } catch (error) {
      lastError = error;
      // Do not log provider payloads, prompts, credentials or profile content.
      const diagnostic = providerFailure(error);
      console.warn('[KONEXA] AI generation failed', JSON.stringify({ model: /^[a-z0-9._:-]{1,100}$/i.test(model) ? model : 'configured-model', ...diagnostic, elapsedMs: Date.now() - started }));
      if (index < models.length - 1 && ['AI_PROVIDER_UNAVAILABLE', 'AI_RATE_LIMITED', 'AI_TIMEOUT'].includes(diagnostic.code)) await new Promise(resolve => setTimeout(resolve, 400 + Math.floor(Math.random() * 200)));
    }
  }
  throw lastError || new Error('No Gemini model is configured');
}
