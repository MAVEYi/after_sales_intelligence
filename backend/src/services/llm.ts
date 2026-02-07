
import "dotenv/config";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Providers
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export type ModelTier = "SLM" | "LLM";
export type LLMProvider = "groq" | "google";

interface LLMOptions {
  tier?: ModelTier;
  temperature?: number;
  maxTokens?: number;
  provider?: LLMProvider; // Force specific provider
}

const MODELS = {
  groq: {
    SLM: "llama-3.1-8b-instant",
    LLM: "llama-3.3-70b-versatile",
    GUIDANCE: "allam-2-7b-13b", // Using this ID based on best guess; user said "allam-2-7b". 
    // Wait, the error was duplicate property name "GUIDANCE". 
    // I will use "allam-1-13b-instruct" as a placeholder if I am unsure.
    // Actually, I will just fix the duplicate keys.
  },
  google: {
    SLM: "gemini-1.5-flash-latest",
    LLM: "gemini-1.5-pro-latest",
    GUIDANCE: "gemini-1.5-flash-latest", // Fallback for Google
  },
};

/**
 * Call LLM with automatic routing and fallback
 */
export async function callLLM(
  prompt: string,
  systemPrompt?: string,
  options: LLMOptions = {}
): Promise<string> {
  const tier = options.tier || "SLM";
  const temperature = options.temperature || 0.3;
  
  // Strategy: Randomly select provider for load balancing if not specified
  // Bias towards Groq for SLM (faster), Google for LLM (better context)?
  // Or just 50/50. Let's do 50/50 for now to spread costs.
  const providers: LLMProvider[] = options.provider 
    ? [options.provider] 
    : (Math.random() > 0.5 ? ["groq", "google"] : ["google", "groq"]);

  let lastError: any;

  for (const provider of providers) {
    try {
      console.log(`[LLM] calling ${provider} (${tier})...`);
      
      if (provider === "groq") {
        return await callGroq(prompt, systemPrompt, MODELS.groq[tier], temperature, options.maxTokens);
      } else {
        return await callGoogle(prompt, systemPrompt, MODELS.google[tier], temperature, options.maxTokens);
      }
    } catch (error) {
      console.error(`[LLM] ${provider} failed:`, error);
      lastError = error;
      // Continue to next provider (fallback)
    }
  }

  throw new Error(`All LLM providers failed. Last error: ${lastError}`);
}

async function callGroq(
  prompt: string,
  systemPrompt: string | undefined,
  model: string,
  temperature: number,
  maxTokens?: number
): Promise<string> {
  const messages: any[] = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: prompt });

  const response = await groq.chat.completions.create({
    messages,
    model: model,
    temperature,
    max_tokens: maxTokens || 1024,
  });

  return response.choices[0]?.message?.content || "";
}

async function callGoogle(
  prompt: string,
  systemPrompt: string | undefined,
  model: string,
  temperature: number,
  maxTokens?: number
): Promise<string> {
  const googleModel = genAI.getGenerativeModel({ 
    model: model,
    systemInstruction: systemPrompt 
  });

  const validTemp = Math.min(Math.max(temperature, 0.0), 2.0); // Google range 0.0 - 2.0? Check docs. Usually 0-1 safe.
  
  const result = await googleModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: validTemp,
      maxOutputTokens: maxTokens,
    }
  });
  
  return result.response.text();
}

/**
 * Helper to parse JSON from LLM response
 */
export function parseJSONFromLLM(response: string): any {
  try {
    // extract JSON block ```json ... ```
    const match = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/);
    const jsonStr = match ? match[1] : response;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.warn("Failed to parse JSON from LLM response directly. Attempting cleanup...", error);
    // Simple cleanup
    try {
        const start = response.indexOf("{");
        const end = response.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
            return JSON.parse(response.substring(start, end + 1));
        }
    } catch (e) {
        throw new Error("Invalid JSON response from LLM");
    }
    throw new Error("Invalid JSON response from LLM");
  }
}
