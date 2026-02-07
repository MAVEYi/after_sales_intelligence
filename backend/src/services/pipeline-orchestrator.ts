import { runAgent0 } from "../agents/agent-0-rss-intake";
import { runAgent1 } from "../agents/agent-1-signal-classifier";
import { runAgent2 } from "../agents/agent-2-signal-investigator";
import { runAgent3 } from "../agents/agent-3-contact-hunter";
import { runAgent4 } from "../agents/agent-4-synthesizer";

/**
 * Orchestrates the data intake and processing pipeline.
 * Chains Agent 0 (Intake) -> Agent 1 (Classification) -> Agent 2 & 3 (Investigation) -> Agent 4 (Synthesis)
 */
export async function runIntakePipeline() {
  console.log("Starting Full Intake Pipeline...");
  const startTime = Date.now();

  try {
    // Step 1: Run Agent 0 (RSS Intake)
    console.log("\n--- Step 1: Running Agent 0 (RSS Intake) ---");
    const agent0Result = await runAgent0();
    
    // Step 2: Run Agent 1 (Signal Classification)
    console.log("\n--- Step 2: Running Agent 1 (Signal Classification) ---");
    const agent1Result = await runAgent1();

    // Step 3: Run Agents 2 & 3 (Sequential Loop)
    // Looping 3 times to process more backlog items per run
    const LOOP_ITERATIONS = 3;
    console.log(`\n--- Step 3: Running Agents 2 & 3 (Loop x${LOOP_ITERATIONS}) ---`);

    for (let i = 1; i <= LOOP_ITERATIONS; i++) {
        console.log(`\n[Loop ${i}/${LOOP_ITERATIONS}] Starting Agent 2 (Signal Investigator)...`);
        await runAgent2();
        
        console.log(`\n[Loop ${i}/${LOOP_ITERATIONS}] Starting Agent 3 (Contact Hunter)...`);
        await runAgent3();

        if (i < LOOP_ITERATIONS) {
            console.log(`[Loop ${i}/${LOOP_ITERATIONS}] Cooling down for 2s...`);
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // Step 4: Run Agent 4 (Synthesizer)
    console.log("\n--- Step 4: Running Agent 4 (Data Synthesizer) ---");
    await runAgent4();

    const duration = (Date.now() - startTime) / 1000;
    console.log(`\nPipeline Completed in ${duration.toFixed(2)}s`);
    console.log("Summary:");
    console.log(`- New Signals Fetched: ${agent0Result.total}`);
    console.log(`- Signals Classified: ${agent1Result.processed}`);
    console.log(`- Downstream Agents (2, 3, 4) executed.`);

    return {
      success: true,
      agent0: agent0Result,
      agent1: agent1Result,
    };
  } catch (error) {
    console.error("Pipeline Execution Failed:", error);
    throw error;
  }
}
