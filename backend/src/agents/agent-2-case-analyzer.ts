import "dotenv/config";
import { supabase } from "../index";
import { callGroq, parseJSONFromLLM } from "../services/groq";
import { rateLimiter, RATE_LIMIT_CONFIGS } from "../services/rate-limiter";
import type { UserQuery, CasePattern, CaseAnalysis } from "../types/shared";

/**
 * Agent 3: Case Analyzer
 * 
 * Purpose: Analyze user query and find best matching case pattern + contacts
 * Reads from: db2_signal_analysis, db3_case_patterns, db3_brand_contacts
 * Writes to: db4_user_queries (partial)
 * LLM Calls: 1 per user query
 */


/**
 * Search for best matching case pattern in db3
 */
async function searchCasePattern(query: UserQuery): Promise<CasePattern | null> {
  // Search for exact brand match first
  let searchQuery = supabase
    .from("db3_case_patterns")
    .select("*")
    .ilike("brand_name", `%${query.brand}%`)
    .order("success_rate", { ascending: false })
    .limit(5);

  if (query.product) {
    searchQuery = searchQuery.ilike("product_category", `%${query.product}%`);
  }

  const { data, error } = await searchQuery;

  if (error || !data || data.length === 0) {
    console.log("[Agent 3] No case patterns found");
    return null;
  }

  // Return best pattern (highest success rate)
  return data[0] as CasePattern;
}

/**
 * Search for similar signals in db2 (for additional context)
 */
async function searchSimilarSignals(query: UserQuery): Promise<any[]> {
  const { data, error } = await supabase
    .from("db2_signal_analysis")
    .select("id, source_signal_id, brand_name, product_category, issue_type, sentiment")
    .eq("status", "approved")
    .ilike("brand_name", `%${query.brand}%`)
    .limit(10);

  if (error) {
    console.error("[Agent 3] Error searching signals:", error);
    return [];
  }

  return data || [];
}

/**
 * Analyze case using AI
 */
async function analyzeCase(
  query: UserQuery,
  matchedPattern: CasePattern | null,
  similarSignals: any[]
): Promise<CaseAnalysis> {
  const prompt = `Analyze this consumer issue and provide structured analysis.

USER QUERY:
- Brand: ${query.brand}
- Product: ${query.product}
- Issue: ${query.issue}
- Location: ${query.city || "N/A"}, ${query.state || "N/A"}

MATCHED CASE PATTERN: ${
    matchedPattern
      ? `Issue Type: ${matchedPattern.issue_type}, Success Rate: ${matchedPattern.success_rate}, Based on ${matchedPattern.based_on_cases_count} cases`
      : "No pattern found"
  }

SIMILAR PAST SIGNALS: ${similarSignals.length} found

Provide analysis in this EXACT JSON format:
{
  "issueCategory": "warranty_dispute" | "defect" | "service_delay" | "billing" | "other",
  "severity": "low" | "medium" | "high" | "critical",
  "confidenceLevel": "high" | "medium" | "low"
}`;

  const systemPrompt = `You are a consumer rights analyst. Analyze issues accurately and categorize them consistently.`;

  try {
    await rateLimiter.checkAndWait(RATE_LIMIT_CONFIGS.agent_3);

    const response = await callGroq(prompt, systemPrompt, {
      temperature: 0.3,
      maxTokens: 1024,
    });

    const parsed = parseJSONFromLLM(response);

    return {
      issueCategory: parsed.issueCategory || matchedPattern?.issue_type || "other",
      severity: parsed.severity || "medium",
      matchedPatternId: matchedPattern?.id || null,
      matchedPattern: matchedPattern,
      similarSignalIds: similarSignals.map((s) => s.source_signal_id),
      similarCasesCount: similarSignals.length,
      confidenceLevel: parsed.confidenceLevel || (matchedPattern ? "medium" : "low"),
    };
  } catch (error) {
    console.error("[Agent 3] Analysis failed:", error);

    return {
      issueCategory: matchedPattern?.issue_type || "other",
      severity: "medium",
      matchedPatternId: matchedPattern?.id || null,
      matchedPattern: matchedPattern,
      similarSignalIds: [],
      similarCasesCount: 0,
      confidenceLevel: "low",
    };
  }
}

/**
 * Main Agent 2 function
 */
export async function runAgent2(query: UserQuery): Promise<CaseAnalysis> {
  console.log(`[Agent 2] Case Analyzer - Analyzing user query for ${query.brand}`);

  // Search for best matching case pattern
  const matchedPattern = await searchCasePattern(query);
  
  if (matchedPattern) {
  console.log(`[Agent 2] Found pattern: ${matchedPattern.issue_type} (${matchedPattern.success_rate} success rate)`);
  }

  // Search for similar signals (optional context)
  const similarSignals = await searchSimilarSignals(query);
  console.log(`[Agent 2] Found ${similarSignals.length} similar signals`);

  // Analyze with AI
  const analysis = await analyzeCase(query, matchedPattern, similarSignals);

  console.log(`[Agent 2] Analysis complete - Category: ${analysis.issueCategory}, Severity: ${analysis.severity}`);

  return analysis;
}
