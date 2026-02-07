import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// ---- Supabase client ----
// Use service role key for backend (bypasses RLS, full access)
// NEVER expose this key to frontend!

const supabaseUrl = process.env.SUPABASE_URL?.trim() || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

console.log("DEBUG [db/client.ts]: URL:", supabaseUrl);
console.log("DEBUG [db/client.ts]: Key length:", supabaseKey.length);
if (supabaseKey.length > 10) {
  console.log("DEBUG [db/client.ts]: Key start:", supabaseKey.substring(0, 10));
}

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL: Supabase credentials missing (checked in db/client.ts)!");
  throw new Error("Supabase credentials missing");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
