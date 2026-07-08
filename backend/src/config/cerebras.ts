import OpenAI from "openai";
import "dotenv/config";

const apiKey = process.env.CEREBRAS_API_KEY;

if (!apiKey) {
  throw new Error("CEREBRAS_API_KEY is not set. Add it to backend/.env");
}

export const cerebrasClient = new OpenAI({
  apiKey,
  baseURL: "https://api.cerebras.ai/v1",
});

export const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL || "gpt-oss-120b";