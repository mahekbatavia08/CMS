import dotenv from "dotenv";

dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";

/**
 * One-time seed script to create the first admin user.
 * Intended to be run manually from the command line:
 *
 *   npm run seed:admin
 *
 * Reads credentials from environment variables so no credentials are
 * hardcoded in source control:
 *   SEED_ADMIN_NAME
 *   SEED_ADMIN_EMAIL
 *   SEED_ADMIN_PASSWORD
 *
 * If an admin with the given email already exists, the script exits
 * without making changes.
 */
const seedAdmin = async () => {
  try {
    await connectDB();

    const name = process.env.SEED_ADMIN_NAME;
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error(
        "SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD must be set in .env before running this script"
      );
    }

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });

    if (existingAdmin) {
      console.log(`Admin with email "${email}" already exists. No changes made.`);
      process.exit(0);
    }

    const admin = await Admin.create({ name, email, password });

    console.log("Admin user created successfully:");
    console.log(`  Name:  ${admin.name}`);
    console.log(`  Email: ${admin.email}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedAdmin();