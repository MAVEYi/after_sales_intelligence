import "dotenv/config";
import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// ---- Supabase client (ADD THIS) ----
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// ---- Existing routes (KEEP) ----
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.send("After Sales Intelligence API");
});

// ---- NEW route: read-only cases API ----
app.get("/cases", async (_req, res) => {
  const { data, error } = await supabase
    .from("db3_cases")
    .select("*")
    .limit(50);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// ---- Server start (KEEP) ----
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
