import supabase, { unwrap } from "../config/supabase.js";

/**
 * Autocomplete suggestions for a filter type (top 10, most used first).
 * Returns [{ value, usageCount }] — same shape as before.
 */
const findSuggestions = async (type, query = "") => {
  const rows = unwrap(
    await supabase.rpc("get_filter_suggestions", {
      p_type: type,
      p_query: query || "",
    }),
  );
  return rows || [];
};

/**
 * Upserts a (type, value) pair and increments its usageCount atomically.
 */
const incrementValue = async (type, value) => {
  unwrap(
    await supabase.rpc("increment_filter_value", {
      p_type: type,
      p_value: value,
    }),
  );
};

export { findSuggestions, incrementValue };