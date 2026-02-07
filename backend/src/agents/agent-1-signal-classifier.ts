
import "dotenv/config";
import { supabase } from "../db/client";
import { callLLM, parseJSONFromLLM } from "../services/llm";
import { rateLimiter, RATE_LIMIT_CONFIGS } from "../services/rate-limiter";

/**
 * Agent 1: Signal Classifier
 * 
 * Purpose: Extract structured metadata from raw signals using AI
 * Reads from: db1_signal_intake (status='pending')
 * Writes to: db1_verified_signals
 * LLM Calls: 1 call per batch (default 20 signals)
 * 
 * Uses rate limiting to prevent quota exhaustion
 */

interface SignalRecord {
  id: string;
  title: string;
  content: string;
  source: string;
}

interface ClassifiedSignal {
  id: string;
  brand_name: string | null;
  product_category: string | null;
  issue_type: string | null;
  sentiment: string;
  contains_contact_info: boolean;
  confidence_score: number;
}

/**
 * Classify a batch of signals using AI
 */
async function classifySignalBatch(signals: SignalRecord[]): Promise<ClassifiedSignal[]> {
  // Prepare batch prompt
  const signalsData = signals.map((s, idx) => ({
    index: idx,
    id: s.id,
    title: s.title,
    content: s.content.substring(0, 500), // Limit to 500 chars
  }));

  const prompt = `Analyze these consumer complaint signals and extract structured data.

SIGNALS:
${JSON.stringify(signalsData, null, 2)}

For each signal, extract:
- brand_name: Brand mentioned (e.g., "Samsung", "LG", "OnePlus") or null
- product_category: Product type (e.g., "Refrigerator", "Smartphone") or null
- issue_type: Problem category (e.g., "warranty_dispute", "defect", "service_delay") or null
- sentiment: "positive", "negative", or "neutral"
- contains_contact_info: true if signal contains phone/email/address
- confidence_score: 0.0-1.0 based on clarity of information

Return a JSON array with same order as input.`;

  const systemPrompt = `You are a data extraction assistant. Extract structured information from consumer complaints accurately. Return valid JSON only.`;

  try {
    // Apply rate limiting before making LLM call
    await rateLimiter.checkAndWait(RATE_LIMIT_CONFIGS.agent_1);
    
    // Use SLM Tier (Cost Optimized)
    const response = await callLLM(prompt, systemPrompt, {
      tier: "SLM",
      temperature: 0.1, // Low temp for consistent extraction
      maxTokens: 4096,  // Larger output for batch
    });

    const parsed = parseJSONFromLLM(response);

    // Map results back to signal IDs
    const results: ClassifiedSignal[] = parsed.map((item: any, idx: number) => ({
      id: signals[idx].id,
      brand_name: item.brand_name || null,
      product_category: item.product_category || null,
      issue_type: item.issue_type || null,
      sentiment: item.sentiment || "neutral",
      contains_contact_info: item.contains_contact_info || false,
      confidence_score: item.confidence_score || 0.5,
    }));

    return results;
  } catch (error) {
    console.error("[Agent 1] Classification failed:", error);
    throw error;
  }
}

/**
 * Main Agent 1 function
 * Process signals in batches
 */
export async function runAgent1(batchSize: number = 20): Promise<{ processed: number; llmCalls: number }> {
  console.log("==================================================");
  console.log("[Agent 1] Signal Classifier Agent - STARTING");
  console.log("==================================================");

  // Fetch unprocessed signals from db1_signal_intake
  const { data: signals, error } = await supabase
    .from("db1_signal_intake")
    .select("id, title, content, source")
    .eq("status", "pending")
    .limit(batchSize);

  if (error) {
    console.error("[Agent 1] Error fetching signals:", error);
    return { processed: 0, llmCalls: 0 };
  }

  if (!signals || signals.length === 0) {
    console.log("[Agent 1] No unprocessed signals found");
    return { processed: 0, llmCalls: 0 };
  }

  console.log(`[Agent 1] Found ${signals.length} unprocessed signals`);
  console.log(`[Agent 1] Classifying batch of ${signals.length} signals (1 LLM call)`);

  try {
    // Classify entire batch with 1 LLM call
    const classifications = await classifySignalBatch(signals);

    // Store results in db1_verified_signals
    const verifiedRecords = classifications.map((c, idx) => ({
      intake_id: c.id,
      title: signals[idx].title,
      content: signals[idx].content,
      source: signals[idx].source,
      verification_score: c.confidence_score,
      verification_reason: `Brand: ${c.brand_name}, Issue: ${c.issue_type}`,
      brand: c.brand_name,
      status: "pending", // Ready for Agent 2 & 3
    }));

    const { error: insertError } = await supabase
      .from("db1_verified_signals")
      .insert(verifiedRecords);

    if (insertError) {
      console.error("[Agent 1] Error storing verified signals:", insertError);
      return { processed: 0, llmCalls: 1 };
    }

    // Delete processed signals from db1_signal_intake (Immediate retention policy)
    const signalIds = signals.map((s) => s.id);
    const { error: deleteError } = await supabase
      .from("db1_signal_intake")
      .delete()
      .in("id", signalIds);

    if (deleteError) {
      console.error("[Agent 1] Error deleting processed signals:", deleteError);
    } else {
      console.log(`[Agent 1] Deleted ${signalIds.length} processed signals from intake.`);
    }

    console.log("==================================================");
    console.log("[Agent 1] Signal Classifier Agent - COMPLETE");
    console.log(`[Agent 1] Processed: ${classifications.length}/${signals.length} signals`);
    console.log(`[Agent 1] LLM calls made: 1`);
    console.log("==================================================");

    return { processed: classifications.length, llmCalls: 1 };
  } catch (error) {
    console.error("[Agent 1] Batch processing failed:", error);
    
    // Mark signals as failed
    const signalIds = signals.map((s) => s.id);
    await supabase
      .from("db1_signal_intake") // Fix table name
      .update({ status: "rejected" })
      .in("id", signalIds);

    return { processed: 0, llmCalls: 1 }; // LLM was called even if it failed
  }
}

if (require.main === module) {
    runAgent1().catch(console.error);
}
