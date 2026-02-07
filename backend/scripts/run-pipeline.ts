
import "dotenv/config";
import { runAgent0 } from "../src/agents/agent-0-rss-intake";
import { runAgent1 } from "../src/agents/agent-1-signal-classifier";
import { runAgent2 } from "../src/agents/agent-2-signal-investigator";
import { runAgent3 } from "../src/agents/agent-3-contact-hunter";

import { runAgent4 } from "../src/agents/agent-4-synthesizer";

async function main() {
  console.log("🚀 Starting After-Sales Intelligence Pipeline...");
  console.log("==================================================");

  // --- Tier 1: Intake ---
  console.log("\n[Tier 1] Running Agent 0 (RSS Intake)...");
  await runAgent0();

  // --- Tier 1 -> 2: Verification ---
  console.log("\n[Tier 1->2] Running Agent 1 (Signal Verifier)...");
  await runAgent1(20); // Batch size 20

  // --- Tier 2: Analysis & Extraction (Parallel) ---
  console.log("\n[Tier 2] Running Agent 2 (Investigator) & Agent 3 (Contact Hunter)...");
  
  await Promise.all([
    runAgent2(),
    runAgent3()
  ]);

  // --- Tier 3: Synthesis ---
  console.log("\n[Tier 3] Running Agent 4 (Synthesizer)...");
  await runAgent4();

  console.log("\n✅ Pipeline Execution Complete!");
  console.log("==================================================");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("❌ Pipeline failed:", err);
    process.exit(1);
  });
}
