import "dotenv/config";
import { runAgent0 } from "../agents/agent-0-rss-intake";
import { supabase } from "../db/client";

/**
 * Script to run Agent 0 (RSS & User Signal Intake) standalone.
 * This is designed to be run by a cron job (e.g., GitHub Actions).
 */
async function main() {
  console.log("Starting Agent 0 via script...");
  
  try {
    const result = await runAgent0();
    console.log("Agent 0 execution finished successfully.");
    console.log("Result:", JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Error running Agent 0:", error);
    process.exit(1);
  }
}

// Execute
main();
