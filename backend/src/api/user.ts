import { Router, Request, Response } from "express";
import { runAgent3 } from "../agents/case-analyzer";
import { runAgent4 } from "../agents/guidance-generator";
import { supabase } from "../index";

const router = Router();

/**
 * POST /api/user/query
 * Submit a user query and get AI-powered guidance
 */
router.post("/query", async (req: Request, res: Response) => {
  try {
    const { brand, product, issue, city, state } = req.body;

    if (!brand || !product || !issue) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: brand, product, issue",
      });
    }

    console.log(`[User Query] ${brand} ${product} - ${city || "N/A"}`);

    const userQuery = { brand, product, issue, city, state };

    // Run Agent 3: Case Analyzer
    const analysis = await runAgent3(userQuery);

    // Run Agent 4: Guidance Generator
    const guidance = await runAgent4(userQuery, analysis);

    // Store in db4_user_queries
    const { data: queryRecord, error: dbError } = await supabase
      .from("db4_user_queries")
      .insert({
        brand_name: brand,
        product_name: product,
        issue_description: issue,
        user_city: city,
        user_state: state,
        
        // Matched knowledge
        matched_case_pattern_id: analysis.matchedPatternId,
        matched_contacts: guidance.contacts,
        
        // Analysis
        issue_category: analysis.issueCategory,
        severity: analysis.severity,
        similar_signal_ids: analysis.similarSignalIds,
        confidence_level: analysis.confidenceLevel,
        
        // Guidance
        ai_guidance_summary: guidance.summary,
        ai_suggested_steps: guidance.suggestedSteps,
        ai_expectations: guidance.expectations,
        ai_legal_rights: guidance.legalRights,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[User Query] Error storing query:", dbError);
    }

    return res.json({
      success: true,
      queryId: queryRecord?.id,
      guidance,
    });
  } catch (error: any) {
    console.error("[User Query] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process query",
    });
  }
});

/**
 * GET /api/user/query/:id
 * Get a specific user query by ID
 */
router.get("/query/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("db4_user_queries")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: "Query not found",
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("[Get Query] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch query",
    });
  }
});

/**
 * POST /api/user/feedback
 * Submit feedback for a query
 */
router.post("/feedback", async (req: Request, res: Response) => {
  try {
    const { queryId, wasHelpful, feedback } = req.body;

    if (!queryId) {
      return res.status(400).json({
        success: false,
        error: "Missing queryId",
      });
    }

    const { error } = await supabase
      .from("db4_user_queries")
      .update({
        was_helpful: wasHelpful,
        user_feedback: feedback,
        feedback_at: new Date().toISOString(),
      })
      .eq("id", queryId);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: "Feedback recorded",
    });
  } catch (error: any) {
    console.error("[User Feedback] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to record feedback",
    });
  }
});

/**
 * GET /api/user/stats
 * Get aggregate statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const { count: totalQueries } = await supabase
      .from("db4_user_queries")
      .select("*", { count: "exact", head: true });

    const { data: bySeverity } = await supabase
      .from("db4_user_queries")
      .select("severity")
      .not("severity", "is", null);

    const severityCounts = (bySeverity || []).reduce((acc, item) => {
      acc[item.severity] = (acc[item.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return res.json({
      success: true,
      data: {
        totalQueries: totalQueries || 0,
        bySeverity: severityCounts,
      },
    });
  } catch (error: any) {
    console.error("[User Stats] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch stats",
    });
  }
});

export default router;
