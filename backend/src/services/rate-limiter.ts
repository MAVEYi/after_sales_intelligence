import "dotenv/config";

/**
 * Rate Limiter for AI Agents
 * 
 * Prevents agents from exceeding Groq API limits:
 * - llama-3.1-8b-instant: 30 RPM, 14,400 RPD
 * 
 * Tracks calls per agent and enforces limits
 */

interface RateLimitConfig {
  maxCallsPerMinute: number;
  maxCallsPerDay: number;
  agentName: string;
}

interface CallRecord {
  timestamp: number;
  agentName: string;
}

class RateLimiter {
  private callLog: CallRecord[] = [];
  private isThrottling = false;

  /**
   * Check rate limits and wait if necessary
   * Throws error if daily limit exceeded
   */
  async checkAndWait(config: RateLimitConfig): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Clean up old entries (beyond 24 hours)
    this.callLog = this.callLog.filter((c) => c.timestamp > oneDayAgo);

    // Count calls for this agent
    const agentCalls = this.callLog.filter((c) => c.agentName === config.agentName);
    const callsLastMinute = agentCalls.filter((c) => c.timestamp > oneMinuteAgo).length;
    const callsLastDay = agentCalls.length;

    // Check daily limit first (hard stop)
    if (callsLastDay >= config.maxCallsPerDay) {
      console.error(`[RateLimiter] ${config.agentName} exceeded daily limit: ${callsLastDay}/${config.maxCallsPerDay}`);
      throw new Error(`Daily rate limit exceeded for ${config.agentName}. Please try again tomorrow.`);
    }

    // Check per-minute limit (throttle)
    if (callsLastMinute >= config.maxCallsPerMinute) {
      this.isThrottling = true;
      const oldestRecentCall = agentCalls
        .filter((c) => c.timestamp > oneMinuteAgo)
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      
      const waitMs = 61000 - (now - oldestRecentCall.timestamp); // Wait until 1 minute + 1 sec
      
      console.log(`[RateLimiter] ${config.agentName} throttled - waiting ${Math.ceil(waitMs / 1000)}s (${callsLastMinute}/${config.maxCallsPerMinute} RPM)`);
      
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      this.isThrottling = false;
    }

    // Log this call
    this.callLog.push({
      timestamp: now,
      agentName: config.agentName,
    });
  }

  /**
   * Get current usage stats
   */
  getStats(agentName?: string): {
    totalCalls24h: number;
    callsLastMinute: number;
    byAgent: Record<string, { lastMinute: number; last24h: number }>;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const recentCalls = this.callLog.filter((c) => c.timestamp > oneDayAgo);

    if (agentName) {
      const agentCalls = recentCalls.filter((c) => c.agentName === agentName);
      return {
        totalCalls24h: agentCalls.length,
        callsLastMinute: agentCalls.filter((c) => c.timestamp > oneMinuteAgo).length,
        byAgent: {},
      };
    }

    // Aggregate by agent
    const byAgent: Record<string, { lastMinute: number; last24h: number }> = {};
    
    recentCalls.forEach((call) => {
      if (!byAgent[call.agentName]) {
        byAgent[call.agentName] = { lastMinute: 0, last24h: 0 };
      }
      byAgent[call.agentName].last24h++;
      if (call.timestamp > oneMinuteAgo) {
        byAgent[call.agentName].lastMinute++;
      }
    });

    return {
      totalCalls24h: recentCalls.length,
      callsLastMinute: recentCalls.filter((c) => c.timestamp > oneMinuteAgo).length,
      byAgent,
    };
  }

  /**
   * Clear all rate limit history (for testing)
   */
  reset(): void {
    this.callLog = [];
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Default configs for each agent
export const RATE_LIMIT_CONFIGS = {
  agent_1: {
    agentName: "agent_1_classifier",
    maxCallsPerMinute: 10, // Conservative (API allows 30)
    maxCallsPerDay: 500,   // For ~500 signals/day max
  },
  agent_2: {
    agentName: "agent_2_extractor",
    maxCallsPerMinute: 10,
    maxCallsPerDay: 200,   // Less frequent
  },
  agent_3: {
    agentName: "agent_3_analyzer",
    maxCallsPerMinute: 15,
    maxCallsPerDay: 7000,  // Main user-facing (100 users × 2 calls × safety margin)
  },
  agent_4: {
    agentName: "agent_4_guidance",
    maxCallsPerMinute: 15,
    maxCallsPerDay: 7000,  // Main user-facing
  },
};

/**
 * Wrapper for Groq calls with automatic rate limiting
 */
export async function callWithRateLimit<T>(
  agentName: keyof typeof RATE_LIMIT_CONFIGS,
  fn: () => Promise<T>
): Promise<T> {
  const config = RATE_LIMIT_CONFIGS[agentName];
  await rateLimiter.checkAndWait(config);
  return fn();
}
