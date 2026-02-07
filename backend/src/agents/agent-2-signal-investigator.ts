
import "dotenv/config";
import { supabase } from "../db/client";
import { callLLM, parseJSONFromLLM } from "../services/llm";

/**
 * Agent 2: Signal Investigator
 * 
 * Purpose: Analyze verified signals to categorize issues, sentiment, and extract metadata.
 * Inputs: db1_verified_signals (agent2_status='pending')
 * Outputs: db2_signal_analysis
 */

export async function runAgent2() {
  console.log("==================================================");
  console.log("[Agent 2] Signal Investigator - STARTING");
  console.log("==================================================");

  // 1. Fetch pending verified signals
  const { data: signals, error } = await supabase
    .from("db1_verified_signals")
    .select("id, title, content, brand")
    .eq("agent2_status", "pending")
    .limit(10); // Batch size

  if (error) {
    console.error("[Agent 2] Error fetching signals:", error);
    return;
  }

  if (!signals || signals.length === 0) {
    console.log("[Agent 2] No pending verified signals found.");
    return;
  }

  console.log(`[Agent 2] Analyzing ${signals.length} signals...`);

  // Process in parallel (batches of 5?)
  // For simplicity, sequential for now to avoid rate limits
  for (const signal of signals) {
    await analyzeSignal(signal);
  }

  console.log("==================================================");
  console.log("[Agent 2] Signal Investigator - COMPLETE");
  console.log("==================================================");
}

async function analyzeSignal(signal: any) {
  console.log(`[Agent 2] Analyzing Signal ${signal.id} (${signal.brand})...`);

  const prompt = `Analyze this consumer complaint signal.
  
  SIGNAL TITLE: ${signal.title}
  SIGNAL CONTENT: ${signal.content}
  BRAND: ${signal.brand}
  
  Provide analysis in this EXACT JSON format:
  {
    "product_category": "Smartphone" | "TV" | "Appliance" | "Vehicle" | "Other",
    "issue_type": "Warranty Denied" | "Service Delay" | "Defective Product" | "Rude Behavior" | "Other",
    "sentiment": "Negative" | "Neural" | "Positive",
    "severity": "Low" | "Medium" | "High" | "Critical",
    "summary": "One sentence summary of the core grievance"
  }`;

  const systemPrompt = "You are an expert consumer rights investigator. Analyze the complaint objectively.";

  try {
    // Call LLM (SLM Tier)
    const response = await callLLM(prompt, systemPrompt, { 
      tier: "SLM",
      temperature: 0.2 
    });
    
    const analysis = parseJSONFromLLM(response);

    // Save to db2_signal_analysis
    const record = {
      verified_signal_id: signal.id,
      brand_name: signal.brand,
      product_category: analysis.product_category || "Other",
      issue_type: analysis.issue_type || "Other",
      sentiment: analysis.sentiment || "Neutral",
      confidence_score: 0.9, // Placeholder
      metadata: { 
        summary: analysis.summary, 
        severity: analysis.severity 
      },
      processed_by: "agent_2",
      llm_model: "SLM-Tier", // Generic, since it rotates
      status: "approved"
    };

    const { error: insertError } = await supabase
      .from("db2_signal_analysis")
      .insert(record);

    if (insertError) {
      console.error(`[Agent 2] Error saving analysis for ${signal.id}:`, insertError);
    } else {
      console.log(`[Agent 2] Saved analysis for ${signal.id}`);
      await markSignalCompleted(signal.id);
    }

  } catch (error) {
    console.error(`[Agent 2] Analysis failed for ${signal.id}:`, error);
  }
  
  // Sleep slightly
  await new Promise(r => setTimeout(r, 1000));
}

async function markSignalCompleted(signalId: string) {
    const { error } = await supabase
        .from("db1_verified_signals")
        .update({ agent2_status: "completed" })
        .eq("id", signalId);
        
    if (error) console.error("[Agent 2] Error updating status:", error);
}

if (require.main === module) {
  runAgent2();
}
