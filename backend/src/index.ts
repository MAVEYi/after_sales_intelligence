import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import signalRoutes from "./api/signals";
import userRoutes from "./api/user";

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for all origins (can restrict later)
app.use(cors());

app.use(express.json());

// ---- Supabase client ----
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// ---- API Routes ----
app.use("/api/signals", signalRoutes);
app.use("/api/user", userRoutes);

// ---- Existing routes ----
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.send("After Sales Intelligence API - Alpha 2");
});

// ---- Existing cases API ----
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

// ---- Server start ----
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
