import { Router, Request, Response } from "express";
import { runAgent0 } from "../agents/agent-0-rss-intake";
import { runAgent1 } from "../agents/agent-1-signal-classifier";
import { supabase } from "../index";

const router = Router();

/**
 * POST /api/signals/fetch
 * Trigger Agent 0: Fetch new signals from RSS feeds
 */
router.post("/fetch", async (_req: Request, res: Response) => {
  try {
    const result = await runAgent0();
    
    return res.json({
      success: true,
      message: `Collected ${result.total} new signals`,
      data: result,
    });
  } catch (error: any) {
    console.error("[API /signals/fetch] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch signals",
    });
  }
});

/**
 * POST /api/signals/process
 * Trigger Agent 1: Process pending signals
 */
router.post("/process", async (req: Request, res: Response) => {
  try {
    const { batchSize = 20 } = req.body;
    
    const result = await runAgent1(batchSize);
    
    return res.json({
      success: true,
      message: `Processed ${result.processed} signals with ${result.llmCalls} LLM calls`,
      data: result,
    });
  } catch (error: any) {
    console.error("[API /signals/process] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process signals",
    });
  }
});

/**
 * GET /api/signals/stats
 * Get signal statistics
 */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    // Count signals in db1
    const { count: total } = await supabase
      .from("db1_signals")
      .select("*", { count: "exact", head: true });

    const { count: processed } = await supabase
      .from("db1_signals")
      .select("*", { count: "exact", head: true })
      .eq("status", "processed");

    const { count: pending } = await supabase
      .from("db1_signals")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Count by source
    const { data: bySource } = await supabase
      .from("db1_signals")
      .select("source");

    const sourceCounts = (bySource || []).reduce((acc: Record<string, number>, item: any) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return res.json({
      success: true,
      data: {
        total: total || 0,
        processed: processed || 0,
        unprocessed: pending || 0,
        by_source: sourceCounts,
      },
    });
  } catch (error: any) {
    console.error("[API /signals/stats] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch stats",
    });
  }
});

/**
 * GET /api/signals/rate-limit-status
 * Get current rate limit usage
 */
router.get("/rate-limit-status", async (_req: Request, res: Response) => {
  try {
    const { rateLimiter } = await import("../services/rate-limiter");
    const stats = rateLimiter.getStats();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("[API /signals/rate-limit-status] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch rate limit status",
    });
  }
});

export default router;
