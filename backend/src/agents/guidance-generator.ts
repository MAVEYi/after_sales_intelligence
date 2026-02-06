import "dotenv/config";
import { supabase } from "../index";
import { callGroq, parseJSONFromLLM } from "../services/groq";
import { rateLimiter, RATE_LIMIT_CONFIGS } from "../services/rate-limiter";
import type { UserQuery, CasePattern, CaseAnalysis, ContactInfo, Guidance } from "../types/shared";

/**
 * Agent 4: Guidance Generator
 * 
 * Purpose: Generate actionable guidance using case patterns + contacts
 * Reads from: db3_brand_contacts, db3_case_patterns (via analysis)
 * Writes to: db4_user_queries
 * LLM Calls: 1 per user query
 */


/**
 * Fetch brand contacts from db3, prioritized by purpose and location
 */
async function fetchBrandContacts(
  brand: string,
  issuePurpose: string,
  city?: string
): Promise<ContactInfo[]> {
  // Determine relevant purposes based on issue type
  const purposes = [issuePurpose, "general_support"];

  let query = supabase
    .from("db3_brand_contacts")
    .select("contact_type, contact_value, city, state, purpose, priority")
    .eq("is_active", true)
    .ilike("brand_name", `%${brand}%`)
    .in("purpose", purposes)
    .order("priority", { ascending: true })
    .limit(10);

  const { data, error } = await query;

  if (error) {
    console.error("[Agent 4] Error fetching contacts:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  const contacts: ContactInfo[] = data.map((c) => ({
    type: c.contact_type,
    value: c.contact_value,
    city: c.city || undefined,
    purpose: c.purpose || undefined,
    priority: c.priority || 5,
  }));

  // Prioritize city-specific contacts if city provided
  if (city) {
    const cityContacts = contacts.filter((c) => c.city?.toLowerCase() === city.toLowerCase());
    const otherContacts = contacts.filter((c) => !c.city || c.city.toLowerCase() !== city.toLowerCase());
    return [...cityContacts, ...otherContacts];
  }

  return contacts;
}

/**
 * Generate guidance using AI + case pattern knowledge
 */
async function generateGuidance(
  query: UserQuery,
  analysis: CaseAnalysis,
  contacts: ContactInfo[]
): Promise<Guidance> {
  const pattern = analysis.matchedPattern;

  const prompt = `Generate actionable consumer guidance using the proven resolution strategy.

USER QUERY:
- Brand: ${query.brand}
- Product: ${query.product}
- Issue: ${query.issue}
- Location: ${query.city || "N/A"}, ${query.state || "N/A"}

PROVEN RESOLUTION STRATEGY${pattern ? ` (Success Rate: ${pattern.success_rate * 100}%, Based on ${pattern.based_on_cases_count} cases)` : ""}:
${pattern ? pattern.typical_resolution_path : "No proven pattern available - provide general guidance"}

ESCALATION STRATEGY:
${pattern ? pattern.escalation_strategy : "Escalate via consumer forum if unresolved"}

LEGAL BASIS:
${pattern ? pattern.legal_basis : "Consumer Protection Act 2019"}

AVAILABLE CONTACTS:
${JSON.stringify(contacts.slice(0, 5), null, 2)}

Provide guidance in this EXACT JSON format:
{
  "summary": "Brief 2-3 sentence summary referencing the proven strategy",
  "suggestedSteps": [
    "Specific actionable steps using actual contact values from above"
  ],
  "expectations": "Realistic timeline based on proven ${pattern ? pattern.average_resolution_days + '-day average' : 'experience'}",
  "legalRights": "Brief legal rights info"
}

Be specific, use actual contact info, cite success rates.`;

  const systemPrompt = `You are a consumer rights advisor. Use proven case patterns to provide evidence-based guidance.`;

  try {
    await rateLimiter.checkAndWait(RATE_LIMIT_CONFIGS.agent_4);

    const response = await callGroq(prompt, systemPrompt, {
      temperature: 0.4,
      maxTokens: 2048,
    });

    const parsed = parseJSONFromLLM(response);

    return {
      summary: parsed.summary || `We're analyzing your ${analysis.issueCategory} issue with ${query.brand}.`,
      suggestedSteps: parsed.suggestedSteps || [
        `Contact ${query.brand} customer support`,
        "Document all communications",
        "Request written responses",
      ],
      contacts: contacts,
      expectations: parsed.expectations || `Typical resolution: ${pattern?.average_resolution_days || 14} days`,
      legalRights: parsed.legalRights || pattern?.legal_basis || "Consumer Protection Act 2019 protects your rights",
      confidenceLevel: analysis.confidenceLevel,
      similarCases: pattern?.based_on_cases_count || analysis.similarCasesCount,
      severity: analysis.severity,
    };
  } catch (error) {
    console.error("[Agent 4] Guidance generation failed:", error);

    // Fallback using pattern data
    return {
      summary: pattern
        ? `Based on ${pattern.based_on_cases_count} similar cases, this ${pattern.issue_type} issue typically resolves in ${pattern.average_resolution_days} days.`
        : `We're here to help with your ${query.brand} issue.`,
      suggestedSteps: pattern
        ? pattern.typical_resolution_path.split(".").map((s) => s.trim())
        : [`Contact ${query.brand} customer support`, "Document all communications"],
      contacts: contacts,
      expectations: pattern
        ? `Average resolution time: ${pattern.average_resolution_days} days. Success rate: ${pattern.success_rate * 100}%`
        : "Resolution times vary by brand response",
      legalRights: pattern?.legal_basis || "Consumer Protection Act 2019 protects your consumer rights",
      confidenceLevel: pattern ? "medium" : "low",
      similarCases: pattern?.based_on_cases_count || 0,
      severity: analysis.severity,
    };
  }
}

/**
 * Main Agent 4 function
 */
export async function runAgent4(query: UserQuery, analysis: CaseAnalysis): Promise<Guidance> {
  console.log("[Agent 4] Guidance Generator - Generating guidance");

  // Determine contact purpose from issue category
  const purposeMap: Record<string, string> = {
    warranty_dispute: "warranty",
    defect: "service",
    service_delay: "service",
    billing: "general_support",
    other: "general_support",
  };
  const purpose = purposeMap[analysis.issueCategory] || "general_support";

  // Fetch relevant contacts
  const contacts = await fetchBrandContacts(query.brand, purpose, query.city);
  console.log(`[Agent 4] Found ${contacts.length} contacts for ${query.brand} (purpose: ${purpose})`);

  // Generate guidance
  const guidance = await generateGuidance(query, analysis, contacts);

  console.log("[Agent 4] Guidance generation complete");

  return guidance;
}
