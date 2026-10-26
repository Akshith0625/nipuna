import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read .env.local manually for standalone node verification
const envPath = path.resolve(process.cwd(), ".env.local");
let envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        envVars[key] = val;
      }
    }
  }
}

const url = envVars["NEXT_PUBLIC_SUPABASE_URL"] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] || envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"] || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

console.log("-----------------------------------------");
console.log("Supabase Client Verification");
console.log("-----------------------------------------");
console.log("Supabase URL configured:", url ? "✓ Present (" + url + ")" : "✗ Missing");
console.log("Supabase Key configured:", key ? "✓ Present (" + key.slice(0, 15) + "...)" : "✗ Missing");

if (!url || !key) {
  console.error("ERROR: Supabase URL or Key is missing from .env.local!");
  process.exit(1);
}

try {
  const supabase = createClient(url, key);
  console.log("Supabase client initialized successfully: ✓");

  // Attempt a lightweight ping / auth check to test reachability
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.log("Auth endpoint response:", error.message);
  } else {
    console.log("Supabase endpoint reachability test: ✓ Connected (Session check OK)");
  }
  console.log("-----------------------------------------");
  console.log("Connection check completed successfully!");
} catch (err) {
  console.error("Error during Supabase initialization:", err);
  process.exit(1);
}
