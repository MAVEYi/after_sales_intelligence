import "dotenv/config";
import { runIntakePipeline } from "../services/pipeline-orchestrator";

/**
 * Script to run the Intake Pipeline (Agent 0 + Agent 1).
 * This is designed to be run by a cron job (e.g., GitHub Actions).
 */
async function main() {
  console.log("Starting Intake Pipeline via script...");
  
  try {
    const result = await runIntakePipeline();
    console.log("Pipeline execution finished successfully.");
    console.log("Result:", JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Error running pipeline:", error);
    process.exit(1);
  }
}

// Execute
main();
