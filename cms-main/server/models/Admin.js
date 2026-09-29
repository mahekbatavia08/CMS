import bcrypt from "bcryptjs";
import supabase, { unwrap } from "../config/supabase.js";
import { newObjectId, isValidObjectId } from "../utils/objectId.js";

const TABLE = "admins";

/**
 * Row (snake_case) -> API shape (same keys the Mongoose model returned).
 * Password is only included when `withPassword` is true.
 */
const toAdmin = (row, withPassword = false) => {
  if (!row) return null;
  const admin = {
    _id: row.id,
    name: row.name,
    email: row.email,
    isActive: row.is_active,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
  if (withPassword) admin.password = row.password;
  return admin;
};

/** Strips the password (replacement for the old toJSON transform). */
const toAdminJSON = (admin) => {
  if (!admin) return admin;
  const { password, ...rest } = admin;
  return rest;
};

const findAdminByEmail = async (email, { withPassword = false } = {}) => {
  const row = unwrap(
    await supabase
      .from(TABLE)
      .select("*")
      .eq("email", String(email).toLowerCase().trim())
      .maybeSingle(),
  );
  return toAdmin(row, withPassword);
};

const findAdminById = async (id) => {
  if (!isValidObjectId(String(id))) return null;
  const row = unwrap(
    await supabase.from(TABLE).select("*").eq("id", String(id)).maybeSingle(),
  );
  return toAdmin(row);
};

/**
 * Creates an admin, hashing the password (replacement for the pre("save") hook).
 */
const createAdmin = async ({ name, email, password, isActive = true }) => {
  if (!name || !String(name).trim()) throw new Error("Name is required");
  if (!email || !String(email).trim()) throw new Error("Email is required");
  if (!password) throw new Error("Password is required");
  if (String(password).length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(String(password), salt);

  const row = unwrap(
    await supabase
      .from(TABLE)
      .insert({
        id: newObjectId(),
        name: String(name).trim(),
        email: String(email).toLowerCase().trim(),
        password: hashed,
        is_active: isActive,
      })
      .select("*")
      .single(),
  );
  return toAdmin(row);
};

/**
 * Compares a plaintext candidate password against the stored hash.
 * `admin` must have been loaded with { withPassword: true }.
 */
const comparePassword = async (admin, candidatePassword) =>
  bcrypt.compare(candidatePassword, admin.password);

export { findAdminByEmail, findAdminById, createAdmin, comparePassword, toAdminJSON };
