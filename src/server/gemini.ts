import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

const defaultModels = (process.env.GEMINI_MODELS || "gemini-3.5-flash,gemini-3.1-flash-lite")
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
  let lastError: unknown;
  for (const model of models) {
    try {
      const response = await getAIClient().models.generateContent({ ...request, model } as any);
      return { response, model };
    } catch (error) {
      lastError = error;
      console.warn(`[KONEXA] Gemini model ${model} failed; trying the next configured model:`, error instanceof Error ? error.message : error);
    }
  }
  throw lastError || new Error("No Gemini model is configured");
}
