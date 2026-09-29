import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Keep only "https://<ref>.supabase.co" (drops /rest/v1, trailing slash, spaces, quotes)
const RAW_SUPABASE_URL = (process.env.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
const SUPABASE_URL = RAW_SUPABASE_URL ? new URL(RAW_SUPABASE_URL).origin : "";
// Server-only key: legacy "service_role" JWT or new "sb_secret_..." key.
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "cms-media";
// "public" (own project) or "cms" (shared project, see supabase/schema-cms.sql)
const DB_SCHEMA = process.env.SUPABASE_DB_SCHEMA || "public";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in environment variables",
    );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    db: { schema: DB_SCHEMA },
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});

/**
 * Unwraps a supabase-js response: throws on error, returns data otherwise.
 */
const unwrap = ({ data, error }) => {
    if (error) {
        const err = new Error(error.message || "Supabase request failed");
        err.code = error.code;
        err.details = error.details;
        throw err;
    }
    return data;
};

export { SUPABASE_URL, STORAGE_BUCKET, unwrap };
export default supabase;
