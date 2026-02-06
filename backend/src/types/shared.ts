/**
 * Shared TypeScript types for agents and API
 */

export interface UserQuery {
  brand: string;
  product: string;
  issue: string;
  city?: string;
  state?: string;
}

export interface CasePattern {
  id: string;
  brand_name: string;
  product_category?: string;
  issue_type: string;
  typical_resolution_path: string;
  average_resolution_days: number;
  success_rate: number;
  escalation_strategy: string;
  legal_basis: string;
  based_on_cases_count?: number;
}

export interface CaseAnalysis {
  issueCategory: string;
  severity: string;
  matchedPatternId: string | null;
  matchedPattern: CasePattern | null;
  similarSignalIds: string[];
  similarCasesCount: number;
  confidenceLevel: string;
}

export interface ContactInfo {
  type: string;
  value: string;
  city?: string;
  purpose?: string;
  priority?: number;
}

export interface Guidance {
  summary: string;
  suggestedSteps: string[];
  contacts: ContactInfo[];
  expectations: string;
  legalRights: string;
  confidenceLevel: string;
  similarCases: number;
  severity: string;
}
