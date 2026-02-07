import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "./db/client";
import { generalLimiter } from "./middleware/rate-limit";
import signalRoutes from "./api/signals";
import userRoutes from "./api/user";

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Security headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// CORS - Restrict to Vercel domains only
const allowedOrigins = [
  process.env.FRONTEND_URL_PRODUCTION || "https://consumaarg.vercel.app",
  process.env.FRONTEND_URL_DEV || "https://after-sales-frontend.vercel.app",
  "http://localhost:3000", // Local dev
  "http://localhost:4000", // Backend dev/testing
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      // Security: Only allow our own Vercel previews
      const isOurVercelPreview =
        origin.endsWith(".vercel.app") &&
        (origin.includes("after-sales") || origin.includes("consumaarg"));

      if (allowedOrigins.includes(origin) || isOurVercelPreview) {
        callback(null, true);
      } else {
        console.log(`[CORS] Rejected origin: ${origin}`);
        callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Rate limiting - Apply to all API routes
app.use("/api/", generalLimiter);

app.use(express.json());

// ---- Supabase client ----
// Use service role key for backend (bypasses RLS, full access)
// NEVER expose this key to frontend!
// ---- Supabase client ----
// Moved to db/client.ts to avoid circular dependencies
// export const supabase = ...

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
// Only start server if run directly (not imported)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}
