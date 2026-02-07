
import "dotenv/config";
import { supabase } from "../db/client";

/**
 * Agent 4: Data Synthesizer
 * 
 * Purpose: Consolidate data from Tier 2 (Analysis/Extraction) into Tier 3 (Golden Data)
 * Inputs: db2_contact_extractions, db2_signal_analysis
 * Outputs: db3_brand_contacts, db3_case_patterns
 */

export async function runAgent4() {
  console.log("==================================================");
  console.log("[Agent 4] Data Synthesizer - STARTING");
  console.log("==================================================");

  await synthesizeContacts();
  // await synthesizePatterns(); // TODO: Implement pattern aggregation logic

  console.log("==================================================");
  console.log("[Agent 4] Data Synthesizer - COMPLETE");
  console.log("==================================================");
}

async function synthesizeContacts() {
  console.log("[Agent 4] Synthesizing Contacts...");

  // 1. Fetch unprocessed extractions
  const { data: extractions, error } = await supabase
    .from("db2_contact_extractions")
    .select("*")
    .is("processed_at", null)
    .limit(50);

  if (error) {
    console.error("[Agent 4] Error fetching extractions:", error);
    return;
  }

  if (!extractions || extractions.length === 0) {
    console.log("[Agent 4] No new contact extractions to process.");
    return;
  }

  console.log(`[Agent 4] Processing ${extractions.length} contact extractions...`);

  let newContacts = 0;
  let updatedContacts = 0;

  for (const extraction of extractions) {
    // 2. Upsert to db3_brand_contacts
    // Constraint: unique_brand_contact (brand_name, contact_value)
    
    const contactRecord = {
      brand_name: extraction.brand_name,
      contact_type: extraction.contact_type,
      contact_value: extraction.contact_value,
      source: extraction.source_url,
      confidence_score: extraction.confidence_score,
      is_active: true,
      verified: extraction.confidence_score > 0.8, // Auto-verify high confidence
      last_updated: new Date().toISOString(),
      // Default fields
      priority: 5,
      purpose: "general_support"
    };

    const { data: upsertData, error: upsertError } = await supabase
      .from("db3_brand_contacts")
      .upsert(contactRecord, { 
        onConflict: "brand_name, contact_value",
        ignoreDuplicates: false 
      })
      .select();

    if (upsertError) {
      console.error(`[Agent 4] Error upserting contact for ${extraction.brand_name}:`, upsertError.message);
    } else {
        // status check logic could go here to see if inserted or updated
        newContacts++; 
    }

    // 3. Mark extraction as processed
    await supabase
      .from("db2_contact_extractions")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", extraction.id);
  }

  console.log(`[Agent 4] Contacts Processed. (Upserted batch)`);
}

if (require.main === module) {
  runAgent4();
}
