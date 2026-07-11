import OpenAI from "openai";

let clientInstance: OpenAI | null = null;

export function getCerebrasClient(): OpenAI {
  if (clientInstance) return clientInstance;

  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error("CEREBRAS_API_KEY is not set. Please add it to your environment variables.");
  }

  clientInstance = new OpenAI({
    apiKey,
    baseURL: "https://api.cerebras.ai/v1",
    timeout: 15000, // 15 seconds timeout
  });

  return clientInstance;
}

export const CEREBRAS_MODEL = "gpt-oss-120b";
