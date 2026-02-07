import "dotenv/config";
import Parser from "rss-parser";
import { supabase } from "../index";

/**
 * Agent 0: RSS Feed Intake
 *
 * Purpose: Fetch raw signals from RSS feeds (Reddit, News, Complaint Sites)
 * Writes to: db1_signals (raw intake tier)
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
// In production, this could move to a database table (db0_feeds)
const RSS_FEEDS: FeedConfig[] = [
  {
    id: "consumer_complaints_in",
    name: "ConsumerComplaints.in",
    url: "http://www.consumercomplaints.in/rss.php",
  },
  {
    id: "reddit_indian_gaming",
    name: "Reddit r/IndianGaming",
    url: "https://www.reddit.com/r/IndianGaming/new/.rss",
  },
  {
    id: "reddit_india_tech",
    name: "Reddit r/IndiaTech",
    url: "https://www.reddit.com/r/IndiaTech/new/.rss",
  },
  {
    id: "reddit_cars_india",
    name: "Reddit r/CarsIndia",
    url: "https://www.reddit.com/r/CarsIndia/new/.rss",
  },
  {
    id: "reddit_legal_advice_india",
    name: "Reddit r/LegalAdviceIndia",
    url: "https://www.reddit.com/r/LegalAdviceIndia/new/.rss",
  },
  {
    id: "gnews_service_scam",
    name: "Google News - Service Scams",
    url: "https://news.google.com/rss/search?q=service+center+scam+India+OR+warranty+denied+India&hl=en-IN&gl=IN&ceid=IN:en",
  },
];

/**
 * Fetch RSS feed and parse items
 */
async function fetchRSSFeed(feed: FeedConfig): Promise<RSSSignal[]> {
  console.log(`[Agent 0] Fetching ${feed.name}...`);

  try {
    const feedData = await parser.parseURL(feed.url);

    // Basic validation
    if (!feedData.items || feedData.items.length === 0) {
      console.log(`[Agent 0] No items found in ${feed.name}`);
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
    if (error.code === 'ECONNREFUSED' || error.message.includes('429')) {
      console.warn(`[Agent 0] Network/Rate limit error for ${feed.name}: ${error.message}`);
    } else {
      console.error(`[Agent 0] Error fetching ${feed.name}:`, error.message);
    }
    return [];
  }
}

/**
 * Check if signal already exists (duplicate detection)
 * Optimized to check batch of URLs if possible, but for now single check is safer
 */
async function filterDuplicates(signals: RSSSignal[]): Promise<RSSSignal[]> {
  const uniqueSignals: RSSSignal[] = [];
  
  // Get list of URLs to check
  const urlsToCheck = signals.map(s => s.sourceUrl).filter(u => !!u);

  if (urlsToCheck.length === 0) return [];

  // Check db1_signals for these URLs (Batch check)
  const { data: existing, error } = await supabase
    .from("db1_signals")
    .select("source_url")
    .in("source_url", urlsToCheck);

  if (error) {
    console.error("[Agent 0] Error checking duplicates:", error);
    return []; // Fail safe: don't import if we can't check dups
  }

  const existingUrls = new Set(existing?.map(r => r.source_url));

  for (const signal of signals) {
    if (!signal.sourceUrl) continue;
    
    if (!existingUrls.has(signal.sourceUrl)) {
      uniqueSignals.push(signal);
    }
  }

  return uniqueSignals;
}

/**
 * Store signals in db1_signals table
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

  const { data, error } = await supabase.from("db1_signals").insert(records).select();

  if (error) {
    console.error("[Agent 0] Error storing signals:", error);
    return 0;
  }

  return data.length;
}

const RELEVANCE_KEYWORDS = [
  "scam", "fraud", "fake", "cheat",
  "service", "warranty", "repair", "defect", "broken",
  "support", "ticket", "issue", "problem", "complaint",
  "refund", "charged", "bill", "invoice", "delivery",
  "customer care", "not working", "fail", "damage"
];

/**
 * Clean signal content (remove HTML, normalize whitespace)
 */
function cleanContent(text: string): string {
  if (!text) return "";
  
  return text
    .replace(/<[^>]*>?/gm, " ") // Remove HTML tags
    .replace(/&nbsp;/g, " ")     // Remove non-breaking spaces
    .replace(/&amp;/g, "&")      // Decode &
    .replace(/&quot;/g, '"')     // Decode "
    .replace(/&lt;/g, "<")       // Decode <
    .replace(/&gt;/g, ">")       // Decode >
    .replace(/\s+/g, " ")        // Normalize whitespace
    .trim();
}

/**
 * Check if signal is relevant based on keywords
 */
function isRelevant(title: string, content: string): boolean {
  const text = (title + " " + content).toLowerCase();
  return RELEVANCE_KEYWORDS.some(keyword => text.includes(keyword));
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
  let totalNew = 0;

  // Process feeds sequentially to be gentle on network/CPU
  for (const feed of RSS_FEEDS) {
    const signals = await fetchRSSFeed(feed);
    
    if (signals.length > 0) {
      const uniqueSignals = await filterDuplicates(signals);
      
      const relevantSignals: RSSSignal[] = [];
      
      for (const signal of uniqueSignals) {
        // Clean content FIRST
        signal.title = cleanContent(signal.title);
        signal.content = cleanContent(signal.content);
        
        // Filter SECOND
        if (isRelevant(signal.title, signal.content)) {
          relevantSignals.push(signal);
        }
      }
      
      if (relevantSignals.length > 0) {
        const storedCount = await storeSignals(relevantSignals);
        results[feed.id] = storedCount;
        totalNew += storedCount;
        console.log(`[Agent 0] Saved ${storedCount} relevant items from ${feed.name} (filtered ${uniqueSignals.length - relevantSignals.length} irrelevant)`);
      } else {
        console.log(`[Agent 0] No relevant items from ${feed.name} (checked ${uniqueSignals.length})`);
      }
    }
  }

  console.log("==================================================");
  console.log("[Agent 0] RSS Feed Intake Agent - COMPLETE");
  console.log(`[Agent 0] Total new signals collected: ${totalNew}`);
  console.log("==================================================");

  return { total: totalNew, sources: results };
}
