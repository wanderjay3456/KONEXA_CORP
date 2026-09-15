import { GoogleGenAI } from "@google/genai";
import { generateWithModelFallback } from './providerResponse';

let client: GoogleGenAI | null = null;

const defaultModels = (process.env.GEMINI_MODELS || "gemini-3.5-flash-lite,gemini-3.5-flash")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

export function getAIClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is required");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function generateGeminiContent(request: Record<string, any>, models = defaultModels) {
  const { validateResponse, ...providerRequest } = request;
  return generateWithModelFallback(models, async model => {
    const response = await getAIClient().models.generateContent({
      ...providerRequest, model,
      config: { ...request.config, httpOptions: { ...request.config?.httpOptions, timeout: Math.max(1_000, Math.min(25_000, Number(request.config?.httpOptions?.timeout) || 25_000)) } },
    } as any);
    return { ...response, text: response.text };
  }, request.config?.responseMimeType === 'application/json', validateResponse);
}
