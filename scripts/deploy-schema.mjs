// Deploy database schema to Supabase via Management API
// Usage: node scripts/deploy-schema.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const supabase = createClient(
  "https://lgzncjukveeclwdclimp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnem5janVrdmVlY2x3ZGNsaW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2MTc0MSwiZXhwIjoyMDg2MzM3NzQxfQ.uH7Sn2NsGjfui3YdZ7l6s11qylQC4NHXPV3fyRKZFAI",
  { db: { schema: "public" } }
);

const migrations = [
  "001_initial_schema.sql",
  "002_rls_policies.sql",
  "003_seed_communities.sql",
];

async function deploySql(sql, name) {
  console.log(`Deploying ${name}...`);
  const { data, error } = await supabase.rpc("exec_sql", { query: sql });
  if (error) {
    // rpc might not exist, try direct pg approach
    return { error };
  }
  return { data };
}

// Try using fetch directly to Supabase pg-meta endpoint
async function runSqlViaApi(sql, name) {
  console.log(`Running ${name}...`);
  const res = await fetch(
    "https://lgzncjukveeclwdclimp.supabase.co/pg/query",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnem5janVrdmVlY2x3ZGNsaW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2MTc0MSwiZXhwIjoyMDg2MzM3NzQxfQ.uH7Sn2NsGjfui3YdZ7l6s11qylQC4NHXPV3fyRKZFAI",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnem5janVrdmVlY2x3ZGNsaW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2MTc0MSwiZXhwIjoyMDg2MzM3NzQxfQ.uH7Sn2NsGjfui3YdZ7l6s11qylQC4NHXPV3fyRKZFAI",
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const text = await res.text();
  if (!res.ok) {
    console.error(`  Error (${res.status}): ${text}`);
    return false;
  }
  console.log(`  OK`);
  return true;
}

async function main() {
  for (const migration of migrations) {
    const sql = readFileSync(
      join(root, "supabase", "migrations", migration),
      "utf-8"
    );
    const ok = await runSqlViaApi(sql, migration);
    if (!ok) {
      console.log(
        "\nCould not deploy via API. Please run the SQL files manually:"
      );
      console.log("  1. Go to https://supabase.com/dashboard");
      console.log("  2. Open your project > SQL Editor");
      console.log("  3. Run each file in supabase/migrations/ in order");
      process.exit(1);
    }
  }
  console.log("\nAll migrations deployed successfully!");

  // Verify by querying communities
  const { data, error } = await supabase.from("communities").select("slug, name");
  if (error) {
    console.log("Warning: Could not verify communities table:", error.message);
  } else {
    console.log(`\nVerification: Found ${data.length} communities:`);
    data.forEach((c) => console.log(`  - ${c.name} (/c/${c.slug})`));
  }
}

main().catch(console.error);
