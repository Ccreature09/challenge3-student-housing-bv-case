import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from the same folder as database.ts
dotenv.config({
    path: path.resolve(__dirname, ".env.local"),
    override: true
});

// Read environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        "Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.local"
    );
}

// Create Supabase client
export const supabase = createClient(
    supabaseUrl,
    supabaseKey
);

// Test database connection
export async function testConnection() {
    console.log("Connecting to Supabase...");

    const { data, error } = await supabase
        .from("USERS")
        .select("*")
        .limit(5);

    if (error) {
        console.error("Supabase connection error:", error.message);
        return;
    }

    console.log("Successfully connected to Supabase!");
    console.table(data);
}

// Run connection test
testConnection();