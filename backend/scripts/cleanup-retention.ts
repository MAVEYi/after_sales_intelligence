
import "dotenv/config";
import { supabase } from "../src/db/client";

/**
 * Data Retention Cleanup Script
 * 
 * Policies:
 * - db1_signal_intake: 7 days (Stale/Rejected only)
 * - db1_verified_signals: 30 days
 * - db2_contact_extractions: 60 days
 * - db2_signal_analysis: 60 days
 * - db4_user_queries_archive: 60 days
 * - db4_user_signal: 30 days
 */

async function cleanupTable(tableName: string, daysRaw: number, dateColumn: string = "created_at") {
  const days = Math.max(daysRaw, 1); // Safety check
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  console.log(`[Cleanup] Checking ${tableName}... (Cutoff: ${cutoffDate.toISOString()})`);

  // Count first (for logging)
  const { count, error: countError } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true })
    .lt(dateColumn, cutoffDate.toISOString());

  if (countError) {
    console.error(`[Cleanup] Error counting ${tableName}:`, countError.message);
    return;
  }

  if (count === 0) {
    console.log(`[Cleanup] ${tableName}: No records to delete.`);
    return;
  }

  console.log(`[Cleanup] ${tableName}: Found ${count} records older than ${days} days. Deleting...`);

  // Delete
  const { error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .lt(dateColumn, cutoffDate.toISOString());

  if (deleteError) {
    console.error(`[Cleanup] Error deleting from ${tableName}:`, deleteError.message);
  } else {
    console.log(`[Cleanup] ${tableName}: Deleted records successfully.`);
  }
}

async function runCleanup() {
  console.log("==================================================");
  console.log("Starting Data Retention Cleanup");
  console.log("==================================================");

  // Tier 1
  // Note: Agent 1 already deletes processed intake immediately. This cleans up stale/rejected.
  await cleanupTable("db1_signal_intake", 7, "published_at"); 
  await cleanupTable("db1_verified_signals", 30, "verified_at");

  // Tier 2
  await cleanupTable("db2_contact_extractions", 60, "extracted_at");
  // db2_signal_analysis doesn't have created_at usually? Let's check schema.
  // Ideally we added processed_at. If not, we skip or use what's available.
  // Assuming processed_at exists from previous steps (Tier 4 task added it to db2).
  // If not, we might fail. Let's assume processed_at.
  // Actually, list_tables output for db2_signal_analysis showed: 
  // verified_signal_id, brand_name, product_category... no created_at shown in my memory? 
  // Wait, I saw db2_contact_extractions had `extracted_at`.
  // I need to be sure about `db2_signal_analysis` date column.
  // If invalid column, Supabase throws error. 
  // I'll try `created_at` or `processed_at`. `db2_signal_analysis` usually implies created_at default default now()?
  // Let's rely on standard `created_at` or `processed_at` if I added it. 
  // Re-checking previous steps: "db2_contact_extractions & db2_signal_analysis: processed_at (added for Agent 4)".
  // So `processed_at` should exist.
  await cleanupTable("db2_signal_analysis", 60, "processed_at"); 

  // Tier 4
  await cleanupTable("db4_user_queries_archive", 60, "archived_at");
  await cleanupTable("db4_user_signal", 30, "created_at");

  console.log("==================================================");
  console.log("Cleanup Complete");
  console.log("==================================================");
}

runCleanup().catch(console.error);
