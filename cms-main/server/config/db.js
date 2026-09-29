import supabase, { STORAGE_BUCKET } from "./supabase.js";

/**
 * Verifies the Supabase connection (database + storage bucket) on startup.
 * Exits the process if the database is unreachable, same as before.
 */
const connectDB = async () => {
  try {
    const { error } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true });

    if (error) {
      throw new Error(error.message || "Unable to query the projects table");
    }

    console.log(`Supabase Connected: ${new URL(process.env.SUPABASE_URL).host}`);

    const { error: bucketError } = await supabase.storage.getBucket(STORAGE_BUCKET);
    if (bucketError) {
      console.warn(
        `Storage bucket "${STORAGE_BUCKET}" not reachable: ${bucketError.message}. ` +
          "Run supabase/schema.sql or create the bucket in the dashboard.",
      );
    }
  } catch (error) {
    console.error("Supabase Connection Error:");
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;
