import "dotenv/config";
import Parser from "rss-parser";
import { supabase } from "../index";

/**
 * Agent 0: RSS Feed Intake
 * 
 * Purpose: Fetch raw signals from RSS feeds
 * Writes to: db1_signals (raw intake tier)
 * LLM Calls: 0 (deterministic logic only)
 */

const parser = new Parser();

interface RSSSignal {
  source: string;
  sourceUrl: string;
  title: string;
  content: string;
  publishedAt: Date | null;
}

/**
 * Fetch RSS feed and parse items
 */
async function fetchRSSFeed(feedUrl: string, sourceName: string): Promise<RSSSignal[]> {
  console.log(`[Agent 0] Fetching RSS from: ${sourceName}`);
  
  try {
    const feed = await parser.parseURL(feedUrl);
    console.log(`[Agent 0] Found ${feed.items.length} items from ${sourceName}`);

    const signals: RSSSignal[] = feed.items.map((item) => ({
      source: sourceName,
      sourceUrl: item.link || item.guid || "",
      title: item.title || "",
      content: item.contentSnippet || item.content || "",
      publishedAt: item.pubDate ? new Date(item.pubDate) : null,
    }));

    return signals;
  } catch (error: any) {
    console.error(`[Agent 0] Error fetching RSS from ${sourceName}:`, error);
    return [];
  }
}

/**
 * Check if signal already exists (duplicate detection)
 */
async function isDuplicate(sourceUrl: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("db1_signals")
    .select("id")
    .eq("source_url", sourceUrl)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found (good, not a duplicate)
    console.error("[Agent 0] Error checking duplicate:", error);
  }

  return data !== null;
}

/**
 * Store signals in db1_signals table
 */
async function storeSignals(signals: RSSSignal[]): Promise<number> {
  if (signals.length === 0) {
    console.log("[Agent 0] No signals to store");
    return 0;
  }

  const records = signals.map((signal) => ({
    source: signal.source,
    source_url: signal.sourceUrl,
    title: signal.title,
    content: signal.content,
    published_at: signal.publishedAt?.toISOString(),
    status: "pending",
  }));

  const { data, error } = await supabase.from("db1_signals").insert(records).select();

  if (error) {
    console.error("[Agent 0] Error storing signals:", error);
    return 0;
  }

  console.log(`[Agent 0] Successfully stored ${data.length} signals`);
  return data.length;
}

/**
 * Fetch unique (non-duplicate) signals from a feed
 */
async function fetchUniqueSignals(feedUrl: string, sourceName: string): Promise<RSSSignal[]> {
  const allSignals = await fetchRSSFeed(feedUrl, sourceName);
  
  const uniqueSignals: RSSSignal[] = [];
  
  for (const signal of allSignals) {
    if (!signal.sourceUrl) continue; // Skip if no URL
    
    const duplicate = await isDuplicate(signal.sourceUrl);
    if (!duplicate) {
      uniqueSignals.push(signal);
    }
  }

  console.log(`[Agent 0] ${uniqueSignals.length} new unique signals (${allSignals.length - uniqueSignals.length} duplicates skipped)`);
  
  return uniqueSignals;
}

/**
 * Main Agent 0 function
 * Fetches from all configured RSS sources
 */
export async function runAgent0(): Promise<{ total: number; sources: Record<string, number> }> {
  console.log("==================================================");
  console.log("[Agent 0] RSS Feed Intake Agent - STARTING");
  console.log("==================================================");

  const results: Record<string, number> = {};

  // Source 1: ConsumerComplaintsCourt
  const consumerComplainsUrl = process.env.RSS_CONSUMERCOMPLAINS_URL;
  if (consumerComplainsUrl) {
    const signals = await fetchUniqueSignals(consumerComplainsUrl, "consumercomplaintscourt");
    const stored = await storeSignals(signals);
    results["consumercomplaintscourt"] = stored;
  } else {
    console.log("[Agent 0] RSS_CONSUMERCOMPLAINS_URL not configured");
  }

  // Source 2: Reddit r/IndianConsumers (DISABLED - 403 Forbidden)
  // Reddit blocks direct RSS access - need to use Reddit API or alternative sources
  // const redditUrl = process.env.RSS_REDDIT_INDIANCONSUMERS_URL;
  // if (redditUrl) {
  //   const signals = await fetchUniqueSignals(redditUrl, "reddit_r_indianconsumers");
  //   const stored = await storeSignals(signals);
  //   results["reddit_r_indianconsumers"] = stored;
  // } else {
  //   console.log("[Agent 0] RSS_REDDIT_INDIANCONSUMERS_URL not configured");
  // }

  const total = Object.values(results).reduce((sum, count) => sum + count, 0);

  console.log("==================================================");
  console.log("[Agent 0] RSS Feed Intake Agent - COMPLETE");
  console.log(`[Agent 0] Total signals collected: ${total}`);
  console.log("==================================================");

  return { total, sources: results };
}
