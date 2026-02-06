import Groq from "groq-sdk";
import "dotenv/config";

/**
 * Groq AI Service
 * Wrapper for Groq API calls with error handling and retry logic
 */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface GroqCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Call Groq API with a prompt
 */
export async function callGroq(
  prompt: string,
  systemPrompt?: string,
  options: GroqCompletionOptions = {}
): Promise<string> {
  const {
    model = "llama-3.1-8b-instant", // 14.4K RPD - optimal for 100+ users/day
    temperature = 0.3,
    maxTokens = 2048,
  } = options;

  try {
    const messages: any[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt,
      });
    }
    
    messages.push({
      role: "user",
      content: prompt,
    });

    const completion = await groq.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("[Groq] API Error:", error.message);
    throw new Error(`Groq API failed: ${error.message}`);
  }
}

/**
 * Test Groq API connectivity
 */
export async function testGroqConnection(): Promise<boolean> {
  try {
    const response = await callGroq(
      "Respond with exactly 'OK' if you can read this.",
      "You are a test assistant. Follow instructions exactly."
    );
    
    console.log("[Groq] Test response:", response);
    return response.toLowerCase().includes("ok");
  } catch (error) {
    console.error("[Groq] Connection test failed:", error);
    return false;
  }
}

/**
 * Parse structured JSON from LLM response
 * Handles cases where LLM wraps JSON in markdown code blocks
 */
export function parseJSONFromLLM(response: string): any {
  try {
    // Remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/```\s*$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }
    
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("[Groq] Failed to parse JSON from LLM response:", response);
    throw new Error("Invalid JSON response from LLM");
  }
}
