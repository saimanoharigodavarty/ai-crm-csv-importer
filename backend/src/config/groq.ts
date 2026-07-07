import OpenAI from "openai";
import "dotenv/config";

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error("GROQ_API_KEY is not set. Add it to backend/.env");
}

export const groqClient = new OpenAI({
  apiKey,
  baseURL: "https://api.groq.com/openai/v1",
});

export const GROQ_MODEL = "llama-3.3-70b-versatile";
