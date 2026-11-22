import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Locate .env.local in the same folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, ".env.local"),
    override: true
});

// Load credentials
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

// Connect to Supabase
export const supabase = createClient(
    supabaseUrl,
    supabaseKey
);

// Fetch first 5 users
export async function testConnection() {
    const result = await supabase
        .from("USERS")
        .select("*", { count: "exact" })
        .limit(5);

    console.log("Error:", result.error);
    console.log("Count:", result.count);
    console.log("Data:", result.data);
}

// Execute test
testConnection();