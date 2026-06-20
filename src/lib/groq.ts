// Groq client wrapper — Section 3.2
// Uses OpenAI-compatible SDK, just pointed at Groq's endpoint

import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const MODEL = "llama-3.3-70b-versatile";
