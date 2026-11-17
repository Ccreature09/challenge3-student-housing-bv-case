import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
const { parsed, error } = config({ path: envPath });

if (error) {
  throw error;
}

const databaseUrl = parsed?.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(`DATABASE_URL is missing from ${envPath}`);
}

export default defineConfig({
  schema: "./supabase/migrations/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
