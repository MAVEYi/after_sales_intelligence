
import "dotenv/config";
import { supabase } from "../db/client";
import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Agent 3: Contact Hunter
 * 
 * Purpose: Find support contacts (Email/Phone) for brands identified in verified signals
 * Inputs: db1_verified_signals (agent3_status='pending')
 * Outputs: db2_contact_extractions
 */

// Regex Patterns
const REGEX_EMAIL = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
const REGEX_PHONE_INDIA_MOBILE = /(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}/g; 
const REGEX_PHONE_TOLLFREE = /1800[-\s]?\d{3}[-\s]?\d{3,4}/g;

export async function runAgent3() {
  console.log("==================================================");
  console.log("[Agent 3] Contact Hunter - STARTING");
  console.log("==================================================");

  // 1. Fetch pending verified signals
  const { data: signals, error } = await supabase
    .from("db1_verified_signals")
    .select("id, brand")
    .eq("agent3_status", "pending")
    .not("brand", "is", null)
    .limit(10); // Batch size

  if (error) {
    console.error("[Agent 3] Error fetching signals:", error);
    return;
  }

  if (!signals || signals.length === 0) {
    console.log("[Agent 3] No pending verified signals found.");
    return;
  }

  console.log(`[Agent 3] Processing ${signals.length} signals...`);

  for (const signal of signals) {
    if (!signal.brand) continue;
    await processSignal(signal.id, signal.brand);
  }

  console.log("==================================================");
  console.log("[Agent 3] Contact Hunter - COMPLETE");
  console.log("==================================================");
}

async function processSignal(signalId: string, brandName: string) {
  console.log(`[Agent 3] Processing signal ${signalId} for brand: ${brandName}`);

  // 2. Check Cache ({Golden Data} db3_brand_contacts)
  const { data: cachedContacts, error: cacheError } = await supabase
    .from("db3_brand_contacts")
    .select("*")
    .eq("brand_name", brandName);

  if (!cacheError && cachedContacts && cachedContacts.length > 0) {
    console.log(`[Agent 3] Cache HIT for ${brandName}. Linking ${cachedContacts.length} contacts.`);
    
    // Copy to db2_contact_extractions
    const extractions = cachedContacts.map(c => ({
      verified_signal_id: signalId,
      brand_name: brandName,
      contact_type: c.contact_type,
      contact_value: c.contact_value,
      source_url: "db3_cache",
      confidence_score: 1.0, // High confidence since it's from Golden Data
    }));

    await saveExtractions(extractions);
    await markSignalProcessed(signalId);
    return;
  }

  // 3. Cache MISS -> Scrape Web
  console.log(`[Agent 3] Cache MISS for ${brandName}. Initiating Web Search...`);
  
  const extractedContacts = await scrapeContacts(brandName);
  
  if (extractedContacts.length > 0) {
    // Add signal_id to extractions
    const finalExtractions = extractedContacts.map(c => ({
      ...c,
      verified_signal_id: signalId
    }));
    
    await saveExtractions(finalExtractions);
  } else {
    console.log(`[Agent 3] No contacts found for ${brandName}.`);
  }

  await markSignalProcessed(signalId);

  // Sleep to avoid rate limits
  await new Promise(r => setTimeout(r, 2000));
}

async function scrapeContacts(brandName: string): Promise<any[]> {
    try {
        const query = `${brandName} India customer care contact email`;
        const searchUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        };

        const { data: searchHtml } = await axios.get(searchUrl, { headers, timeout: 10000 });
        const $ = cheerio.load(searchHtml);
        let firstResultLink = $(".result-link").first().attr("href");

        if (!firstResultLink) return [];

        console.log(`[Agent 3] Visiting: ${firstResultLink}`);
        const { data: pageHtml } = await axios.get(firstResultLink, { headers, timeout: 15000 });
        const $page = cheerio.load(pageHtml);
        const textContent = $page("body").text();

        const contacts: any[] = [];
        const uniqueValues = new Set();

        // Emails
        const emails = textContent.match(REGEX_EMAIL) || [];
        emails.forEach(email => {
            if (!uniqueValues.has(email) && !email.includes("w3.org") && !email.includes("example.com")) {
                uniqueValues.add(email);
                contacts.push({
                    brand_name: brandName,
                    contact_type: "email",
                    contact_value: email,
                    source_url: firstResultLink,
                    confidence_score: 0.7
                });
            }
        });

        // Phones
        const phones = [...(textContent.match(REGEX_PHONE_INDIA_MOBILE) || []), ...(textContent.match(REGEX_PHONE_TOLLFREE) || [])];
        phones.forEach(phone => {
            const clean = phone.replace(/\D/g, "");
            if (clean.length >= 10 && !uniqueValues.has(phone)) {
                uniqueValues.add(phone);
                contacts.push({
                    brand_name: brandName,
                    contact_type: "phone",
                    contact_value: phone.trim(),
                    source_url: firstResultLink,
                    confidence_score: 0.7
                });
            }
        });

        return contacts.slice(0, 5); // Limit resultCount

    } catch (error) {
        console.error(`[Agent 3] Scraping error for ${brandName}:`, (error as Error).message);
        return [];
    }
}

async function saveExtractions(records: any[]) {
    if (records.length === 0) return;
    const { error } = await supabase.from("db2_contact_extractions").insert(records);
    if (error) console.error("[Agent 3] Error saving extractions:", error);
    else console.log(`[Agent 3] Saved ${records.length} extractions.`);
}

async function markSignalProcessed(signalId: string) {
    const { error } = await supabase
        .from("db1_verified_signals")
        .update({ agent3_status: "completed" })
        .eq("id", signalId);
        
    if (error) console.error("[Agent 3] Error updating status:", error);
}

if (require.main === module) {
  runAgent3();
}
