
import "dotenv/config";
import Parser from "rss-parser";
import { supabase } from "../db/client";

/**
 * Agent 0: RSS Feed & User Signal Intake
 *
 * Purpose: Fetch raw signals from RSS feeds and Unsolved User Queries
 * Writes to: db1_signal_intake (raw intake tier)
 * LLM Calls: 0 (deterministic logic only)
 */

// Configure parser with User-Agent to avoid Reddit 429 errors
const parser = new Parser({
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  },
});

interface RSSSignal {
  source: string;
  sourceUrl: string;
  title: string;
  content: string;
  publishedAt: Date | null;
}

interface FeedConfig {
  id: string;
  name: string;
  url: string;
}

// Configuration: List of feeds to monitor
const RSS_FEEDS: FeedConfig[] = [
  {
    id: "gnews_service_scam",
    name: "Google News - Service Scams",
    url: "https://news.google.com/rss/search?q=service+center+scam+India+OR+warranty+denied+India&hl=en-IN&gl=IN&ceid=IN:en",
  },
  {
    id: "reddit_indian_gaming",
    name: "Reddit r/IndianGaming",
    url: "https://www.reddit.com/r/IndianGaming/new/.rss",
  },
  {
    id: "consumer_complaints_in",
    name: "ConsumerComplaints.in",
    url: "http://www.consumercomplaints.in/rss.php",
  },
];

const RELEVANCE_KEYWORDS = [
  "scam", "fraud", "fake", "cheat",
  "service", "warranty", "repair", "defect", "broken",
  "support", "ticket", "issue", "problem", "complaint",
  "refund", "charged", "bill", "invoice", "delivery",
  "customer care", "not working", "fail", "damage",
  "chimney", "fridge", "ac", "washing machine" // Added common appliance terms
];

/**
 * Fetch RSS feed and parse items
 */
async function fetchRSSFeed(feed: FeedConfig): Promise<RSSSignal[]> {
  console.log(`[Agent 0] Fetching ${feed.name}...`);

  try {
    const feedData = await parser.parseURL(feed.url);

    if (!feedData.items || feedData.items.length === 0) {
      return [];
    }

    const signals: RSSSignal[] = feedData.items.map((item) => ({
      source: feed.id,
      sourceUrl: item.link || item.guid || "",
      title: item.title || "",
      content: item.contentSnippet || item.content || "",
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
    }));

    return signals;
  } catch (error: any) {
    if (error.code !== 'ECONNREFUSED' && !error.message.includes('429')) {
      console.error(`[Agent 0] Error fetching ${feed.name}:`, error.message);
    }
    return [];
  }
}

/**
 * Filter duplicates
 */
async function filterDuplicates(signals: RSSSignal[]): Promise<RSSSignal[]> {
  const uniqueSignals: RSSSignal[] = [];
  const urlsToCheck = signals.map(s => s.sourceUrl).filter(u => !!u);

  if (urlsToCheck.length === 0) return [];

  const { data: existing, error } = await supabase
    .from("db1_signal_intake")
    .select("source_url")
    .in("source_url", urlsToCheck);

  if (error) return [];

  const existingUrls = new Set(existing?.map(r => r.source_url));

  for (const signal of signals) {
    if (signal.sourceUrl && !existingUrls.has(signal.sourceUrl)) {
      uniqueSignals.push(signal);
    }
  }

  return uniqueSignals;
}

/**
 * Store signals in db1_signal_intake
 */
async function storeSignals(signals: RSSSignal[]): Promise<number> {
  if (signals.length === 0) return 0;

  const records = signals.map((signal) => ({
    source: signal.source,
    source_url: signal.sourceUrl,
    title: signal.title,
    content: signal.content,
    published_at: signal.publishedAt?.toISOString(),
    status: "pending",
  }));

  const { data, error } = await supabase.from("db1_signal_intake").insert(records).select();

  if (error) {
    console.error("[Agent 0] Error storing signals:", error);
    return 0;
  }
  return data.length;
}

function cleanContent(text: string): string {
  if (!text) return "";
  return text.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

function isRelevant(title: string, content: string): boolean {
  const text = (title + " " + content).toLowerCase();
  return RELEVANCE_KEYWORDS.some(keyword => text.includes(keyword));
}

/**
 * Process Unsolved User Signals (Loopback)
 */
async function processUserSignals(): Promise<number> {
    console.log("[Agent 0] Checking for unsolved user signals...");

    // Fetch pending user signals
    const { data: userSignals, error } = await supabase
        .from("db4_user_signal")
        .select("*")
        .eq("status", "pending")
        .limit(20);

    if (error || !userSignals || userSignals.length === 0) {
        return 0;
    }

    console.log(`[Agent 0] Found ${userSignals.length} pending user signals.`);

    let processedCount = 0;

    for (const signal of userSignals) {
        const content = cleanContent(signal.query_content);
        
        // Check relevance (Service related?)
        if (isRelevant(content, "")) {
            // Promote to db1_signal_intake
            const { error: insertError } = await supabase.from("db1_signal_intake").insert({
               source: "user_query_loopback",
               source_url: `user-signal-${signal.id}`, // Unique dummy URL
               title: "User Query Signal",
               content: content,
               published_at: new Date().toISOString(),
               status: "pending" 
            });

            if (!insertError) {
                // Mark as processed
                await supabase.from("db4_user_signal").update({ status: "processed", processed_at: new Date() }).eq("id", signal.id);
                processedCount++;
            } else {
                 console.error(`[Agent 0] Failed to promote signal ${signal.id}:`, insertError);
            }
        } else {
            // Mark as rejected (not relevant)
            await supabase.from("db4_user_signal").update({ status: "rejected", processed_at: new Date() }).eq("id", signal.id);
            console.log(`[Agent 0] User signal ${signal.id} rejected (irrelevant).`);
        }
    }

    return processedCount;
}

/**
 * Main Agent 0 function
 */
export async function runAgent0(): Promise<{ total: number; sources: Record<string, number> }> {
  console.log("==================================================");
  console.log("[Agent 0] Intake Agent (RSS + User Signals) - STARTING");
  console.log("==================================================");

  const results: Record<string, number> = {};
  let totalNew = 0;

  // 1. Process User Signals (Loopback) - Priority High
  const userSignalCount = await processUserSignals();
  if (userSignalCount > 0) {
      results["user_signals"] = userSignalCount;
      totalNew += userSignalCount;
      console.log(`[Agent 0] Promoted ${userSignalCount} user signals to pipeline.`);
  }

  // 2. Process RSS Feeds
  for (const feed of RSS_FEEDS) {
    const signals = await fetchRSSFeed(feed);
    if (signals.length > 0) {
      const uniqueSignals = await filterDuplicates(signals);
      const relevantSignals = uniqueSignals.filter(s => {
          s.title = cleanContent(s.title);
          s.content = cleanContent(s.content);
          return isRelevant(s.title, s.content);
      });
      
      if (relevantSignals.length > 0) {
        const storedCount = await storeSignals(relevantSignals);
        results[feed.id] = storedCount;
        totalNew += storedCount;
        console.log(`[Agent 0] Saved ${storedCount} items from ${feed.name}`);
      }
    }
  }

  console.log("==================================================");
  console.log("[Agent 0] Intake Agent - COMPLETE");
  console.log(`[Agent 0] Total new signals: ${totalNew}`);
  console.log("==================================================");

  return { total: totalNew, sources: results };
}
